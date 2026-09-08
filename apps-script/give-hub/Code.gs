/**
 * The National Animal Rescue Network — Give hub
 * (where your gift goes, Amazon wishlists, and future projects)
 *
 * Reads three approved, staff-maintained tabs of the Public Website Content
 * Hub: "Give Funds", "Wishlists", and "Future Projects". This script never
 * reads the Private Operations Tracker, and never requires a signed-in
 * visitor.
 */
const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1RmsTUYjzOMbP_2a9L4IPT55xeo284N97f4dxiFN9jDU',
  SHEET_NAMES: Object.freeze({
    FUNDS: 'Give Funds',
    WISHLISTS: 'Wishlists',
    PROJECTS: 'Future Projects'
  }),
  CACHE_KEY: 'narn-public-give-hub-v1',
  CACHE_SECONDS: 300
});

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Give — The National Animal Rescue Network')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Called once by the browser through google.script.run. This combines all
 * three tabs into a single payload — { funds, wishlists, projects } — under
 * one cache entry instead of three separate round trips and three cache
 * keys. All three tabs are small, are maintained by the same staff, and
 * always render together on this one page, so one call is simpler for the
 * client to manage than three parallel google.script.run calls would be.
 */
function getGiveHubData() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CONFIG.CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  const result = {
    funds: readFunds_(spreadsheet),
    wishlists: readWishlists_(spreadsheet),
    projects: readProjects_(spreadsheet),
    generatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX")
  };

  const serialized = JSON.stringify(result);
  // Apps Script cache values are bounded; the hub should still load even
  // when the combined payload is too large to cache.
  if (serialized.length < 90000) {
    cache.put(CONFIG.CACHE_KEY, serialized, CONFIG.CACHE_SECONDS);
  }
  return result;
}

/**
 * "Give Funds" tab — the seven donation designations (General, Transport,
 * Medical, Foster Support, Dog Sponsorship, Dog Food Truck, Mobile Bathing
 * and Grooming) are not hardcoded here. Whatever rows staff put in the
 * sheet is what renders, so the designations can change without a
 * redeploy. There is no dedicated ID column on this tab, so Fund Name
 * doubles as the identifying column for the TEMPLATE- filter.
 */
function readFunds_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAMES.FUNDS);
  if (!sheet) throw new Error('The public Give Funds sheet was not found.');

  const rows = sheet.getDataRange().getDisplayValues();
  if (rows.length < 2) return [];

  const headers = rows.shift().map(value => String(value).trim());
  const column = {};
  headers.forEach((header, index) => { column[header] = index; });

  const required = ['Fund Name', 'Description', 'Donate URL'];
  const missing = required.filter(header => column[header] === undefined);
  if (missing.length) {
    throw new Error('The public Give Funds sheet is missing: ' + missing.join(', '));
  }

  return rows
    .filter(row => {
      const name = clean_(row[column['Fund Name']]);
      return name && !name.startsWith('TEMPLATE-');
    })
    .map(row => ({
      id: clean_(row[column['Fund Name']]),
      name: clean_(row[column['Fund Name']]),
      description: clean_(row[column['Description']]),
      donateUrl: publicHttpUrl_(row[column['Donate URL']])
    }));
}

/**
 * "Wishlists" tab. Program Or Partner doubles as the identifying column
 * for the TEMPLATE- filter, since there is no dedicated ID column.
 * Wishlist URL only has to satisfy publicHttpUrl_ (https:// only) —
 * amazon.com and amzn.to links are the expected, common case, but the
 * field is not restricted to those hosts; any public https destination
 * (a partner's own gift registry, for example) is accepted too.
 */
function readWishlists_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAMES.WISHLISTS);
  if (!sheet) throw new Error('The public Wishlists sheet was not found.');

  const rows = sheet.getDataRange().getDisplayValues();
  if (rows.length < 2) return [];

  const headers = rows.shift().map(value => String(value).trim());
  const column = {};
  headers.forEach((header, index) => { column[header] = index; });

  const required = [
    'Program Or Partner', 'Destination', 'Priority Needs', 'Wishlist URL', 'Last Verified'
  ];
  const missing = required.filter(header => column[header] === undefined);
  if (missing.length) {
    throw new Error('The public Wishlists sheet is missing: ' + missing.join(', '));
  }

  return rows
    .filter(row => {
      const name = clean_(row[column['Program Or Partner']]);
      return name && !name.startsWith('TEMPLATE-');
    })
    .map(row => ({
      id: clean_(row[column['Program Or Partner']]),
      programOrPartner: clean_(row[column['Program Or Partner']]),
      destination: clean_(row[column['Destination']]),
      priorityNeeds: clean_(row[column['Priority Needs']]),
      wishlistUrl: publicHttpUrl_(row[column['Wishlist URL']]),
      lastVerified: clean_(row[column['Last Verified']])
    }));
}

/**
 * "Future Projects" tab. Project Name doubles as the identifying column
 * for the TEMPLATE- filter, since there is no dedicated ID column. Goal
 * Amount and Raised Amount are parsed into plain numbers (via
 * parseAmount_) so the client can draw an accurate progress bar even when
 * staff type currency-formatted values like "$25,000" into the cell.
 */
function readProjects_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAMES.PROJECTS);
  if (!sheet) throw new Error('The public Future Projects sheet was not found.');

  const rows = sheet.getDataRange().getDisplayValues();
  if (rows.length < 2) return [];

  const headers = rows.shift().map(value => String(value).trim());
  const column = {};
  headers.forEach((header, index) => { column[header] = index; });

  const required = ['Project Name', 'Description', 'Goal Amount', 'Raised Amount', 'Milestone Note'];
  const missing = required.filter(header => column[header] === undefined);
  if (missing.length) {
    throw new Error('The public Future Projects sheet is missing: ' + missing.join(', '));
  }

  return rows
    .filter(row => {
      const name = clean_(row[column['Project Name']]);
      return name && !name.startsWith('TEMPLATE-');
    })
    .map(row => {
      const goalAmount = parseAmount_(row[column['Goal Amount']]);
      const raisedAmount = parseAmount_(row[column['Raised Amount']]);
      // Clamp visually at 100% even if Raised exceeds Goal.
      const percent = goalAmount > 0
        ? Math.min(100, Math.max(0, Math.round((raisedAmount / goalAmount) * 100)))
        : 0;
      return {
        id: clean_(row[column['Project Name']]),
        name: clean_(row[column['Project Name']]),
        description: clean_(row[column['Description']]),
        goalAmount: goalAmount,
        raisedAmount: raisedAmount,
        percent: percent,
        milestoneNote: clean_(row[column['Milestone Note']])
      };
    });
}

/** Run manually from the editor after an urgent edit to any of the three tabs. */
function clearGiveHubCache() {
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
 * Strips everything except digits, a decimal point, and a leading minus
 * sign, so "$25,000", "25000", and "25,000.00" all parse to a plain
 * number. Blank or unparsable values become 0 rather than NaN so the
 * progress bar math downstream never breaks.
 */
function parseAmount_(value) {
  const raw = clean_(value).replace(/[^0-9.\-]/g, '');
  const number = parseFloat(raw);
  return isNaN(number) ? 0 : number;
}
