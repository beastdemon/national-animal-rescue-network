/**
 * The National Animal Rescue Network — private transport tracking tool
 *
 * PRIVATE and sign-in-gated. Reads and writes the PRIVATE Operations Tracker
 * spreadsheet — a completely different Sheet from the public Website Content
 * Hub that every other apps-script/ mini-app reads. Never point
 * CONFIG.SPREADSHEET_ID at the public hub.
 *
 * Every response this script returns is scoped to the signed-in viewer on
 * the SERVER before it is ever turned into JSON. A non-admin's raw
 * google.script.run response contains only rows where their own email
 * appears as the Assigned Driver, Backup Contact, or Coordinator — see
 * getTransportBoard() and Internal.viewerMatchesTransport(). The write path
 * (logCheckpoint()) independently re-checks that same authorization inside
 * itself, rather than trusting anything the client claims.
 *
 * Only doGet(), getTransportBoard(), and logCheckpoint() are declared as
 * top-level functions in this file. That is a deliberate security boundary,
 * not a style choice: google.script.run can invoke ANY top-level function by
 * name from client-side JS, regardless of a trailing underscore — the
 * underscore is a naming convention only, not a visibility control. Every
 * other helper (the raw, unfiltered sheet loader included) lives as a method
 * on the `Internal` object below, created inside an IIFE, so it has no
 * top-level global name and google.script.run.<name>() fails with
 * "Script function not found" for all of them. Do not lift any Internal.*
 * method back out to the top level — doing so would make it directly
 * callable by any signed-in user, bypassing every filter in this file.
 *
 * This app deliberately does NOT use CacheService anywhere. Every response
 * here is per-viewer (an admin and a driver must never be served the same
 * cached payload), so a shared cache key would risk leaking one viewer's
 * filtered data to a different viewer. Traffic is a handful of drivers and
 * coordinators, not public volume, so there is no need to cache at all.
 */
const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1kjfmQncW2LBI2-Lo9T4SzYW7lC-ddHZy_f9kNUlA1NY',
  TRANSPORTS_SHEET: 'Transports',
  WAYPOINTS_SHEET: 'Transport Waypoints',
  CHECKPOINTS_SHEET: 'Transport Checkpoints',
  ADMINS_SHEET: 'Transport Admins',
  OVERALL_STATUSES: ['Not Started', 'In Progress', 'Delayed', 'Completed', 'Cancelled'],
  CHECKPOINT_STATUSES: ['Departed', 'En Route', 'Rest Stop', 'Delayed', 'Issue', 'Arrived', 'Handoff Complete'],
  STATUS_PRIORITY: { 'In Progress': 0, 'Delayed': 1, 'Not Started': 2, 'Completed': 3, 'Cancelled': 4 },
  NOTE_MAX_LENGTH: 500
});

function doGet() {
  // No setXFrameOptionsMode() call: this leaves HtmlService's default
  // (XFrameOptionsMode.DEFAULT) in effect, which blocks third-party framing.
  // Unlike the other, public/read-only mini-apps in this repo — which are
  // meant to be embedded on the Google Site and therefore use ALLOWALL —
  // this app is write-capable and SETUP.md requires it never be embedded
  // anywhere. ALLOWALL here would let an attacker iframe this page and
  // clickjack a signed-in driver into submitting a bogus checkpoint.
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Transport Tracking');
}

/**
 * Called by the browser through google.script.run.
 *
 * Access control (read path):
 *  - The viewer's email is read ONLY from Session.getActiveUser().getEmail().
 *    If that is empty (the deployment is misconfigured — see SETUP.md — or
 *    the visitor truly isn't signed in), a clean signed-out result is
 *    returned instead of throwing, and the spreadsheet is never touched.
 *  - An admin (email listed, case-insensitively/trimmed, on Transport
 *    Admins) receives every row in Transports.
 *  - A non-admin receives ONLY rows where their email (case-insensitively,
 *    trimmed) matches Assigned Driver Email, Backup Contact Email, or
 *    Coordinator Email on that specific row. That filtering happens right
 *    here in this function, on the server, before anything is serialized —
 *    a non-admin's response object never contains another row at all, not
 *    even a redacted one.
 */
