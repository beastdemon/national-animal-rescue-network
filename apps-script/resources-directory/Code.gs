/**
 * The National Animal Rescue Network — public resources directory
 *
 * Reads only the approved, public-facing "Resources" tab of the Public
 * Website Content Hub. Raw shelter submissions, applications, evaluations,
 * and private notes must never be placed in that file.
 */
const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1RmsTUYjzOMbP_2a9L4IPT55xeo284N97f4dxiFN9jDU',
  SHEET_NAME: 'Resources',
  CACHE_KEY: 'narn-public-resources-v1',
  CACHE_SECONDS: 300
});

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Resources — The National Animal Rescue Network')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Called by the browser through google.script.run. */
function getResourcesData() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CONFIG.CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('The public Resources sheet was not found.');

  const rows = sheet.getDataRange().getDisplayValues();
  if (rows.length < 2) return emptyResult_();

  const headers = rows.shift().map(value => String(value).trim());
  const column = {};
  headers.forEach((header, index) => { column[header] = index; });

  const required = [
    'Title', 'Audience', 'State Or Scope', 'Description', 'URL', 'Last Reviewed'
  ];
  const missing = required.filter(header => column[header] === undefined);
  if (missing.length) {
    throw new Error('The public Resources sheet is missing: ' + missing.join(', '));
  }

  const resources = rows
    .filter(row => {
      const title = clean_(row[column['Title']]);
      return title && !title.startsWith('TEMPLATE-');
    })
    .map(row => ({
      title: clean_(row[column['Title']]),
      audience: clean_(row[column['Audience']]) || 'General',
      scope: clean_(row[column['State Or Scope']]) || 'National',
      description: clean_(row[column['Description']]),
      url: publicHttpUrl_(row[column['URL']]),
      lastReviewed: clean_(row[column['Last Reviewed']])
    }))
    .sort((a, b) => a.audience.localeCompare(b.audience) || a.title.localeCompare(b.title));

  const result = {
    resources,
    count: resources.length,
    generatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX")
  };
  const serialized = JSON.stringify(result);
  // Apps Script cache values are bounded; a large directory should still load
  // even when it is too large to cache.
  if (serialized.length < 90000) {
    cache.put(CONFIG.CACHE_KEY, serialized, CONFIG.CACHE_SECONDS);
  }
  return result;
}

/** Run after an urgent edit if you do not want to wait five minutes. */
function clearResourcesCache() {
  CacheService.getScriptCache().remove(CONFIG.CACHE_KEY);
}

function emptyResult_() {
  return {
    resources: [],
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
