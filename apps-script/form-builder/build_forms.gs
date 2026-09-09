/**
 * NARN — Form Builder
 * ============================================================================
 * Creates all 13 Google Forms from FORM_BLUEPRINTS.md in ONE run.
 *
 * HOW TO USE:
 *   1. Go to https://script.google.com → New project.
 *   2. Paste this entire file in, replacing the default Code.gs.
 *   3. Edit the CONFIG block below (collaborator email, org name, contact).
 *   4. Run `buildAllForms` once. Authorize when prompted.
 *   5. Check the Execution log (View → Logs) — every form URL is printed there,
 *      and also written to a new "NARN Form Registry" spreadsheet in your Drive.
 *   6. Give those URLs to your developer to wire into the Flask site.
 *
 * WHAT IT DOES PER FORM:
 *   - Creates the form with title, description, and all questions/sections.
 *   - Sets the confirmation ("submission is not approval") message.
 *   - Collects the email address of respondents (response receipts).
 *   - Links a dedicated response spreadsheet.
 *   - Adds your collaborator as an editor.
 *
 * RE-RUNNING: creates a fresh set of forms each time. Delete old ones from
 * Drive if you re-run, or you'll get duplicates.
 * ============================================================================
 */

var CONFIG = {
  // Google account to add as an editor/collaborator on every form + sheet.
  COLLABORATOR_EMAIL: 'amber.e.gossett@gmail.com',

  // Shown at the top of every form. Edit to the real legal/public name.
  ORG_NAME: 'The National Animal Rescue Network',

  // Where the "what happens next" text points people. Edit before running.
  FOLLOWUP_CONTACT: 'the email address you provide below',

  // Realistic response-time expectation shown in confirmation text.
  RESPONSE_TIME: 'within 5–7 days',

  // A folder name created in your Drive to hold all response sheets.
  REGISTRY_TITLE: 'NARN Form Registry'
};

/** Entry point — run this. */
function buildAllForms() {
  var registry = [];

  registry.push(buildAdoptionApplication());
  registry.push(buildFosterApplication());
  registry.push(buildGeneralVolunteerApplication());
  registry.push(buildDogEvaluatorApplication());
  registry.push(buildPartnerApplication());
  registry.push(buildSubmitOrUpdateDog());
  registry.push(buildRescueAvailabilityUpdate());
  registry.push(buildTransportRequest());
  registry.push(buildDogEvaluationSubmission());
  registry.push(buildEventProposal());
  registry.push(buildNewsletterSignup());
  registry.push(buildContactAndNews());
  registry.push(buildStateChampionApplication());

  writeRegistry_(registry);

  Logger.log('====================================================');
  Logger.log('ALL 13 FORMS CREATED. URLs:');
  registry.forEach(function (r) {
    Logger.log(r.name + '\n  Live (share this): ' + r.publishedUrl + '\n  Edit: ' + r.editUrl);
  });
  Logger.log('====================================================');
  Logger.log('A "' + CONFIG.REGISTRY_TITLE + '" spreadsheet with every URL is in your Drive.');
}

/* ============================================================================
   CLEANUP — run this to trash a previous (partial or full) run before rebuilding
   ============================================================================
 * Moves to trash (recoverable for ~30 days):
 *   - all 13 NARN forms (matched by exact title)
 *   - every "[Responses] <form title>" spreadsheet
 *   - the "NARN Form Registry" spreadsheet
 *
 * Safe to run even if nothing exists yet. Run `deleteAllNarnForms`, then
 * run `buildAllForms` for a clean set.
 */
var FORM_TITLES = [
  'Adoption Application',
  'Foster Application',
  'General Volunteer Application',
  'Dog Evaluator Application',
  'Shelter / Rescue Partner Application',
  'Submit or Update a Dog',
  'Rescue Availability Update',
  'Transport Request',
  'Dog Evaluation Submission',
  'Event / Fundraiser Proposal',
  'Newsletter Signup',
  'Contact & News Submission',
  'State Champion Application'
];