function getTransportBoard() {
  const viewerEmail = clean_(Session.getActiveUser().getEmail()).toLowerCase();
  if (!viewerEmail) {
    return Internal.signedOutResult();
  }

  const data = Internal.loadTrackerData();
  const isAdmin = data.adminEmails.indexOf(viewerEmail) !== -1;

  const transports = data.transports
    .filter(row => isAdmin || Internal.viewerMatchesTransport(row, viewerEmail))
    .sort(Internal.compareTransports)
    .map(row => Internal.buildTransportView(row, data, viewerEmail, isAdmin));

  return {
    signedIn: true,
    viewerEmail: viewerEmail,
    isAdmin: isAdmin,
    count: transports.length,
    transports: transports,
    overallStatuses: CONFIG.OVERALL_STATUSES,
    checkpointStatuses: CONFIG.CHECKPOINT_STATUSES
  };
}

/**
 * Called by the browser through google.script.run to log one checkpoint.
 *
 * Access control (write path) — re-verified independently, in this
 * function, from a fresh read of the sheets. Nothing about authorization is
 * trusted from the client or from an earlier call to getTransportBoard():
 *  - The viewer's email again comes ONLY from Session.getActiveUser().
 *  - The caller must be an admin, OR must be the assigned driver, backup
 *    contact, or coordinator on THIS specific Transport ID. Anything else
 *    throws instead of silently doing nothing.
 *  - A transport ID that doesn't exist and a transport ID the caller isn't
 *    authorized for return the exact same generic error message. Reporting
 *    them differently would let an unauthorized caller enumerate which
 *    Transport IDs are real just by reading error text — see the comment
 *    above the check below.
 *  - Timestamp and Logged By Email are always set here from
 *    `new Date()` and the verified session email — the client cannot pass
 *    either of those in, so a caller cannot forge who posted an update or
 *    when it happened.
 *  - The Note field is sanitized against spreadsheet formula injection
 *    before it is ever written to the sheet — see Internal.sanitizeForSheet.
 *
 * Returns only the single refreshed transport the caller just updated, not
 * the whole board.
 */
function logCheckpoint(transportId, waypointSequenceRaw, status, noteRaw) {
  const viewerEmail = clean_(Session.getActiveUser().getEmail()).toLowerCase();
  if (!viewerEmail) {
    throw new Error('Sign-in required. Reopen this page while signed in to your Google account.');
  }

  const cleanTransportId = clean_(transportId);
  if (!cleanTransportId) {
    throw new Error('Missing transport ID.');
  }
  if (CONFIG.CHECKPOINT_STATUSES.indexOf(status) === -1) {
    throw new Error('Invalid checkpoint status.');
  }

  const data = Internal.loadTrackerData();
  const isAdmin = data.adminEmails.indexOf(viewerEmail) !== -1;
  const transportRow = data.transports.find(row => row.id === cleanTransportId);

  // Existence and authorization are checked together and reported with one
  // generic message. Checking existence first and authorization second (with
  // two different error strings) would let a caller who isn't assigned to
  // anything use the response text as an oracle to enumerate real Transport
  // IDs, one guess at a time, without ever being authorized for any of them.
  if (!transportRow || (!isAdmin && !Internal.viewerMatchesTransport(transportRow, viewerEmail))) {
    throw new Error('That transport was not found or you are not authorized to update it.');
  }

  let waypointSequence = '';
  if (waypointSequenceRaw !== '' && waypointSequenceRaw !== null && waypointSequenceRaw !== undefined) {
    const parsed = Number(waypointSequenceRaw);
    if (!isNaN(parsed)) waypointSequence = parsed;
  }
  const note = Internal.sanitizeForSheet(clean_(noteRaw).slice(0, CONFIG.NOTE_MAX_LENGTH));

  const sheet = Internal.requireSheet(SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID), CONFIG.CHECKPOINTS_SHEET);
  // Transport Checkpoints is append-only from the app's perspective: this is
  // the only place the app ever writes to it, and it only ever adds a row.
  // Timestamp and Logged By Email are server-verified values, never client input.
  sheet.appendRow([cleanTransportId, waypointSequence, new Date(), status, note, viewerEmail]);

  const refreshed = Internal.loadTrackerData();
  const refreshedRow = refreshed.transports.find(row => row.id === cleanTransportId);
  return Internal.buildTransportView(refreshedRow, refreshed, viewerEmail, isAdmin);
}

