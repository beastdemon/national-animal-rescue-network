/**
 * The National Animal Rescue Network — State Champions & federal delegation
 *
 * Reads two approved, public-facing tabs:
 *  - "State Champions" — NARN's own network-appointed advocate per state.
 *    This is a network role, not a government office — never call it
 *    "State Representative" anywhere in this app; that title belongs to an
 *    actual elected official, and the whole point of the "Champion" name is
 *    to avoid that confusion.
 *  - "Congressional Delegation" — each state's actual, real US Senators and
 *    US House Representatives, for reference. This tab is optional: if it
 *    doesn't exist yet, the page still works and simply shows no federal
 *    delegation section. State-level senators/representatives are NOT
 *    tracked here at all — there are too many per state (district-based,
 *    100+ in many states) to hand-maintain, so the page links out to
 *    Congress.gov's own maintained index of state legislature websites
 *    instead. See Index.html and SETUP.md.
 *
 * Raw applications, background-check results, home addresses, personal
 * phone numbers, and private notes must never be placed in either tab.
 */
const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1RmsTUYjzOMbP_2a9L4IPT55xeo284N97f4dxiFN9jDU',
  CHAMPIONS_SHEET: 'State Champions',
  DELEGATION_SHEET: 'Congressional Delegation',
  CACHE_KEY: 'narn-public-state-champions-v2',
  CACHE_SECONDS: 300
});

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('State Champions — The National Animal Rescue Network')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Called by the browser through google.script.run. */
function getStateChampionsData() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CONFIG.CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const delegationByState = readDelegation_(spreadsheet);
  const states = readChampions_(spreadsheet, delegationByState);

  const result = {
    states,
    count: states.length,
    generatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX")
  };
  const serialized = JSON.stringify(result);
  // Apps Script cache values are bounded; the roster should still load even
  // when it is too large to cache.
  if (serialized.length < 90000) {
    cache.put(CONFIG.CACHE_KEY, serialized, CONFIG.CACHE_SECONDS);
  }
  return result;
}

function readChampions_(spreadsheet, delegationByState) {
  const sheet = spreadsheet.getSheetByName(CONFIG.CHAMPIONS_SHEET);
  if (!sheet) throw new Error('The public "State Champions" sheet was not found.');

  const rows = sheet.getDataRange().getDisplayValues();
  if (rows.length < 2) return [];

  const headers = rows.shift().map(value => String(value).trim());
  const column = {};
  headers.forEach((header, index) => { column[header] = index; });

  const required = [
    'State', 'Champion Name', 'Organization Or Alias Contact',
    'Status', 'Apply URL', 'Photo URL', 'Bio Or Message'
  ];
  const missing = required.filter(header => column[header] === undefined);
  if (missing.length) {
    throw new Error('The public "State Champions" sheet is missing: ' + missing.join(', '));
  }

  return rows
    .filter(row => {
      const state = clean_(row[column['State']]);
      return state && !state.startsWith('TEMPLATE-');
    })
    .map(row => {
      const statusRaw = clean_(row[column['Status']]);
      const filled = statusRaw.toLowerCase() === 'filled';
      const state = clean_(row[column['State']]);
      return {
        state: state,
        championName: clean_(row[column['Champion Name']]),
        contact: safeContact_(row[column['Organization Or Alias Contact']]),
        status: filled ? 'Filled' : 'Champion Needed',
        applyUrl: publicHttpUrl_(row[column['Apply URL']]),
        photoUrl: publicHttpUrl_(row[column['Photo URL']]),
        bio: clean_(row[column['Bio Or Message']]),
        delegation: delegationByState[state] || []
      };
    })
    .sort((a, b) => a.state.localeCompare(b.state));
}

/**
 * Reads the actual federal delegation (real US Senators and US House
 * Representatives) per state. Deliberately optional and fails soft to an
 * empty map — a state-champion-only launch shouldn't break because this
 * tab isn't built yet, and a missing/renamed column shouldn't take down the
 * whole page either.
 */
function readDelegation_(spreadsheet) {
  try {
    const sheet = spreadsheet.getSheetByName(CONFIG.DELEGATION_SHEET);
    if (!sheet) return {};

    const rows = sheet.getDataRange().getDisplayValues();
    if (rows.length < 2) return {};

    const headers = rows.shift().map(value => String(value).trim());
    const column = {};
    headers.forEach((header, index) => { column[header] = index; });

    const required = ['State', 'Chamber', 'Name', 'District', 'Official Contact URL'];
    const missing = required.filter(header => column[header] === undefined);
    if (missing.length) return {};

    const byState = {};
    rows.forEach(row => {
      const state = clean_(row[column['State']]);
      const name = clean_(row[column['Name']]);
      if (!state || state.startsWith('TEMPLATE-') || !name) return;
      const chamberRaw = clean_(row[column['Chamber']]).toLowerCase();
      const chamber = chamberRaw === 'senate' ? 'Senate' : (chamberRaw === 'house' ? 'House' : '');
      if (!chamber) return;
      const district = chamber === 'House' ? clean_(row[column['District']]) : '';
      if (!byState[state]) byState[state] = [];
      byState[state].push({
        chamber: chamber,
        name: name,
        district: district,
        contactUrl: publicHttpUrl_(row[column['Official Contact URL']])
      });
    });

    Object.keys(byState).forEach(state => {
      byState[state].sort((a, b) => {
        if (a.chamber !== b.chamber) return a.chamber === 'Senate' ? -1 : 1;
        return (Number(a.district) || 0) - (Number(b.district) || 0);
      });
    });
    return byState;
  } catch (error) {
    // A malformed Congressional Delegation tab should never take down the
    // State Champions roster above it.
    return {};
  }
}

/** Run after an urgent roster or delegation change if you do not want to wait five minutes. */
function clearStateChampionsCache() {
  CacheService.getScriptCache().remove(CONFIG.CACHE_KEY);
}

function clean_(value) {
  return String(value == null ? '' : value).trim();
}

function publicHttpUrl_(value) {
  const url = clean_(value);
  return /^https:\/\//i.test(url) ? url : '';
}

/**
 * The Organization Or Alias Contact column may hold an org alias email
 * (e.g. texas@narn.org), a public https:// link, or be blank. It must never
 * surface a personal phone number, so a value that is mostly digits/phone
 * punctuation and is neither an email nor an https:// link is dropped.
 */
function safeContact_(value) {
  const contact = clean_(value);
  if (!contact) return '';
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const isUrl = /^https:\/\//i.test(contact);
  if (isEmail || isUrl) return contact;
  const digits = contact.replace(/[^0-9]/g, '');
  const looksLikePhone = digits.length >= 7 && (digits.length / contact.length) > 0.5;
  return looksLikePhone ? '' : contact;
}