function deleteAllNarnForms() {
  var trashedForms = 0, trashedSheets = 0, trashedRegistry = 0;

  // Trash forms + their response sheets
  FORM_TITLES.forEach(function (title) {
    var forms = DriveApp.getFilesByName(title);
    while (forms.hasNext()) {
      var f = forms.next();
      if (f.getMimeType() === MimeType.GOOGLE_FORMS) {
        f.setTrashed(true);
        trashedForms++;
        Logger.log('Trashed form: ' + title);
      }
    }
    var responseName = '[Responses] ' + title;
    var sheets = DriveApp.getFilesByName(responseName);
    while (sheets.hasNext()) {
      var s = sheets.next();
      if (s.getMimeType() === MimeType.GOOGLE_SHEETS) {
        s.setTrashed(true);
        trashedSheets++;
        Logger.log('Trashed sheet: ' + responseName);
      }
    }
  });

  // Trash the registry spreadsheet
  var reg = DriveApp.getFilesByName(CONFIG.REGISTRY_TITLE);
  while (reg.hasNext()) {
    var r = reg.next();
    if (r.getMimeType() === MimeType.GOOGLE_SHEETS) {
      r.setTrashed(true);
      trashedRegistry++;
      Logger.log('Trashed registry: ' + CONFIG.REGISTRY_TITLE);
    }
  }

  Logger.log('====================================================');
  Logger.log('Cleanup complete. Forms trashed: ' + trashedForms +
             ', response sheets trashed: ' + trashedSheets +
             ', registry trashed: ' + trashedRegistry + '.');
  Logger.log('Items are in Drive Trash (recoverable ~30 days). ' +
             'Now run buildAllForms for a clean set.');
  Logger.log('====================================================');
}

/* ============================================================================
   Registry writer — dumps every form's URLs into a spreadsheet in your Drive
   ============================================================================ */

function writeRegistry_(registry) {
  var ss = SpreadsheetApp.create(CONFIG.REGISTRY_TITLE);
  var sheet = ss.getActiveSheet();
  sheet.setName('Forms');

  var header = ['Form Name', 'Live URL (share this)', 'Edit URL', 'Response Sheet URL'];
  var rows = [header];
  registry.forEach(function (r) {
    rows.push([r.name, r.publishedUrl, r.editUrl, r.responseSheetUrl]);
  });

  sheet.getRange(1, 1, rows.length, header.length).setValues(rows);
  sheet.getRange(1, 1, 1, header.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, header.length);

  // Share the registry with the collaborator too
  try { ss.addEditor(CONFIG.COLLABORATOR_EMAIL); } catch (e) { Logger.log('Registry editor add failed: ' + e); }

  Logger.log('Registry spreadsheet: ' + ss.getUrl());
}

/* ============================================================================
   Shared helpers
   ============================================================================ */

function newForm_(title, description) {
  var form = FormApp.create(title);
  form.setTitle(title);
  form.setDescription(
    CONFIG.ORG_NAME + '\n\n' + description +
    '\n\nWhat happens next: a team member will follow up ' + CONFIG.RESPONSE_TIME +
    ' through ' + CONFIG.FOLLOWUP_CONTACT + '. Submitting this form is not an approval.'
  );
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(false);
  form.setAllowResponseEdits(false);
  form.setProgressBar(true);
  return form;
}

function finalize_(form, confirmationText) {
  form.setConfirmationMessage(confirmationText);

  // Dedicated response spreadsheet
  var ss = SpreadsheetApp.create('[Responses] ' + form.getTitle());
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // Share both with the collaborator
  try { form.addEditor(CONFIG.COLLABORATOR_EMAIL); } catch (e) { Logger.log('Form editor add failed: ' + e); }
  try { ss.addEditor(CONFIG.COLLABORATOR_EMAIL); } catch (e) { Logger.log('Sheet editor add failed: ' + e); }

  return {
    name: form.getTitle(),
    publishedUrl: form.getPublishedUrl(),
    editUrl: form.getEditUrl(),
    responseSheetUrl: ss.getUrl()
  };
}

function addText_(form, title, required) {
  var item = form.addTextItem().setTitle(title);
  if (required) item.setRequired(true);
  return item;
}

function addPara_(form, title, required) {
  var item = form.addParagraphTextItem().setTitle(title);
  if (required) item.setRequired(true);
  return item;
}

function addChoice_(form, title, choices, required) {
  var item = form.addMultipleChoiceItem().setTitle(title).setChoiceValues(choices);
  if (required) item.setRequired(true);
  return item;
}

function addCheckboxes_(form, title, choices, required) {
  var item = form.addCheckboxItem().setTitle(title).setChoiceValues(choices);
  if (required) item.setRequired(true);
  return item;
}

