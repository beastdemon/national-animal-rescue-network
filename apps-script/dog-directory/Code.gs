/**
 * The National Animal Rescue Network — public dog directory
 *
 * Reads only the approved, public-facing "Dogs" tab. Raw shelter submissions,
 * applications, evaluations, and private notes must never be placed in that file.
 */
const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1RmsTUYjzOMbP_2a9L4IPT55xeo284N97f4dxiFN9jDU',
  SHEET_NAME: 'Dogs',
  CACHE_KEY: 'narn-public-dogs-v1',
  CACHE_SECONDS: 300,
  DISPLAY_STATUSES: ['Available', 'Foster Needed', 'Adoption Pending']
});

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Dogs in the Network')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Called by the browser through google.script.run. */
function getDirectoryData() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CONFIG.CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('The public Dogs sheet was not found.');

  const rows = sheet.getDataRange().getDisplayValues();
  if (rows.length < 2) return emptyResult_();

  const headers = rows.shift().map(value => String(value).trim());
  const column = {};
  headers.forEach((header, index) => { column[header] = index; });

  const required = [
    'Dog ID', 'Name', 'Listing Status', 'Primary Breed', 'Age Group', 'Sex',
    'Size', 'City', 'State', 'Partner Organization', 'Foster Needed?',
    'Urgency', 'Good With Dogs', 'Good With Cats', 'Good With Children',
    'Short Description', 'Photo URL', 'Adoption Application URL',
    'Sponsor URL', 'Featured?', 'Last Verified'
  ];
  const missing = required.filter(header => column[header] === undefined);
  if (missing.length) {
    throw new Error('The public Dogs sheet is missing: ' + missing.join(', '));
  }

  const dogs = rows
    .filter(row => {
      const id = clean_(row[column['Dog ID']]);
      const status = clean_(row[column['Listing Status']]);
      return id && !id.startsWith('TEMPLATE-') && CONFIG.DISPLAY_STATUSES.includes(status);
    })
    .map(row => ({
      id: clean_(row[column['Dog ID']]),
      name: clean_(row[column['Name']]) || 'Dog in the network',
      status: clean_(row[column['Listing Status']]),
      breed: clean_(row[column['Primary Breed']]) || 'Breed estimate unavailable',
      ageGroup: clean_(row[column['Age Group']]) || 'Unknown',
      sex: clean_(row[column['Sex']]) || 'Unknown',
      size: clean_(row[column['Size']]) || 'Unknown',
      city: clean_(row[column['City']]),
      state: clean_(row[column['State']]),
      partner: clean_(row[column['Partner Organization']]),
      fosterNeeded: clean_(row[column['Foster Needed?']]),
      urgency: clean_(row[column['Urgency']]) || 'Routine',
      goodWithDogs: clean_(row[column['Good With Dogs']]) || 'Unknown',
      goodWithCats: clean_(row[column['Good With Cats']]) || 'Unknown',
      goodWithChildren: clean_(row[column['Good With Children']]) || 'Unknown',
      description: clean_(row[column['Short Description']]),
      photoUrl: publicHttpUrl_(row[column['Photo URL']]),
      adoptionUrl: publicHttpUrl_(row[column['Adoption Application URL']]),
      sponsorUrl: publicHttpUrl_(row[column['Sponsor URL']]),
      featured: clean_(row[column['Featured?']]) === 'Yes',
      lastVerified: clean_(row[column['Last Verified']])
    }))
    .sort((a, b) => {
      const urgency = { Urgent: 0, Priority: 1, Routine: 2 };
      return Number(b.featured) - Number(a.featured) ||
        (urgency[a.urgency] ?? 3) - (urgency[b.urgency] ?? 3) ||
        a.name.localeCompare(b.name);
    });

  const result = {
    dogs,
    count: dogs.length,
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

/** Run after a time-sensitive status change if you do not want to wait five minutes. */
function clearDirectoryCache() {
  CacheService.getScriptCache().remove(CONFIG.CACHE_KEY);
}

function emptyResult_() {
  return {
    dogs: [],
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
