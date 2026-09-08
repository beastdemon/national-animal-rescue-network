/**
 * The National Animal Rescue Network — public state representatives roster
 *
 * Reads only the approved, public-facing "State Representatives" tab. Raw
 * applications, background-check results, home addresses, personal phone
 * numbers, and private notes must never be placed in that file.
 */
const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1RmsTUYjzOMbP_2a9L4IPT55xeo284N97f4dxiFN9jDU',
  SHEET_NAME: 'State Representatives',
  CACHE_KEY: 'narn-public-state-reps-v1',
  CACHE_SECONDS: 300
});

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('State Representatives — The National Animal Rescue Network')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Called by the browser through google.script.run. */
function getStateRepData() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CONFIG.CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('The public State Representatives sheet was not found.');

  const rows = sheet.getDataRange().getDisplayValues();
  if (rows.length < 2) return emptyResult_();

  const headers = rows.shift().map(value => String(value).trim());
  const column = {};
  headers.forEach((header, index) => { column[header] = index; });

  const required = [
    'State', 'Representative Name', 'Organization Or Alias Contact',
    'Status', 'Apply URL'
  ];
  const missing = required.filter(header => column[header] === undefined);
  if (missing.length) {
    throw new Error('The public State Representatives sheet is missing: ' + missing.join(', '));
  }

  const states = rows
    .filter(row => {
      const state = clean_(row[column['State']]);
      return state && !state.startsWith('TEMPLATE-');
    })
    .map(row => {
      const statusRaw = clean_(row[column['Status']]);
      const filled = statusRaw.toLowerCase() === 'filled';
      return {
        state: clean_(row[column['State']]),
        repName: clean_(row[column['Representative Name']]),
        contact: safeContact_(row[column['Organization Or Alias Contact']]),
        status: filled ? 'Filled' : 'Representative Needed',
        applyUrl: publicHttpUrl_(row[column['Apply URL']])
      };
    })
    .sort((a, b) => a.state.localeCompare(b.state));

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

/** Run after an urgent roster change if you do not want to wait five minutes. */
function clearStateRepCache() {
  CacheService.getScriptCache().remove(CONFIG.CACHE_KEY);
}

function emptyResult_() {
  return {
    states: [],
    count: 0,
    generatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX")
  };
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