function addSection_(form, title, description) {
  return form.addPageBreakItem().setTitle(title).setHelpText(description || '');
}

function addYesNoUnknown_(form, title) {
  return form.addMultipleChoiceItem().setTitle(title).setChoiceValues(['Yes', 'No', 'Unknown']);
}

/* ============================================================================
   1. Adoption Application
   ============================================================================ */
function buildAdoptionApplication() {
  var form = newForm_('Adoption Application',
    'Apply to adopt a dog in the network. Complete all sections honestly — this helps the participating shelter or rescue place the right dog with the right home.');

  addSection_(form, 'Dog and applicant');
  addText_(form, 'Dog ID or name you are applying for', true);
  addText_(form, 'Your legal name', true);
  addText_(form, 'Preferred name', false);
  addText_(form, 'Email', true);
  addText_(form, 'Phone', true);
  addText_(form, 'City', true);
  addText_(form, 'State', true);
  addText_(form, 'ZIP', true);
  addChoice_(form, 'Preferred contact method', ['Email', 'Phone', 'Text'], true);
  addChoice_(form, 'I confirm I am 18 years or older', ['Yes', 'No'], true);

  addSection_(form, 'Household');
  addText_(form, 'Number of adults in the household', true);
  addPara_(form, 'Children and their ages (if any)', false);
  addChoice_(form, 'Do all household members agree to this adoption?', ['Yes', 'No'], true);
  addChoice_(form, 'Housing type', ['House', 'Apartment', 'Condo', 'Townhouse', 'Other'], true);
  addChoice_(form, 'Do you own or rent?', ['Own', 'Rent', 'Other'], true);
  addPara_(form, 'Landlord or property restrictions on pets (if renting)', false);
  addChoice_(form, 'Do you have a yard or fence?', ['Fenced yard', 'Unfenced yard', 'No yard'], false);
  addPara_(form, 'Planned living arrangement for the dog', true);

  addSection_(form, 'Current animals');
  addPara_(form, 'Current pets: species, age, sex, spay/neuter status, temperament (or write "none")', true);
  addText_(form, 'Veterinarian name and contact (if you have pets)', false);
  addChoice_(form, 'May we contact your veterinarian?', ['Yes', 'No', 'Not applicable'], false);

  addSection_(form, 'Experience and plan');
  addPara_(form, 'Prior dog experience', false);
  addPara_(form, 'Your training approach', false);
  addPara_(form, 'Typical daily schedule', true);
  addText_(form, 'Hours the dog would be alone on a typical day', true);
  addPara_(form, 'Exercise plan', false);
  addPara_(form, 'Care plan for travel or emergencies', false);
  addPara_(form, 'Anticipated life changes in the next year', false);
  addPara_(form, 'What are you hoping for in a dog?', false);

  addSection_(form, 'Eligibility and consent');
  addCheckboxes_(form, 'I am willing to:', [
    'Complete an interview',
    'Provide references',
    'Meet the dog before adoption',
    'Complete a home verification if required'
  ], true);
  addChoice_(form, 'I certify the information above is accurate', ['Yes'], true);
  addChoice_(form, 'I consent to the privacy policy', ['Yes'], true);
  addText_(form, 'Type your full name to acknowledge', true);

  return finalize_(form,
    'Thank you. This application has been received for review. Submission does not guarantee placement. The participating shelter or rescue will contact you through the information provided if the application moves forward.');
}

/* ============================================================================
   2. Foster Application
   ============================================================================ */