/**
 * Every function below is a property on this single object, created inside
 * an IIFE, rather than a top-level `function name_() {}` declaration. That
 * is what actually keeps them unreachable from google.script.run — see the
 * file header comment. Only doGet, getTransportBoard, and logCheckpoint are
 * declared at the top level of this file.
 */
const Internal = (function () {

  function signedOutResult() {
    return {
      signedIn: false,
      viewerEmail: '',
      isAdmin: false,
      count: 0,
      transports: [],
      overallStatuses: CONFIG.OVERALL_STATUSES,
      checkpointStatuses: CONFIG.CHECKPOINT_STATUSES
    };
  }

  /** True when emailLower matches this transport row's driver, backup, or coordinator email. */
  function viewerMatchesTransport(row, emailLower) {
    return row.driverEmail === emailLower ||
      row.backupEmail === emailLower ||
      row.coordinatorEmail === emailLower;
  }

  function compareTransports(a, b) {
    const priorityA = CONFIG.STATUS_PRIORITY[a.status];
    const priorityB = CONFIG.STATUS_PRIORITY[b.status];
    const priorityDiff = (priorityA === undefined ? 5 : priorityA) - (priorityB === undefined ? 5 : priorityB);
    if (priorityDiff) return priorityDiff;
    const dateDiff = a.scheduledDateSort - b.scheduledDateSort;
    if (dateDiff) return dateDiff;
    return a.id.localeCompare(b.id);
  }

  /** Builds the client-facing object for one transport, including its waypoints and checkpoint timeline. */
  function buildTransportView(row, data, viewerEmail, isAdmin) {
    const waypoints = data.waypointsByTransport[row.id] || [];
    const checkpoints = data.checkpointsByTransport[row.id] || [];
    return {
      id: row.id,
      requestingPartner: row.requestingPartner,
      origin: row.origin,
      destination: row.destination,
      driverName: row.driverName,
      driverEmail: row.driverEmail,
      backupName: row.backupName,
      backupEmail: row.backupEmail,
      coordinatorEmail: row.coordinatorEmail,
      scheduledDate: row.scheduledDate,
      status: row.status,
      notes: row.notes,
      waypoints: computeWaypointStates(waypoints, checkpoints),
      checkpoints: checkpoints.map(checkpoint => ({
        timestamp: checkpoint.timestamp,
        status: checkpoint.status,
        note: checkpoint.note,
        loggedByEmail: checkpoint.loggedByEmail
      })),
      // Recomputed independently here (rather than trusted from the caller) so
      // the UI's own notion of "can this viewer log an update" always matches
      // the same rule the write path enforces.
      canLog: isAdmin || viewerMatchesTransport(row, viewerEmail)
    };
  }

  /**
   * Marks each waypoint, in ascending Sequence order, as one of:
   *  - 'reached'  — its Sequence, or an earlier one, already has a checkpoint
   *  - 'current'  — the next waypoint after the furthest one reached
   *  - 'upcoming' — everything after that
   * A transport with no checkpoints yet has its first waypoint as 'current'
   * and the rest 'upcoming'. This is a display heuristic only (drawn from
   * human-logged checkpoints, never a live GPS feed) and has no bearing on
   * access control.
   */
  function computeWaypointStates(waypoints, checkpoints) {
    if (!waypoints.length) return [];
    const loggedSequences = {};
    checkpoints.forEach(checkpoint => {
      if (checkpoint.waypointSequence !== '' && checkpoint.waypointSequence !== null) {
        loggedSequences[checkpoint.waypointSequence] = true;
      }
    });
    let maxReached = -Infinity;
    waypoints.forEach(waypoint => {
      if (loggedSequences[waypoint.sequence]) maxReached = Math.max(maxReached, waypoint.sequence);
    });

    let currentAssigned = false;
    return waypoints.map(waypoint => {
      let state;
      if (waypoint.sequence <= maxReached) {
        state = 'reached';
      } else if (!currentAssigned) {
        state = 'current';
        currentAssigned = true;
      } else {
        state = 'upcoming';
      }
      return {
        sequence: waypoint.sequence,
        label: waypoint.label,
        lat: waypoint.lat,
        lng: waypoint.lng,
        state: state
      };
    });
  }

  /**
   * Reads all four Private Operations Tracker tabs fresh. No caching — see
   * file header. Returns the FULL, UNFILTERED dataset — every transport,
   * every checkpoint, the whole admin roster — with no notion of "viewer" at
   * all. Callers (getTransportBoard, logCheckpoint) are responsible for
   * filtering by viewer before anything derived from this leaves the
   * server. This function must never be reachable directly from the client
   * (see file header) and must never be handed back to a caller unfiltered.
   */
  function loadTrackerData() {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

    const transportsTable = readTable(
      requireSheet(spreadsheet, CONFIG.TRANSPORTS_SHEET),
      ['Transport ID', 'Requesting Partner', 'Origin', 'Destination', 'Assigned Driver Name',
        'Assigned Driver Email', 'Backup Contact Name', 'Backup Contact Email', 'Coordinator Email',
        'Scheduled Date', 'Overall Status', 'Notes'],
      CONFIG.TRANSPORTS_SHEET
    );
    const transports = transportsTable.rows
      .map(row => ({
        id: clean_(row[transportsTable.column['Transport ID']]),
        requestingPartner: clean_(row[transportsTable.column['Requesting Partner']]),
        origin: clean_(row[transportsTable.column['Origin']]),
        destination: clean_(row[transportsTable.column['Destination']]),
        driverName: clean_(row[transportsTable.column['Assigned Driver Name']]),
        driverEmail: clean_(row[transportsTable.column['Assigned Driver Email']]).toLowerCase(),
        backupName: clean_(row[transportsTable.column['Backup Contact Name']]),
        backupEmail: clean_(row[transportsTable.column['Backup Contact Email']]).toLowerCase(),
        coordinatorEmail: clean_(row[transportsTable.column['Coordinator Email']]).toLowerCase(),
        scheduledDate: formatDateValue(row[transportsTable.column['Scheduled Date']]),
        scheduledDateSort: dateSortValue(row[transportsTable.column['Scheduled Date']]),
        status: clean_(row[transportsTable.column['Overall Status']]) || 'Not Started',
        notes: clean_(row[transportsTable.column['Notes']])
      }))
      .filter(row => row.id);

    const waypointsTable = readTable(
      requireSheet(spreadsheet, CONFIG.WAYPOINTS_SHEET),
      ['Transport ID', 'Sequence', 'Label', 'Latitude', 'Longitude'],
      CONFIG.WAYPOINTS_SHEET
    );
    const waypointsByTransport = {};
    waypointsTable.rows.forEach(row => {
      const transportId = clean_(row[waypointsTable.column['Transport ID']]);
      const sequence = Number(row[waypointsTable.column['Sequence']]);
      const lat = Number(row[waypointsTable.column['Latitude']]);
      const lng = Number(row[waypointsTable.column['Longitude']]);
      if (!transportId || isNaN(sequence) || isNaN(lat) || isNaN(lng)) return;
      if (!waypointsByTransport[transportId]) waypointsByTransport[transportId] = [];
      waypointsByTransport[transportId].push({
        sequence: sequence,
        label: clean_(row[waypointsTable.column['Label']]) || ('Waypoint ' + sequence),
        lat: lat,
        lng: lng
      });
    });
    Object.keys(waypointsByTransport).forEach(id => {
      waypointsByTransport[id].sort((a, b) => a.sequence - b.sequence);
    });

    const checkpointsTable = readTable(
      requireSheet(spreadsheet, CONFIG.CHECKPOINTS_SHEET),
      ['Transport ID', 'Waypoint Sequence', 'Timestamp', 'Status', 'Note', 'Logged By Email'],
      CONFIG.CHECKPOINTS_SHEET
    );
    const checkpointsByTransport = {};
    checkpointsTable.rows.forEach(row => {
      const transportId = clean_(row[checkpointsTable.column['Transport ID']]);
      if (!transportId) return;
      const rawSequence = row[checkpointsTable.column['Waypoint Sequence']];
      const isBlankSequence = rawSequence === '' || rawSequence === null || rawSequence === undefined;
      const parsedSequence = isBlankSequence ? '' : Number(rawSequence);
      const rawTimestamp = row[checkpointsTable.column['Timestamp']];
      if (!checkpointsByTransport[transportId]) checkpointsByTransport[transportId] = [];
      checkpointsByTransport[transportId].push({
        waypointSequence: (typeof parsedSequence === 'number' && !isNaN(parsedSequence)) ? parsedSequence : '',
        timestamp: formatTimestamp(rawTimestamp),
        timestampSort: dateSortValue(rawTimestamp),
        status: clean_(row[checkpointsTable.column['Status']]),
        note: clean_(row[checkpointsTable.column['Note']]),
        loggedByEmail: clean_(row[checkpointsTable.column['Logged By Email']]).toLowerCase()
      });
    });
    Object.keys(checkpointsByTransport).forEach(id => {
      checkpointsByTransport[id].sort((a, b) => a.timestampSort - b.timestampSort);
    });

    const adminsTable = readTable(
      requireSheet(spreadsheet, CONFIG.ADMINS_SHEET),
      ['Email'],
      CONFIG.ADMINS_SHEET
    );
    const adminEmails = adminsTable.rows
      .map(row => clean_(row[adminsTable.column['Email']]).toLowerCase())
      .filter(Boolean);

    return { transports: transports, waypointsByTransport: waypointsByTransport, checkpointsByTransport: checkpointsByTransport, adminEmails: adminEmails };
  }

  function requireSheet(spreadsheet, name) {
    const sheet = spreadsheet.getSheetByName(name);
    if (!sheet) throw new Error('The "' + name + '" tab was not found on the Private Operations Tracker.');
    return sheet;
  }

  function readTable(sheet, requiredHeaders, label) {
    const values = sheet.getDataRange().getValues();
    if (values.length < 1) throw new Error('The "' + label + '" tab has no header row.');
    const headers = values.shift().map(value => String(value == null ? '' : value).trim());
    const column = {};
    headers.forEach((header, index) => { column[header] = index; });
    const missing = requiredHeaders.filter(header => column[header] === undefined);
    if (missing.length) {
      throw new Error('The "' + label + '" tab is missing column(s): ' + missing.join(', '));
    }
    return { column: column, rows: values };
  }

  function formatDateValue(value) {
    if (value instanceof Date && !isNaN(value.getTime())) {
      return Utilities.formatDate(value, Session.getScriptTimeZone(), 'MMM d, yyyy');
    }
    return clean_(value);
  }

  function formatTimestamp(value) {
    if (value instanceof Date && !isNaN(value.getTime())) {
      return Utilities.formatDate(value, Session.getScriptTimeZone(), 'MMM d, yyyy h:mm a');
    }
    return clean_(value);
  }

  function dateSortValue(value) {
    if (value instanceof Date && !isNaN(value.getTime())) return value.getTime();
    if (value === '' || value === null || value === undefined) return Infinity;
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? Infinity : parsed.getTime();
  }

  /**
   * Neutralizes spreadsheet formula injection. sheet.appendRow()/setValue()
   * write a string exactly the way Sheets would parse it if a person typed
   * it into the cell — a Note beginning with '=', '+', '-', or '@' would be
   * evaluated as a live formula (e.g. IMPORTXML/IMPORTDATA to exfiltrate
   * data to an attacker URL, or HYPERLINK to disguise a phishing link) the
   * next time an admin opens the "Transport Checkpoints" tab, exactly as
   * SETUP.md instructs them to. Prepending a leading apostrophe makes Sheets
   * store and display the value as plain text instead, the same way typing
   * an apostrophe first does in the UI.
   */
  function sanitizeForSheet(value) {
    if (/^[=+\-@]/.test(value)) {
      return "'" + value;
    }
    return value;
  }

  return {
    signedOutResult: signedOutResult,
    viewerMatchesTransport: viewerMatchesTransport,
    compareTransports: compareTransports,
    buildTransportView: buildTransportView,
    loadTrackerData: loadTrackerData,
    requireSheet: requireSheet,
    sanitizeForSheet: sanitizeForSheet
  };
})();

function clean_(value) {
  return String(value == null ? '' : value).trim();
}
