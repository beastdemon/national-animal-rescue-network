/**
 * The National Animal Rescue Network — public foster openings board
 *
 * Reads only the approved, public-facing "Foster Openings" tab. Raw shelter
 * submissions, applicant details, home-visit notes, and other private
 * evaluations must never be placed in that file.
 */
const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1RmsTUYjzOMbP_2a9L4IPT55xeo284N97f4dxiFN9jDU',
  SHEET_NAME: 'Foster Openings',
  CACHE_KEY: 'narn-public-foster-openings-v1',
  CACHE_SECONDS: 300,
  URGENCY_ORDER: ['Urgent', 'Priority', 'Routine']
});

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Foster Openings')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Called by the browser through google.script.run. */
function getFosterOpeningsData() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CONFIG.CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('The public Foster Openings sheet was not found.');

  const range = sheet.getDataRange();
  const displayRows = range.getDisplayValues();
  // Expiration Date needs a real Date to compare against "today," so the raw
  // (non-display) values are read in parallel and indexed the same way.
  const rawRows = range.getValues();
  if (displayRows.length < 2) return emptyResult_();

  const headers = displayRows.shift().map(value => String(value).trim());
  rawRows.shift();
  const column = {};
  headers.forEach((header, index) => { column[header] = index; });

  const required = [
    'Opening ID', 'State', 'Associated Dog ID', 'Urgency', 'Need Type',
    'Timing', 'Home Requirements', 'Supplies Or Support Provided',
    'Last Verified', 'Expiration Date', 'Apply URL', 'Status'
  ];
  const missing = required.filter(header => column[header] === undefined);
  if (missing.length) {
    throw new Error('The public Foster Openings sheet is missing: ' + missing.join(', '));
  }

  // Pair each display row with its matching raw row *before* filtering, so
  // index alignment survives the filter step (a filtered array's indices no
  // longer line up with the original sheet rows).
  const pairedRows = displayRows.map((displayRow, index) => ({ displayRow, rawRow: rawRows[index] }));

  const openings = pairedRows
    .filter(({ displayRow, rawRow }) => {
      const id = clean_(displayRow[column['Opening ID']]);
      const status = clean_(displayRow[column['Status']]);
      if (!id || id.startsWith('TEMPLATE-')) return false;
      if (status !== 'Open') return false;
      return isWithinExpiration_(rawRow[column['Expiration Date']]);
    })
    .map(({ displayRow, rawRow }) => ({
      id: clean_(displayRow[column['Opening ID']]),
      state: clean_(displayRow[column['State']]) || 'Location not listed',
      associatedDogId: clean_(displayRow[column['Associated Dog ID']]),
      urgency: clean_(displayRow[column['Urgency']]) || 'Routine',
      needType: clean_(displayRow[column['Need Type']]) || 'Foster support',
      timing: clean_(displayRow[column['Timing']]),
      homeRequirements: clean_(displayRow[column['Home Requirements']]),
      supplies: splitList_(displayRow[column['Supplies Or Support Provided']]),
      lastVerified: clean_(displayRow[column['Last Verified']]),
      applyUrl: publicHttpUrl_(displayRow[column['Apply URL']]),
      _expirationSort: expirationSortValue_(rawRow[column['Expiration Date']])
    }))
    .sort((a, b) => {
      const urgency = indexOf_(CONFIG.URGENCY_ORDER, a.urgency) - indexOf_(CONFIG.URGENCY_ORDER, b.urgency);
      if (urgency) return urgency;
      const expiration = a._expirationSort - b._expirationSort;
      if (expiration) return expiration;
      return a.state.localeCompare(b.state);
    })
    .map(opening => {
      delete opening._expirationSort;
      return opening;
    });

  const result = {
    openings,
    count: openings.length,
    generatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX")
  };
  const serialized = JSON.stringify(result);
  // Apps Script cache values are bounded; a large board should still load
  // even when it is too large to cache.
  if (serialized.length < 90000) {
    cache.put(CONFIG.CACHE_KEY, serialized, CONFIG.CACHE_SECONDS);
  }
  return result;
}

/** Run after posting or filling an opening if you do not want to wait five minutes. */
function clearFosterOpeningsCache() {
  CacheService.getScriptCache().remove(CONFIG.CACHE_KEY);
}

function emptyResult_() {
  return {
    openings: [],
    count: 0,
    generatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX")
  };
}

/**
 * True when a listing's Expiration Date should still show publicly: the
 * cell is blank, or it holds a date of today or later. A non-blank value
 * that cannot be parsed as a date is treated as expired (hidden) so a typo
 * never leaves a stale opening displayed indefinitely.
 */
function isWithinExpiration_(rawValue) {
  const isBlank = rawValue === '' || rawValue === null || rawValue === undefined;
  if (isBlank) return true;
  const date = rawValue instanceof Date ? rawValue : new Date(rawValue);
  if (isNaN(date.getTime())) return false;
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const expirationMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return expirationMidnight.getTime() >= todayMidnight.getTime();
}

/** Sort key for Expiration Date: soonest first, blank dates sort last. */
function expirationSortValue_(rawValue) {
  const isBlank = rawValue === '' || rawValue === null || rawValue === undefined;
  if (isBlank) return Infinity;
  const date = rawValue instanceof Date ? rawValue : new Date(rawValue);
  return isNaN(date.getTime()) ? Infinity : date.getTime();
}

function indexOf_(order, value) {
  const position = order.indexOf(value);
  return position === -1 ? order.length : position;
}

function splitList_(value) {
  return clean_(value)
    .split(/[,;]+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function clean_(value) {
  return String(value == null ? '' : value).trim();
}

function publicHttpUrl_(value) {
  const url = clean_(value);
  return /^https:\/\//i.test(url) ? url : '';
}