function buildFosterApplication() {
  var form = newForm_('Foster Application',
    'Apply to foster a dog. Fostering gives a dog a home between rescue and adoption. Tell us about your home, availability, and what kind of placement fits you.');

  addText_(form, 'Full name', true);
  addText_(form, 'Email', true);
  addText_(form, 'Phone', true);
  addText_(form, 'City', true);
  addText_(form, 'State', true);
  addText_(form, 'ZIP', true);
  addChoice_(form, 'I confirm I am 18 years or older', ['Yes', 'No'], true);
  addPara_(form, 'Household members (adults and children with ages)', true);
  addChoice_(form, 'Do you have housing permission to foster?', ['Yes', 'No', 'I own my home'], true);
  addPara_(form, 'Current pets (species, age, sex, spay/neuter, temperament) or "none"', true);
  addPara_(form, 'Your experience with animals', false);

  addSection_(form, 'Availability and preferences');
  addChoice_(form, 'Availability', ['Can accept a foster now', 'Generally interested for later'], true);
  addText_(form, 'Maximum foster duration you can offer', false);
  addCheckboxes_(form, 'Placement types you are open to', [
    'Emergency', 'Short-term', 'Long-term', 'Medical', 'Decompression'
  ], false);
  addPara_(form, 'Size or age restrictions', false);
  addChoice_(form, 'Do you have an isolation space for a new dog?', ['Yes', 'No'], false);
  addChoice_(form, 'Can you transport the dog to appointments?', ['Yes', 'No', 'Sometimes'], false);
  addChoice_(form, 'Are you comfortable administering medication?', ['Yes', 'No'], false);
  addPara_(form, 'Supplies you would need provided', false);
  addPara_(form, 'Your typical schedule and travel', false);

  addSection_(form, 'References and consent');
  addText_(form, 'Veterinarian name and contact', false);
  addPara_(form, 'References (name and contact)', false);
  addText_(form, 'Emergency contact', false);
  addChoice_(form, 'Do you agree to training and support from the network?', ['Yes', 'No'], true);
  addChoice_(form, 'Do you consent to a home check if required?', ['Yes', 'No'], true);
  addChoice_(form, 'Optional: consent to photo/publicity of your foster', ['Yes', 'No'], false);
  addChoice_(form, 'I acknowledge the privacy policy and certify accuracy', ['Yes'], true);

  return finalize_(form,
    'Thank you. Your foster application has been received for review. Submission does not guarantee a placement. A coordinator will contact you through the information provided.');
}

/* ============================================================================
   3. General Volunteer Application
   ============================================================================ */
function buildGeneralVolunteerApplication() {
  var form = newForm_('General Volunteer Application',
    'Volunteer with the network. Tell us your availability and interests — you can select more than one role and we will match you.');

  addText_(form, 'Full name', true);
  addText_(form, 'Email', true);
  addText_(form, 'Phone', true);
  addText_(form, 'City', true);
  addText_(form, 'State', true);
  addText_(form, 'ZIP', true);
  addChoice_(form, 'I confirm I am 18 years or older', ['Yes', 'No'], true);
  addChoice_(form, 'Preferred contact method', ['Email', 'Phone', 'Text'], true);
  addPara_(form, 'Your general availability', false);
  addText_(form, 'Languages spoken', false);
  addPara_(form, 'Accessibility needs we should know about', false);
  addPara_(form, 'Relevant experience', false);
  addText_(form, 'Emergency contact', false);

  addCheckboxes_(form, 'Which roles interest you?', [
    'Transport', 'Photography', 'Advocacy', 'Events & fundraising', 'Administrative/general'
  ], true);

  addSection_(form, 'Transport (if selected)');
  addPara_(form, 'Vehicle/mode, license & insurance willingness, radius, states/corridors, overnight availability, lifting/handling comfort', false);

  addSection_(form, 'Photography (if selected)');
  addPara_(form, 'Camera/equipment, portfolio URL, editing experience, service radius, availability', false);
  addChoice_(form, 'I acknowledge a rights/release agreement for photos', ['Yes', 'Not applicable'], false);

  addSection_(form, 'Advocacy (if selected)');
  addPara_(form, 'Topics, state/district, speaking/writing/social skills', false);
  addChoice_(form, 'I pledge non-harassment and accuracy', ['Yes', 'Not applicable'], false);

  addSection_(form, 'Events (if selected)');
  addPara_(form, 'Event experience, lifting/setup ability, fundraising/cash-handling interest, schedule', false);

  addSection_(form, 'Administrative/general (if selected)');
  addPara_(form, 'Skills, software, scheduling, data entry, outreach, grant research', false);

  addSection_(form, 'Consent');
  addChoice_(form, 'I consent to screening and training', ['Yes'], true);
  addChoice_(form, 'I acknowledge the code of conduct', ['Yes'], true);

  return finalize_(form,
    'Thank you for volunteering. Your application has been received. A coordinator will follow up through the information provided. Note: the State Champion role has its own separate application.');
}

/* ============================================================================
   4. Dog Evaluator Application
   ============================================================================ */
