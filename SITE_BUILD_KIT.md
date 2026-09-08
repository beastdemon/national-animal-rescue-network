# The National Animal Rescue Network — Google Sites build kit

## 1. Site purpose

Build one clear national front door connecting shelters, rescues, and municipal animal control centers with adopters, foster homes, evaluators, transport volunteers, state representatives, donors, advocates, and event hosts.

The core model: find dogs sitting in overlooked or high-intake shelters and animal control centers anywhere in the country — many of which only reach a small local audience and operate on hard intake deadlines — give them real national exposure, and pair that exposure with actual transportation so a dog found in one state can reach a foster, rescue, or adopter in another. Visibility without a way to move the dog does not save it; this network is built to do both together.

Google Sites should present approved public information. Applications, exact routes, personal contact data, evaluations, uploaded records, and board working materials stay in restricted Google Workspace files.

## 2. Recommended brand direction — "The Relay"

The organization's own read on the first pass (deep teal / warm rust / cream / sage / Lato) was that it felt like a generic, forgettable nonprofit template. The replacement direction keeps the same warm, natural family — so it still sits comfortably against the existing hero photo — but commits to one real idea instead of a default palette: NARN isn't a single shelter's story, it's a relay of specific handoffs (foster, driver, pilot, evaluator, state rep, donor), and the whole visual system is built to say that in the details, not just the headline.

