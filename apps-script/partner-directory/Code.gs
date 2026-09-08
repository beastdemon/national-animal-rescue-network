/**
 * The National Animal Rescue Network — public shelter & rescue partner directory
 *
 * Reads only the approved, public-facing "Partner Directory" tab of the Public
 * Website Content Hub. Internal vetting notes, non-public contacts, capacity
 * assessments, and unapproved partner submissions must never be placed in that
 * file — that data lives in the Private Operations Tracker, which this script
 * never opens.
 */
const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1RmsTUYjzOMbP_2a9L4IPT55xeo284N97f4dxiFN9jDU',
  SHEET_NAME: 'Partner Directory',
  CACHE_KEY: 'narn-public-partners-v1',
  CACHE_SECONDS: 300,
  // Default sort order for capacity status, most-open first.
  STATUS_RANK: Object.freeze({
    'Open': 0,
    'Limited': 1,
    'Waitlist': 1,
    'Needs Confirmation': 2,
    'Closed': 3
  })
});

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Shelter & Rescue Partner Directory — The National Animal Rescue Network')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Called by the browser through google.script.run. */
function getPartnerDirectoryData() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CONFIG.CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('The public Partner Directory sheet was not found.');

  const range = sheet.getDataRange();
  // Display values give clean, pre-formatted text for most columns. Raw
  // values are read too, so Next Review Date can be compared as a real date
  // rather than as a formatted string.
  const display = range.getDisplayValues();
  const raw = range.getValues();
  if (display.length < 2) return emptyResult_();

  const headers = display.shift().map(value => String(value).trim());
  raw.shift();
  const column = {};
  headers.forEach((header, index) => { column[header] = index; });

  const required = [
    'Partner ID', 'Organization Name', 'State Or Service Area', 'Animal Types',
    'Capacity Status', 'Constraints', 'Transport Support', 'Public Contact URL',
    'Last Verified', 'Next Review Date'
  ];
  const missing = required.filter(header => column[header] === undefined);
  if (missing.length) {
    throw new Error('The public Partner Directory sheet is missing: ' + missing.join(', '));
  }

  const today = startOfDay_(new Date());

  const partners = display
    .map((row, index) => ({ row: row, rawRow: raw[index] }))
    .filter(({ row }) => {
      const id = clean_(row[column['Partner ID']]);
      return id && !id.startsWith('TEMPLATE-');
    })
    .map(({ row, rawRow }) => {
      const storedStatus = clean_(row[column['Capacity Status']]) || 'Needs Confirmation';
      const nextReviewDate = parseSheetDate_(rawRow[column['Next Review Date']]);
      // Staleness rule: a missing/unparseable review date can't be confirmed
      // current either, so it is treated the same as an overdue one.
      const reviewOverdue = !nextReviewDate || today.getTime() > startOfDay_(nextReviewDate).getTime();
      const status = reviewOverdue ? 'Needs Confirmation' : storedStatus;

      return {
        id: clean_(row[column['Partner ID']]),
        name: clean_(row[column['Organization Name']]) || 'Partner organization',
        area: clean_(row[column['State Or Service Area']]) || 'Service area not listed',
        animalTypes: splitList_(row[column['Animal Types']]),
        status: status,
        reviewOverdue: reviewOverdue,
        constraints: clean_(row[column['Constraints']]),
        transportSupport: clean_(row[column['Transport Support']]) || 'Ask',
        contactUrl: publicHttpUrl_(row[column['Public Contact URL']]),
        lastVerified: clean_(row[column['Last Verified']])
      };
    })
    .sort((a, b) => {
      const rankA = CONFIG.STATUS_RANK[a.status] ?? 4;
      const rankB = CONFIG.STATUS_RANK[b.status] ?? 4;
      return rankA - rankB || a.name.localeCompare(b.name);
    });

  const result = {
    partners,
    count: partners.length,
    generatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX")
  };
  const serialized = JSON.stringify(result);
  // Apps Script cache values are bounded; the directory should still load
  // even when it is too large to cache.
  if (serialized.length < 90000) {
    cache.put(CONFIG.CACHE_KEY, serialized, CONFIG.CACHE_SECONDS);
  }
  return result;
}

/** Run after an urgent capacity change if you do not want to wait five minutes. */
function clearPartnerDirectoryCache() {
  CacheService.getScriptCache().remove(CONFIG.CACHE_KEY);
}

function emptyResult_() {
  return {
    partners: [],
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

/** Splits a comma/semicolon/slash-separated cell (e.g. "Dogs, Cats") into a clean array. */
function splitList_(value) {
  return clean_(value)
    .split(/[,;/]+/)
    .map(part => part.trim())
    .filter(Boolean);
}

/**
 * Returns a real Date for a sheet cell, or null if the cell is blank or does
 * not hold a recognizable date. getValues() already returns a Date object
 * for cells formatted as dates; a plain-text cell is parsed as a fallback.
 */
function parseSheetDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  const text = clean_(value);
  if (!text) return null;
  const parsed = new Date(text);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