function buildDogEvaluatorApplication() {
  var form = newForm_('Dog Evaluator Application',
    'Apply to evaluate dogs for the network. Evaluators assess temperament and handling so fosters and adopters know what to expect. Credentials are verified before any public listing.');

  addText_(form, 'Full name', true);
  addText_(form, 'Email', true);
  addText_(form, 'Phone', true);
  addText_(form, 'City', true);
  addText_(form, 'State', true);
  addText_(form, 'Service radius', false);
  addPara_(form, 'Relevant employment or volunteer background', true);
  addPara_(form, 'Years and settings of dog-handling experience', true);
  addPara_(form, 'Credentials (name, issuing body, expiry date)', false);
  addPara_(form, 'Your behavior/evaluation methods', false);
  addPara_(form, 'Experience with fearful, barrier-reactive, resource-guarding, high-arousal, and bite-history cases', false);
  addPara_(form, 'Safety scenario: describe how you would handle a dog showing sudden aggression', true);
  addPara_(form, 'Availability and travel', false);
  addPara_(form, 'Equipment you use', false);
  addPara_(form, 'Professional references', false);
  addPara_(form, 'Any conflicts of interest to disclose', false);
  addChoice_(form, 'Willing to use the network evaluation protocol?', ['Yes', 'No'], true);
  addChoice_(form, 'I acknowledge no evaluation guarantees a specific outcome', ['Yes'], true);
  addChoice_(form, 'I agree to confidentiality', ['Yes'], true);
  addChoice_(form, 'I consent to training and screening', ['Yes'], true);

  return finalize_(form,
    'Thank you. Your evaluator application has been received for review. Credentials are verified before any assignment. A coordinator will follow up through the information provided.');
}

/* ============================================================================
   5. Shelter/Rescue Partner Application
   ============================================================================ */
function buildPartnerApplication() {
  var form = newForm_('Shelter / Rescue Partner Application',
    'For shelters, rescues, and animal control organizations that want to partner with the network. After approval, you receive restricted links to submit dogs and update availability.');

  addText_(form, 'Legal organization name', true);
  addText_(form, 'Public organization name', false);
  addChoice_(form, 'Organization type', ['Municipal shelter', 'Animal control', '501(c)(3) rescue', 'Other'], true);
  addText_(form, 'EIN / registration number (if applicable)', false);
  addPara_(form, 'Physical and mailing addresses', true);
  addText_(form, 'Website', false);
  addText_(form, 'Social media links', false);
  addText_(form, 'Primary contact name and email', true);
  addText_(form, 'Backup contact name and email', false);
  addText_(form, 'Service area', true);
  addPara_(form, 'Animals served', false);
  addPara_(form, 'Intake and adoption model', false);
  addPara_(form, 'Veterinary relationship', false);
  addPara_(form, 'Insurance and licensing/inspection info', false);
  addPara_(form, 'Transport practices', false);
  addPara_(form, 'Requested network services', false);
  addText_(form, 'Authorized submitters (names/emails)', false);
  addChoice_(form, 'I agree to verification and network standards', ['Yes'], true);

  return finalize_(form,
    'Thank you. Your partner application has been received for review. After approval, we will send restricted links for submitting dogs and updating availability. A coordinator will follow up through the information provided.');
}

/* ============================================================================
   6. Submit or Update a Dog (approved partners; file upload)
   ============================================================================ */
