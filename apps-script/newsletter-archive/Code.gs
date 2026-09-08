/**
 * The National Animal Rescue Network — public newsletter archive
 *
 * Reads only the approved, public-facing "Newsletter Archive" tab of the
 * Public Website Content Hub. Raw shelter submissions, applications,
 * evaluations, and private notes must never be placed in that file.
 */
const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1RmsTUYjzOMbP_2a9L4IPT55xeo284N97f4dxiFN9jDU',
  SHEET_NAME: 'Newsletter Archive',
  CACHE_KEY: 'narn-public-newsletter-archive-v1',
  CACHE_SECONDS: 300
});

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Newsletter Archive — The National Animal Rescue Network')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Called by the browser through google.script.run. */
function getNewsletterArchiveData() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CONFIG.CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('The public Newsletter Archive sheet was not found.');

  const range = sheet.getDataRange();
  const displayRows = range.getDisplayValues();
  const rawRows = range.getValues();
  if (displayRows.length < 2) return emptyResult_();

  const headers = displayRows.shift().map(value => String(value).trim());
  rawRows.shift();
  const column = {};
  headers.forEach((header, index) => { column[header] = index; });

  const required = ['Issue Title Or Month', 'Issue URL', 'Published Date', 'Featured'];
  const missing = required.filter(header => column[header] === undefined);
  if (missing.length) {
    throw new Error('The public Newsletter Archive sheet is missing: ' + missing.join(', '));
  }

  const issues = displayRows
    .map((row, index) => ({ row, rawRow: rawRows[index] }))
    .filter(({ row }) => {
      const title = clean_(row[column['Issue Title Or Month']]);
      return title && !title.startsWith('TEMPLATE-');
    })
    .map(({ row, rawRow }) => {
      const title = clean_(row[column['Issue Title Or Month']]) || 'Newsletter issue';
      const publishedDate = clean_(row[column['Published Date']]);
      const featured = clean_(row[column['Featured']]).toLowerCase() === 'yes';
      const parsedDate = coerceDate_(rawRow[column['Published Date']]);
      return {
        title,
        url: publicHttpUrl_(row[column['Issue URL']]),
        publishedDate,
        featured,
        year: resolveYear_(parsedDate, publishedDate, title),
        sortKey: parsedDate ? parsedDate.getTime() : -Infinity
      };
    })
    .sort((a, b) => b.sortKey - a.sortKey)
    .map(issue => {
      // sortKey is an internal ordering aid only; do not expose it to the client.
      const { sortKey, ...publicIssue } = issue;
      return publicIssue;
    });

  const result = {
    issues,
    count: issues.length,
    generatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX")
  };
  const serialized = JSON.stringify(result);
  // Apps Script cache values are bounded; a large archive should still load
  // even when it is too large to cache.
  if (serialized.length < 90000) {
    cache.put(CONFIG.CACHE_KEY, serialized, CONFIG.CACHE_SECONDS);
  }
  return result;
}

/** Run after an urgent edit if you do not want to wait five minutes. */
function clearNewsletterArchiveCache() {
  CacheService.getScriptCache().remove(CONFIG.CACHE_KEY);
}

function emptyResult_() {
  return {
    issues: [],
    count: 0,
    generatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX")
  };
}

/** Best-effort parse of a Published Date cell, whether it's a real Date or typed text. */
function coerceDate_(value) {
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (value === '' || value === null || value === undefined) return null;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/** Falls back to a 4-digit year found in the date or title text, else "Undated". */
function resolveYear_(parsedDate, publishedDate, title) {
  if (parsedDate) return String(parsedDate.getFullYear());
  const match = String(publishedDate || title || '').match(/(19|20)\d{2}/);
  return match ? match[0] : 'Undated';
}

function clean_(value) {
  return String(value == null ? '' : value).trim();
}

function publicHttpUrl_(value) {
  const url = clean_(value);
  return /^https:\/\//i.test(url) ? url : '';
}
