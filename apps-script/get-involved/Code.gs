/**
 * The National Animal Rescue Network — Get Involved (volunteer role board)
 *
 * The nine role cards below are fixed in code, not sourced from a sheet — there
 * is nothing here for a shelter or volunteer to submit. The only spreadsheet
 * read this script performs is the optional, public-facing "Volunteer Needs"
 * tab of the Public Website Content Hub, used only for the small "Urgently
 * needed" callouts at the top of the page. This script never reads the
 * Private Operations Tracker, and it never requires a signed-in visitor.
 */
const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1RmsTUYjzOMbP_2a9L4IPT55xeo284N97f4dxiFN9jDU',
  SHEET_NAME: 'Volunteer Needs',
  CACHE_KEY: 'narn-public-get-involved-v1',
  CACHE_SECONDS: 300,
  // Replace with the org's real, published Google Form URL before going live.
  // Each role button appends its own ?role=... parameter to this base URL so
  // the org can later wire up per-role prefill entry IDs on the same form.
  GENERAL_VOLUNTEER_FORM_URL: 'REPLACE_WITH_GENERAL_VOLUNTEER_FORM_URL',
  ROLES: [
    {
      id: 'foster',
      title: 'Foster',
      description: 'Take a dog into your home between rescue and placement. Feed, walk, and send updates so we can match them to the right adopter faster.',
      commitment: '2–8 weeks typical, longer for medical or behavioral holds',
      param: 'foster'
    },
    {
      id: 'transport-ground',
      title: 'Ground transport',
      description: 'Drive one leg of a relay — a set pickup point, a set drop point, done. You get the route and the handoff details before you commit to a leg.',
      commitment: 'One leg, usually 2–4 hours',
      param: 'transport-ground'
    },
    {
      id: 'transport-air',
      title: 'Aviation transport',
      description: 'Fly a dog in cabin or cargo on a trip you already have booked, or fly a leg we need covered if you pilot your own aircraft.',
      commitment: 'Varies by flight, scheduled in advance',
      param: 'transport-air'
    },
    {
      id: 'photography',
      title: 'Photography',
      description: 'Shoot intake and adoption-ready photos that get a dog looked at twice. Bring a camera or a good phone and follow the shot list.',
      commitment: '1–2 hours per session, as needed',
      param: 'photography'
    },
    {
      id: 'evaluator',
      title: 'Dog evaluation',
      description: 'Run a temperament read on an incoming dog — sociability, handling, resource guarding — so fosters and adopters know what they are getting.',
      commitment: '30–60 minutes per evaluation',
      param: 'evaluator'
    },
    {
      id: 'advocacy',
      title: 'Advocacy',
      description: 'Speak for the network at local hearings, on shelter policy, or in your own network when a case needs visibility.',
      commitment: 'As issues come up',
      param: 'advocacy'
    },
    {
      id: 'events',
      title: 'Events & fundraising',
      description: 'Run a table at an adoption event, or organize a fundraiser end to end — pitch, logistics, and payout.',
      commitment: 'Per event, a few hours to a few weeks of lead time',
      param: 'events'
    },
    {
      id: 'state-rep',
      title: 'State representative',
      description: 'Be the network’s point of contact in your state — coordinate local fosters, transporters, and partner shelters.',
      commitment: 'Ongoing, a few hours a week',
      param: 'state-rep'
    },
    {
      id: 'admin',
      title: 'Administrative support',
      description: 'Handle intake paperwork, data entry, or scheduling so the field side of the network can stay in the field.',
      commitment: 'Flexible, remote-friendly',
      param: 'admin'
    }
  ]
});

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Get Involved')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getRoleBoardData() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CONFIG.CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const roles = CONFIG.ROLES.map(role => ({
    id: role.id,
    title: role.title,
    description: role.description,
    commitment: role.commitment,
    applyUrl: buildApplyUrl_(role.param)
  }));

  const result = { roles: roles, needs: getVolunteerNeeds_() };

  const serialized = JSON.stringify(result);
  if (serialized.length < 90000) cache.put(CONFIG.CACHE_KEY, serialized, CONFIG.CACHE_SECONDS);
  return result;
}

/**
 * Reads the optional "Volunteer Needs" tab for up to three short
 * "Urgently needed" callouts. This tab is entirely optional — if it does
 * not exist yet, has no header row, is missing a required column, or has
 * no data rows, this returns an empty array instead of throwing, so the
 * (required) role board above never breaks because of it.
 */
function getVolunteerNeeds_() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) return [];

    const rows = sheet.getDataRange().getDisplayValues();
    if (rows.length < 2) return [];

    const headers = rows.shift().map(value => String(value).trim());
    const column = {};
    headers.forEach((header, index) => { column[header] = index; });

    const required = ['Role', 'State', 'Note', 'Last Verified'];
    const missing = required.filter(header => column[header] === undefined);
    if (missing.length) return [];

    return rows
      .map(row => ({
        role: clean_(row[column['Role']]),
        state: clean_(row[column['State']]),
        note: clean_(row[column['Note']]),
        lastVerified: clean_(row[column['Last Verified']])
      }))
      .filter(need => need.role && !need.role.startsWith('TEMPLATE-'))
      .slice(0, 3);
  } catch (error) {
    return [];
  }
}

function buildApplyUrl_(param) {
  // CONFIG.GENERAL_VOLUNTEER_FORM_URL is edited by hand in Code.gs (it isn't
  // sheet-sourced), but it still reaches every visitor's browser, so it gets
  // the same https://-only check as every other URL field before that
  // happens — a placeholder or an accidentally-pasted non-HTTPS link never
  // reaches the client.
  const base = publicHttpUrl_(CONFIG.GENERAL_VOLUNTEER_FORM_URL);
  if (!base) return '';
  const separator = base.indexOf('?') === -1 ? '?' : '&';
  return base + separator + 'role=' + encodeURIComponent(param);
}

/** Run manually from the editor after an urgent Volunteer Needs edit. */
function clearRoleBoardCache() {
  CacheService.getScriptCache().remove(CONFIG.CACHE_KEY);
}

function clean_(value) { return String(value == null ? '' : value).trim(); }
function publicHttpUrl_(value) {
  const url = clean_(value);
  return /^https:\/\//i.test(url) ? url : '';
}