function buildSubmitOrUpdateDog() {
  var form = newForm_('Submit or Update a Dog',
    'FOR APPROVED PARTNERS ONLY. Submit a new dog, update an existing listing, or mark a dog as adopted/removed. All submissions enter private review before appearing publicly.');

  addText_(form, 'Your name (submitter)', true);
  addText_(form, 'Partner ID', true);
  addChoice_(form, 'Action', ['New dog', 'Update existing', 'Remove / adopted'], true);
  addText_(form, 'Existing Dog ID (for update/remove)', false);
  addText_(form, 'Dog name', false);
  addText_(form, 'Current location (city, state)', false);
  addChoice_(form, 'I confirm my organization has legal custody/authority', ['Yes'], true);
  addPara_(form, 'Intake / source context', false);
  addText_(form, 'Age', false);
  addChoice_(form, 'Sex', ['Male', 'Female', 'Unknown'], false);
  addChoice_(form, 'Size', ['Small', 'Medium', 'Large', 'Extra large'], false);
  addText_(form, 'Breed estimate', false);
  addPara_(form, 'Spay/neuter, vaccination, microchip status', false);
  addPara_(form, 'Medical conditions / medications', false);
  addPara_(form, 'Behavior observations', false);
  addPara_(form, 'Bite or incident disclosure', false);
  addYesNoUnknown_(form, 'Good with dogs');
  addYesNoUnknown_(form, 'Good with cats');
  addYesNoUnknown_(form, 'Good with children');
  addText_(form, 'Housing deadline (if urgent)', false);
  addPara_(form, 'Foster or transport need', false);
  addPara_(form, 'Adoption requirements', false);
  addPara_(form, 'Public bio', false);
  try {
    form.addImageItem().setTitle('Photo upload note').setHelpText('Use the file upload below for photos. File upload requires Google sign-in.');
  } catch (e) {}
  try {
    form.addFileUploadItem()
      .setTitle('Photo / video uploads')
      .setHelpText('Photos or short videos of the dog.');
  } catch (e) { Logger.log('File upload item skipped (requires Workspace / sign-in policy): ' + e); }
  addChoice_(form, 'I confirm photo rights to publish', ['Yes'], false);
  addText_(form, 'Adoption application URL for this dog', false);
  addPara_(form, 'Sponsorship eligibility / goal', false);
  addPara_(form, 'Urgent safety notes', false);
  addChoice_(form, 'I certify this information and commit to updates', ['Yes'], true);

  return finalize_(form,
    'Thank you. This submission has entered private review. It will not appear publicly until reviewed and approved. Adopted/removed updates are prioritized.');
}

/* ============================================================================
   7. Rescue Availability Update (approved partners)
   ============================================================================ */
function buildRescueAvailabilityUpdate() {
  var form = newForm_('Rescue Availability Update',
    'FOR APPROVED PARTNERS ONLY. Update your current capacity status. Availability expires unless reconfirmed.');

  addText_(form, 'Partner ID', true);
  addText_(form, 'Your name (submitter)', true);
  addChoice_(form, 'Current status', ['Open', 'Limited', 'Waitlist', 'Closed'], true);
  addText_(form, 'Effective date', false);
  addText_(form, 'Next review date', false);
  addPara_(form, 'Animal types', false);
  addPara_(form, 'Size / age / medical / behavior constraints', false);
  addText_(form, 'Number or range (if you want it public)', false);
  addChoice_(form, 'Transport support', ['Yes', 'No', 'Ask'], false);
  addPara_(form, 'Geographic limits', false);
  addText_(form, 'Public contact link', false);
  addPara_(form, 'Internal notes (not published)', false);
  addChoice_(form, 'Approve publishing the selected fields', ['Yes'], true);

  return finalize_(form,
    'Thank you. Your availability update has been received and will be reflected after review. Availability expires unless reconfirmed by your next review date.');
}

/* ============================================================================
   8. Transport Request (verified partners; file upload)
   ============================================================================ */
function buildTransportRequest() {
  var form = newForm_('Transport Request',
    'FOR VERIFIED PARTNERS ONLY. Request a transport for one or more dogs. Exact handoff addresses and route timing stay private.');

  addText_(form, 'Requesting partner', true);
  addText_(form, 'Coordinator contact', true);
  addText_(form, 'Dog IDs / count', true);
  addText_(form, 'Origin city/state', true);
  addText_(form, 'Destination city/state', true);
  addText_(form, 'Sending organization / contact', false);
  addText_(form, 'Receiving organization / contact', false);
  addChoice_(form, 'Custody and acceptance confirmed by both ends?', ['Yes', 'No'], true);
  addText_(form, 'Requested date / window', true);
  addPara_(form, 'Reason for transport', false);
  addChoice_(form, 'Transport type', ['In-state', 'Interstate', 'Aviation', 'International'], true);
  addPara_(form, 'Animal size / temperament / handling needs', false);
  addPara_(form, 'Crate / equipment needs', false);
  addPara_(form, 'Health certificate / vaccination requirements', false);
  addChoice_(form, 'Veterinary clearance obtained?', ['Yes', 'No', 'Pending'], false);
  addChoice_(form, 'Overnight needed?', ['Yes', 'No'], false);
  addPara_(form, 'Route flexibility', false);
  addText_(form, 'Funds requested and estimate', false);
  try {
    form.addFileUploadItem().setTitle('Records upload').setHelpText('Health certificates, vaccination records, etc.');
  } catch (e) { Logger.log('File upload item skipped: ' + e); }
  addText_(form, 'Emergency contact', false);
  addChoice_(form, 'I acknowledge accuracy and the cancellation policy', ['Yes'], true);

  return finalize_(form,
    'Thank you. Your transport request has been received. A coordinator will review and follow up. Exact handoff details are arranged privately with assigned drivers.');
}