- Primary (headings, dark UI): deep forest ink `#1F3D2E`, pressed/darkest shade `#12231A`
- Action/accent (primary buttons, urgent badges, focus rings): flare-orange `#C63F17`
- Secondary accent (in-progress/needed signal, funding-bar highlight): marigold gold `#C98A1D`
- Background: warm parchment `#F5EEDF`
- Surface (cards/panels): warm ivory `#FFFCF5`
- Text: warm near-black `#211C15` (deliberately not the same hue as the primary green, so brand color and reading text don't collapse into one note)
- Muted text/meta: warm taupe `#5B5445`
- Borders: warm khaki `#D9C9A0`
- Headings: Fraunces (serif, distinctive, confident). Body/UI text: IBM Plex Sans. IDs, status stamps, "last verified" lines: IBM Plex Mono — this is what makes the manifest/logistics idea legible in the small details, not just the big headline.
- Signature devices: a thin gradient stripe fixed to the top of every embedded page (so a dozen separate Google Sites embeds still read as one product); a clipped "luggage tag" corner on every status badge; a dashed "tear line" above action buttons; a primary button with a hard offset shadow so it reads as pressable, not just a soft hover-glow.
- Voice: confident, plain-spoken, specific — name the actual action and role ("drive a leg," "evaluate an intake," "cover the vet bill") instead of reaching for "join us in our mission" or "every animal deserves." Never imply tax-deductibility or a guaranteed placement outcome.
- Photos: real or permission-cleared rescue work, natural light, people handling animals safely, varied dogs and volunteers, no graphic medical imagery on general pages.

Homepage hero asset: `assets/narn-homepage-hero.png` — its warm cream/teal/rust/green tones were the reason this palette stayed in the same warm family rather than jumping to something that would clash against it. Place a dark transparent overlay only if needed for text contrast. Keep the headline in the left-side negative space.

New hero copy in this voice: **Headline:** "Rescue is a relay. Run a leg." **Supporting line:** "Foster for a weekend. Drive or fly a transport leg. Evaluate a new intake. Cover the vet bill that's holding someone up. Tell us where you fit — we'll put you to work this week, not someday." **Primary button:** "Pick your leg of the relay." **Secondary button:** "Meet dogs waiting for a home."

The full drop-in CSS component system (every token and shared class above) lives in `apps-script/dog-directory/Index.html`'s `<style>` block and is reused verbatim across every mini-app in `apps-script/`, so all of them look and feel like one product when embedded together in Google Sites.

## 3. Navigation

Keep the top navigation task-based. Make **Give** the final and visually distinct item.

1. Home
2. Adopt & Foster
   - Adoptable Dogs
   - Adoption Application
   - Foster Openings
   - Foster Application
   - Sponsor a Dog
3. Transport
   - How Transport Works
   - Request Transport
   - Volunteer to Transport
   - Transport Coverage Map
   - Aviation & International Partnerships
   - *(Not in this nav: Transport Tracking. It's a private, sign-in-gated tool for assigned drivers/coordinators only — `apps-script/transport-tracking/` — shared directly by URL, never linked from or embedded on the public Site.)*
4. Shelter & Rescue Partners
   - Partner Directory & Availability
   - Become a Partner
   - Submit or Update a Dog
   - Update Rescue Availability
5. Get Involved
   - Volunteer
   - Dog Evaluators
   - Photography Volunteers
   - Advocate
   - Host an Event or Fundraiser
6. News & Resources
   - Local News
   - Events
   - Newsletter
   - Resources
7. About
   - Mission & How the Network Works
   - State Representatives
   - Board & Meetings
   - Contact
8. Give
   - Donate by Fund
   - Amazon Wishlists
   - Future Projects

## 4. Homepage — ready-to-paste structure and copy

### Hero

**Headline:** Every mile. Every foster. Every life.

**Supporting line:** We connect shelters, rescues, foster homes, evaluators, transport partners, volunteers, and donors across the country so more dogs can reach safety and the right next home.

**Primary button:** Find a Dog

**Secondary button:** Help a Dog

### Quick action band

Use four image or icon tiles:

- **Adopt** — Meet dogs looking for their next home.
- **Foster** — Give a dog a safe place between shelter and adoption.
- **Transport** — Help close one leg of a lifesaving journey.
- **Give** — Fund medical care, transport, foster support, and future outreach.

### Mission section

**Heading:** No dog should be invisible because of where it landed.

**Copy:** A dog's chances shouldn't depend on how much reach its shelter happens to have. The National Animal Rescue Network finds dogs in shelters and animal control centers across the country, gives them the national visibility their home facility can't provide on its own, and coordinates the transport that turns that visibility into a real placement — verified fosters, evaluations, and rescue partners on the receiving end, and dependable funding to move each dog along the way.

**Button:** How the Network Works

### Current needs

**Heading:** Where help is needed now

Show no more than three approved items: one foster opening, one transport need, and one medical or sponsorship campaign. Each card needs a state, urgency, last-verified date, and one clear action.

### Featured dogs

**Heading:** Meet dogs in the network

Display three to six approved dogs. Each card should show name, state, age group, size, status, and buttons for View Profile, Apply, or Sponsor. Never display an unreviewed submission.

### Ways to help

**Heading:** There is a place for your skills here.

**Copy:** Drive a transport leg. Photograph adoptable dogs. Evaluate behavior. Foster for a weekend or a season. Represent your state. Host an adoption event. Advocate in your community. Whether you have an hour, an open seat, or an open home, your help can move a dog closer to safety.

**Button:** Find My Volunteer Role

### Newsletter

**Heading:** One useful update each month.

**Copy:** Get new dogs, urgent foster and transport needs, upcoming events, partner stories, and practical ways to help—delivered monthly. You can unsubscribe at any time.

**Button:** Subscribe

### Donation close

**Heading:** Put help where it is needed most.

**Copy:** Your gift can support a transport route, urgent medical care, food and supplies for foster homes, or long-term outreach projects. Choose a fund or allow the network to direct your gift to the highest current need.

**Button:** Donate Securely

Do not state tax deductibility until the organization’s legal status and receipt language are confirmed.

## 5. Core page copy and content blocks

### Adopt & Foster landing page

**Intro:** Adoption provides a permanent home. Fostering creates the safe bridge that makes more placements possible. Sponsorship helps cover a dog’s care while that next step is arranged. Choose the path that fits your home, time, and resources.

Use a three-column comparison:

- **Adopt:** Long-term commitment; application, screening, and partner-specific approval.
- **Foster:** Temporary care; placement matching, supplies/support, and an agreed care plan.
- **Sponsor:** Financial support; no custody or ownership rights; funds designated through the approved donation processor.

Add a simple process: Explore → Apply → Review → Meet or Match → Welcome Home.

### Adoptable Dogs

**Intro:** Every dog shown here has been approved for public listing by a participating shelter or rescue. Availability can change quickly, so check the “Last verified” date and use the application link on the dog’s profile.

Filters: state, status, age group, size, sex, foster needed, and keyword. The optional Apps Script directory in this kit supports these filters.

Standard dog profile fields:

- Dog ID and name
- Approved photos
- Housing shelter or rescue and state
- Adoption, foster, and sponsorship status
- Age group, size, sex, and breed estimate
- Compatibility listed as Yes, No, or Unknown
- Plain-language medical and behavior disclosures approved for publication
- Foster or transport need
- Sponsorship purpose or goal
- Last verified date
- Apply, Sponsor, and Share actions

### Adoption Application

**Intro:** Thank you for considering adoption. This application helps the dog’s housing organization understand your household, experience, and plans. Submitting an application does not guarantee placement. The participating shelter or rescue makes the final decision and may request references, a conversation, a home check, or additional documentation.

Add an embedded Adoption Application Form and a concise privacy notice. Never request payment card, bank account, or Social Security information.

### Foster Openings

**Intro:** A foster home can create immediate space and give a dog time to decompress, recover, travel, or prepare for adoption. Openings are listed by area, expected duration, dog needs, and support provided.

Each opening should show: state/area, associated dog when known, urgency, need type, timing, home requirements, supplies/support, last verified, expiration date, and Apply button.

### Foster Application

**Intro:** Fosters are matched thoughtfully; not every home is right for every dog. Tell us about your household, schedule, pets, experience, and the types of placements you can accept. A coordinator or participating rescue will contact you about next steps and support.

### Sponsor a Dog

**Intro:** Sponsorship helps cover care while a dog waits for foster, transport, treatment, or adoption. Choose an eligible dog or give to the general sponsorship fund. Sponsorship is a donation and does not create ownership, custody, or adoption priority.

Show what support may fund: food and supplies, vaccinations, diagnostics, medications, boarding when approved, evaluation, and transport. Route every payment through a secure processor.

### Transport

**Headline:** Safe journeys are built one verified leg at a time.

**Copy:** The network coordinates in-state, interstate, aviation, and case-by-case international transport between verified sending and receiving organizations. Every request must identify responsible parties, destination, timing, animal records, equipment needs, and funding before a route is opened to volunteers.

Use three calls to action: Request Transport, Volunteer to Transport, Fund a Transport.

### Transport Coverage Map

Show public corridors, participating states, airports, counties, and service gaps only. Never show home addresses, personal phone numbers, overnight-hold addresses, exact future handoff details, or a real-time route. Put those details in the restricted operations system.

### Aviation & International Partnerships

**Intro:** We welcome conversations with qualified pilots, aviation groups, airlines, cargo partners, ground coordinators, and experienced international animal-movement organizations. Every movement is evaluated case by case and must follow the applicable veterinary, carrier, import, export, and destination requirements.

Use “Aviation Partnership Inquiry” as the public action. Keep “Ryan” internal until you confirm the person’s role and permission to publish their name.

### Shelter & Rescue Partners

**Intro:** Verified shelters, rescues, and municipal animal control centers can share approved dogs, report current capacity, request transport, and connect with fosters, evaluators, and volunteers. This is deliberately open to animal control facilities, not just rescues — they are often the source of the dogs with the least reach and the least time. Partners submit through restricted forms; they do not receive edit access to the website or master operations files.

List onboarding steps: Apply → Verify → Sign participation terms → Receive partner submission links → Submit needs → Review and publish.

### Partner Directory & Availability

Publish organization name, state/service area, animal types, capacity status, constraints, transport support, public contact link, last verified, and next review. Use these statuses: Open, Limited, Waitlist, Closed, Needs Confirmation. Automatically treat stale records as Needs Confirmation.

### Get Involved

**Intro:** Choose the role that matches your time, location, skills, and comfort level. Some roles require screening, training, insurance verification, or approval before assignment.

Role cards: Foster, Ground Transport, Aviation, Photography, Dog Evaluation, Advocacy, Events/Fundraising, State Representative, Administrative Support.

### Dog Evaluators

**Intro:** Evaluators provide objective, safety-minded observations that help placement teams make better decisions. Applicants should have relevant handling or behavior experience, follow the network’s evaluation protocol, avoid guarantees, and submit reports only through the restricted evaluator form.

Approved evaluator reports, videos, contact information, and assignments are private. Publish only an approved summary when needed for a dog profile.

### Photography Volunteers

**Intro:** Strong, honest images help dogs get noticed. Photography volunteers work with approved shelters and handlers, follow animal-handling boundaries, obtain required releases, preserve accurate appearance, and transfer usable image rights to the participating organization under the agreed terms.

### Advocate

Provide responsible share cards, local action alerts, shelter-support guidance, humane education, state contacts, and a clear code of conduct. Do not encourage harassment, doxxing, or unverified accusations.

### Host an Event or Fundraiser

**Intro:** Propose an adoption event, community fundraiser, volunteer activity, or awareness event. Events using the organization’s name, dogs, funds, or brand require written approval, appropriate insurance/permits, a safety plan, approved payment handling, and post-event reconciliation.

### News & Newsletter

Maintain one curated News page with partner stories, local coverage, press, and network updates. The Newsletter page displays the current issue, an archive by month/year, and a consent-based signup. Google Sites displays the archive; an email platform or eligible Gmail mail merge sends the message and manages unsubscribe requirements.

### Resources

Organize by audience rather than one long list:

- Pet owners: low-cost care, food support, surrender alternatives, lost/found pets, disaster planning.
- Adopters and fosters: decompression, introductions, veterinary care, training, safety, support contacts.
- Shelters and rescues: partner onboarding, transport readiness, listing standards, grants, crisis coordination.
- Volunteers and transporters: orientation, safety, documentation, emergency procedures, reimbursement policy.

Every resource needs a title, audience, scope/state, short description, URL, and last-reviewed date.

### Board of State Representatives

One representative per state speaks for the network and the dogs in its care to their own state's government — building relationships with state legislators, showing up when animal-welfare bills or shelter/rescue regulation come up, and keeping the network's needs visible at the state level. This is a network volunteer role, not an elected office — do not confuse it with an actual state senator or state representative in the page copy or the application; the distinction matters to avoid misleading anyone about who these people are.

**Note for the board:** organized legislative advocacy by a 501(c)(3) has real IRS limits on lobbying activity. Keep public copy and the application framed as relationship-building and policy advocacy, not a formal lobbying operation, until legal counsel has reviewed what the network's reps can and can't do under the org's eventual tax-exempt status.

Page structure:
- **Meet our representatives** — a card per state showing (with the rep's consent) a photo, name, short bio/message about why they serve, and a public-safe contact (an organization alias like `texas@yourdomain.org` or a public link — never a personal phone number or address).
- **Open seats** — states without a rep show "Representative needed" and an apply link, same as today.
- **Apply** — links to the dedicated State Representative / Board Application (see `FORM_BLUEPRINTS.md`), not the general volunteer form.

### Board & Meetings

Publish board member information only with consent. Show the public meeting schedule, governance documents, approved agendas, and approved minutes. Keep draft agendas, working documents, private meeting links, executive-session information, and board discussion in a separate restricted hub.

### Give

Offer clear designations: General, Transport, Medical, Foster Support, Dog Sponsorship, Dog Food Truck, and Mobile Bathing & Grooming. Explain that restricted gifts are used according to the processor and organization’s published terms. Use actual, board-approved goals and progress figures only.

### Amazon Wishlists

Group lists by program or verified partner. Show destination, priority needs, public wishlist URL, and last verified. Check each list regularly for ownership, delivery settings, and stale items.

### Future Projects

Create two campaign cards:

- **Dog Food Outreach Truck:** A mobile supply program serving high-need communities and approved outreach locations, including selected dog parks and partner events.
- **Mobile Bathing & Grooming Unit:** A shelter-support vehicle designed to bring basic bathing and grooming capacity to participating facilities.

Before fundraising publicly, add a board-approved scope, target budget, milestones, operating plan, service area, and what happens if the campaign exceeds or does not reach its goal.

## 6. Google Workspace architecture

### Public layer

- Google Site: public pages and calls to action
- Public Calendar: approved meetings, adoption events, fundraisers, orientations
- Public My Map: broad transport/service coverage only
- Public Website Content Hub: approved dogs, openings, capacity, representatives, events, news, resources, wishlists, campaigns
- Newsletter archive and secure external donation links

### Private layer

- Separate Google Forms by workflow
- Private response Sheets and the Private Operations Tracker
- Restricted Drive folders for uploads and evaluations
- Private route map or files with precise logistics
- Restricted Partner/Operations Site
- Restricted Board Site

### Approval rule

Submission → private response → coordinator review → approval → copy only sanitized fields → public content hub → Google Site or embedded directory.

No outside submission should publish automatically.

## 7. Build order

1. Confirm legal name, mission, service area, official accounts, privacy policy, and site owners.
2. Create the public Google Site and apply the brand/theme.
3. Build Home, About, Contact, Get Involved, Give, and Resources first.
4. Create Forms and link each to a private response Sheet.
5. Add Adoption/Foster, Transport, Partner, Evaluator, and Event pages with embedded Forms.
6. Populate approved rows in the Public Website Content Hub.
7. Deploy and embed the nine `apps-script/` mini-apps (dog directory, foster openings, partner directory, get involved, state representatives, current needs, resources, give hub, newsletter archive) — or launch with manually maintained profiles first and add each mini-app as its sheet tab is ready. Each folder's `SETUP.md` lists the exact tab name and columns it needs.
8. Create a public Calendar and broad public My Map; keep confidential details in separate restricted assets.
9. Connect the donation processor, Amazon wishlists, and newsletter platform.
10. Test permissions, mobile layouts, keyboard navigation, contrast, forms, links, confirmations, and ownership recovery.
11. Connect the custom domain and Analytics only after the public/private boundary is verified.

## 8. Launch-blocking owner inputs

- Legal organization name, nonprofit/EIN representation, mission, service area, and official contact details
- Logo or permission to create one; confirmed color/font preferences
- Organization-owned Google Workspace account and at least two accountable site owners
- Adoption, foster, evaluation, partner, transport, volunteer, privacy, retention, and safety policies
- Donation processor, fund terms, receipt language, and approved Amazon wishlists
- Board member/public meeting information approved for publication
- State representative names, public aliases, and photo/bio consent
- Named rescues/shelters/animal control centers and their permission to publish animals and capacity
- Aviation partnership structure and points of contact are still undecided — keep the public "Aviation Partnership Inquiry" page generic until this is settled, and do not publish any individual's name until their role and publication consent are confirmed
- Email/newsletter platform and sender address
- Custom domain and Analytics property, if available
- The real, published General Volunteer Application Google Form URL — `apps-script/get-involved/Code.gs` ships with a placeholder (`GENERAL_VOLUNTEER_FORM_URL`) that must be replaced before that page goes live
- Nine new sheet tabs need to be created in the Public Website Content Hub before the corresponding mini-app can go live: Foster Openings, Partner Directory, Volunteer Needs (optional), State Representatives, Current Needs, Resources, Give Funds, Wishlists, Future Projects, and Newsletter Archive — exact column headers for each are in that mini-app's `SETUP.md`
- Four more new tabs need to be created on the **Private Operations Tracker** (not the public hub) for `transport-tracking`: Transports, Transport Waypoints, Transport Checkpoints, Transport Admins — see `apps-script/transport-tracking/SETUP.md`. At least one Transport Admin email (a coordinator or board member) needs to be decided before that tool is useful.

