/**
 * The National Animal Rescue Network — homepage "Current Needs" widget
 *
 * Reads only the approved, staff-curated "Current Needs" tab. This tab is a
 * public-safe summary feed maintained by coordinators — it must never point
 * at the raw Foster Openings, Transport, or Sponsorship operational tabs, and
 * it must never contain exact addresses, personal contact information, or
 * unreviewed submissions. Private submission -> coordinator review ->
 * approved sanitized copy -> this tab -> public hub.
 */
const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1RmsTUYjzOMbP_2a9L4IPT55xeo284N97f4dxiFN9jDU',
  SHEET_NAME: 'Current Needs',
  CACHE_KEY: 'narn-public-current-needs-v1',
  CACHE_SECONDS: 300,
  MAX_CARDS: 3,
  URGENCY_ORDER: ['Urgent', 'Priority', 'Routine']
});

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Current Needs')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Called by the browser through google.script.run. */
function getCurrentNeedsData() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CONFIG.CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('The public Current Needs sheet was not found.');

  const rows = sheet.getDataRange().getDisplayValues();
  if (rows.length < 2) return emptyResult_();

  const headers = rows.shift().map(value => String(value).trim());
  const column = {};
  headers.forEach((header, index) => { column[header] = index; });

  const required = [
    'Need ID', 'Category', 'State', 'Headline', 'Urgency', 'Last Verified',
    'Action Label', 'Action URL', 'Active'
  ];
  const missing = required.filter(header => column[header] === undefined);
  if (missing.length) {
    throw new Error('The public Current Needs sheet is missing: ' + missing.join(', '));
  }

  const needs = rows
    .filter(row => {
      const id = clean_(row[column['Need ID']]);
      const active = clean_(row[column['Active']]);
      return id && !id.startsWith('TEMPLATE-') && active === 'Yes';
    })
    .map(row => ({
      id: clean_(row[column['Need ID']]),
      category: clean_(row[column['Category']]) || 'Other',
      state: clean_(row[column['State']]),
      headline: clean_(row[column['Headline']]) || 'Current need in the network',
      urgency: clean_(row[column['Urgency']]) || 'Routine',
      lastVerified: clean_(row[column['Last Verified']]),
      actionLabel: clean_(row[column['Action Label']]) || 'Learn more',
      actionUrl: publicHttpUrl_(row[column['Action URL']])
    }))
    .sort((a, b) => {
      return urgencyRank_(a.urgency) - urgencyRank_(b.urgency) ||
        compareLastVerifiedDesc_(a.lastVerified, b.lastVerified);
    })
    .slice(0, CONFIG.MAX_CARDS);

  const result = {
    needs,
    count: needs.length,
    generatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX")
  };
  const serialized = JSON.stringify(result);
  // Apps Script cache values are bounded; the widget should still load even
  // when the payload is too large to cache (which should never happen here,
  // since the feed is always capped at MAX_CARDS rows).
  if (serialized.length < 90000) {
    cache.put(CONFIG.CACHE_KEY, serialized, CONFIG.CACHE_SECONDS);
  }
  return result;
}

/** Run after posting/removing an urgent need if you do not want to wait five minutes. */
function clearCurrentNeedsCache() {
  CacheService.getScriptCache().remove(CONFIG.CACHE_KEY);
}

function emptyResult_() {
  return {
    needs: [],
    count: 0,
    generatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX")
  };
}

function urgencyRank_(value) {
  const index = CONFIG.URGENCY_ORDER.indexOf(value);
  return index === -1 ? CONFIG.URGENCY_ORDER.length : index;
}

/** Most recently verified first; unparsable/blank dates sort last. */
function compareLastVerifiedDesc_(a, b) {
  const dateA = Date.parse(a);
  const dateB = Date.parse(b);
  const validA = !isNaN(dateA);
  const validB = !isNaN(dateB);
  if (validA && validB) return dateB - dateA;
  if (validA) return -1;
  if (validB) return 1;
  return String(b).localeCompare(String(a));
}

function clean_(value) {
  return String(value == null ? '' : value).trim();
}

function publicHttpUrl_(value) {
  const url = clean_(value);
  return /^https:\/\//i.test(url) ? url : '';
}