/* ============================================================================
   9. Dog Evaluation Submission (approved evaluators; file upload)
   ============================================================================ */
function buildDogEvaluationSubmission() {
  var form = newForm_('Dog Evaluation Submission',
    'FOR APPROVED EVALUATORS ONLY. Submit a completed evaluation. If a dog poses an immediate safety risk, contact your coordinator directly before submitting this form.');

  addText_(form, 'Evaluator name / ID', true);
  addText_(form, 'Assignment ID', false);
  addText_(form, 'Dog ID', true);
  addText_(form, 'Date / time / location of evaluation', true);
  addText_(form, 'People present', false);
  addPara_(form, 'Environment', false);
  addPara_(form, 'Handling precautions taken', false);
  addPara_(form, 'Objective observations (by protocol section)', true);
  addPara_(form, 'Body-language observations', false);
  addPara_(form, 'Response to handling, leash, novel stimuli, dogs, resources, confinement, recovery', false);
  addPara_(form, 'Safety incidents', false);
  addPara_(form, 'Limitations of this evaluation', false);
  addPara_(form, 'Recommended conditions', false);
  addChoice_(form, 'Further evaluation needed?', ['Yes', 'No'], false);
  addChoice_(form, 'Overall result', ['Ready', 'Ready with conditions', 'Needs further work', 'Not ready'], true);
  try {
    form.addFileUploadItem().setTitle('Report upload', false);
    form.addFileUploadItem().setTitle('Video / photo upload', false);
  } catch (e) { Logger.log('File upload item skipped: ' + e); }
  addChoice_(form, 'I certify accuracy and confidentiality', ['Yes'], true);

  return finalize_(form,
    'Thank you. This evaluation has been submitted for review. If a dog poses an immediate safety concern, contact your coordinator directly — do not rely on this form for urgent issues.');
}

/* ============================================================================
   10. Event / Fundraiser Proposal
   ============================================================================ */
function buildEventProposal() {
  var form = newForm_('Event / Fundraiser Proposal',
    'Propose an event, adoption day, or fundraiser. The event is not authorized until you receive written approval.');

  addText_(form, 'Organizer contact', true);
  addText_(form, 'Organization / company', false);
  addChoice_(form, 'Event type', ['Adoption event', 'Fundraiser', 'Awareness/outreach', 'Other'], true);
  addText_(form, 'Proposed date / time', true);
  addText_(form, 'Proposed location', true);
  addPara_(form, 'Event concept', true);
  addText_(form, 'Expected attendance', false);
  addPara_(form, 'Requested dogs / volunteers / brand use', false);
  addPara_(form, 'Fundraising method', false);
  addText_(form, 'Proposed beneficiary / fund designation', false);
  addPara_(form, 'Expenses', false);
  addChoice_(form, 'Venue permission secured?', ['Yes', 'No', 'Pending'], false);
  addChoice_(form, 'Insurance / permits status', ['Secured', 'In progress', 'Not started', 'Not applicable'], false);
  addPara_(form, 'Animal-safety plan', false);
  addPara_(form, 'Cash / payment handling plan', false);
  addPara_(form, 'Publicity plan', false);
  addPara_(form, 'Accessibility plan', false);
  addPara_(form, 'Cancellation plan', false);
  addChoice_(form, 'I understand the event is not authorized until written approval', ['Yes'], true);

  return finalize_(form,
    'Thank you. Your event proposal has been received for review. The event is not authorized until you receive written approval. A coordinator will follow up.');
}

/* ============================================================================
   11. Newsletter Signup
   ============================================================================ */
function buildNewsletterSignup() {
  var form = newForm_('Newsletter Signup',
    'Get the monthly newsletter — dogs placed, transport wins, upcoming events, and ways to help. About one email a month. You can unsubscribe anytime.');

  addText_(form, 'Email', true);
  addText_(form, 'First name (optional)', false);
  addText_(form, 'State (optional)', false);
  addCheckboxes_(form, 'Optional interests', [
    'Adoptable dogs', 'Foster needs', 'Transport', 'Volunteer opportunities', 'Events', 'Advocacy'
  ], false);
  addChoice_(form, 'I consent to receive the monthly newsletter (about one email a month)', ['Yes'], true);

  return finalize_(form,
    'Thank you for subscribing. You will receive about one email a month. You can unsubscribe anytime using the link in any newsletter.');
}

/* ============================================================================
   12. Contact and News Submission
   ============================================================================ */
function buildContactAndNews() {
  var form = newForm_('Contact & News Submission',
    'Send us a question, a media inquiry, a local news tip, a resource suggestion, or a website correction. This is not a 24/7 emergency line — for an animal emergency, contact local animal control or a veterinarian.');

  addText_(form, 'Name', true);
  addText_(form, 'Email', true);
  addText_(form, 'State', false);
  addChoice_(form, 'Topic', [
    'General question', 'Media', 'Local news / story', 'Resource suggestion',
    'Website correction', 'Urgent listing update', 'Other'
  ], true);
  addText_(form, 'Organization (if any)', false);
  addText_(form, 'Subject', true);
  addPara_(form, 'Message', true);
  addText_(form, 'Source URL (if applicable)', false);
  addChoice_(form, 'May we contact you about this?', ['Yes', 'No'], true);
  addChoice_(form, 'Optional: may we publish your story content?', ['Yes', 'No'], false);

  return finalize_(form,
    'Thank you. Your message has been received. This is not a 24/7 emergency service — for an animal emergency, contact local animal control or a veterinarian. Otherwise a team member will follow up if a response is needed.');
}

/* ============================================================================
   13. State Champion Application
   ============================================================================ */
function buildStateChampionApplication() {
  var form = newForm_('State Champion Application',
    'Apply to be your state\'s Champion — the network\'s volunteer advocate for animal-welfare policy in your state. This is a network role, not an elected office, and it is separate from the general volunteer application.');

  addSection_(form, 'Contact and state');
  addText_(form, 'Legal name', true);
  addText_(form, 'Email', true);
  addText_(form, 'Phone', true);
  addText_(form, 'City', true);
  addText_(form, 'Which state would you represent?', true);
  addChoice_(form, 'I confirm I am 18 years or older', ['Yes', 'No'], true);
  addChoice_(form, 'Preferred contact method', ['Email', 'Phone', 'Text'], true);

  addSection_(form, 'Why this role');
  addPara_(form, 'Why do you want to advocate for the network and the dogs in your state?', true);
  addPara_(form, 'Any existing relationships with state legislators, agencies, or animal-welfare coalitions', false);
  addPara_(form, 'Relevant legislative, policy, or community-organizing experience', false);

  addSection_(form, 'Capacity');
  addText_(form, 'Time available (weekly/monthly)', true);
  addChoice_(form, 'Willing to travel to the state capitol?', ['Yes', 'No', 'Sometimes'], true);
  addChoice_(form, 'Willing to speak publicly or testify if asked?', ['Yes', 'No'], true);
  addChoice_(form, 'Comfortable representing the organization\'s positions over personal opinions?', ['Yes', 'No'], true);

  addSection_(form, 'Commitment and conduct');
  addChoice_(form, 'I acknowledge this role advocates on animal-welfare policy — not for any candidate, party, or ballot measure', ['Yes'], true);
  addPara_(form, 'Conflict-of-interest disclosure (employment or lobbying on related issues)', false);
  addChoice_(form, 'Optional: consent to a public photo and short bio if appointed', ['Yes', 'No'], false);
  addChoice_(form, 'I acknowledge an organization email address is required once appointed', ['Yes'], true);
  addChoice_(form, 'I acknowledge the term (renewable annually; the network may end the arrangement anytime)', ['Yes'], true);

  addSection_(form, 'Eligibility and consent');
  addChoice_(form, 'I certify the information above is accurate', ['Yes'], true);
  addChoice_(form, 'I consent to the privacy policy', ['Yes'], true);
  addText_(form, 'Type your full name to acknowledge', true);

  return finalize_(form,
    'Thank you for applying to represent The National Animal Rescue Network and the dogs in your state. This application has been received for review. Submission does not guarantee appointment. If your state\'s seat is open and your background is a fit, a coordinator or board member will follow up through the information provided.');
}
