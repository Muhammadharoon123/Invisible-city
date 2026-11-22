Status: ready-for-agent

# Spec: Roles, accounts and the Issue workflow

Source of truth for the product rules: `docs/PRD.md`. Vocabulary: `GLOSSARY.md`. Decisions: `docs/adr/0001` (one Next.js app on Vercel, Supabase Postgres, Cloudinary) and `docs/adr/0002` (Google sign-in through Supabase; Authorities only by Super Admin approval). Build order: `docs/PLAN.md` steps 1–9.

## Problem Statement

Today anyone can submit a Report with no identity behind it: the reporter id is made up by the browser, so spam and abuse cannot be traced, and Authorities cannot contact the person who reported. There is one shared admin passcode, so nobody can tell which official did what, and anyone who learns it is an official. Issues are "assigned" to a fixed team name that has no location, no people and no way to see its own jobs, so nothing reaches the Office that can actually fix the problem. When an Issue is marked resolved, the Citizen who reported it has no say, so "resolved" means only that an official clicked a button. Data and photos are stored on local disk, which does not survive on Vercel, where the app is deployed.

## Solution

Everyone signs in with Google. A Citizen completes a short profile (display name and phone) and can then report. Each Report is tied to that Citizen, rate-limited and checked by AI, and Authorities can see who sent it and flag spam. Authorities are real officials approved by the Invisible City team (Super Admins). An Authority reviews an Issue, sees the Offices of the right Department nearest first, and assigns it. The Office's staff sign in, see their jobs, start work, record a Fix with an after-repair photo, or send the Issue back if it is not theirs. Every Citizen who reported the Issue is emailed and can confirm the Fix (Resolution) or reject it, and an Issue nobody answers closes as unconfirmed after 7 days. Public pages keep showing the map, Issues and insights, without reporter identity. Data lives in Supabase Postgres and photos in Cloudinary. Demo accounts let judges try every role on the live site without touching real data.

## User Stories

### Signing in and profiles
1. As a Citizen, I want to sign in with my Google account, so that I can report without creating another password.
2. As a Citizen signing in for the first time, I want to be asked for a display name and phone number, so that officials can contact me about my Report.
3. As a Citizen, I want my phone number checked for the `+92 3xx xxxxxxx` format, so that a typo does not make me unreachable.
4. As a Citizen, I want my Gmail address taken from Google, so that I do not type it again.
5. As a Citizen with an incomplete profile, I want to be sent to the profile form when I try to report, so that I know what is missing.
6. As a Citizen, I want to stay signed in between visits, so that reporting from the street is quick.
7. As a Citizen, I want to sign out, so that I can use a shared phone safely.
8. As any visitor, I want to see the map, Issue pages and Insights without signing in, so that I can see what is happening in my city.

### Reporting
9. As a Citizen, I want to take or pick a photo of the problem, so that officials can see it.
10. As a Citizen, I want my location filled in from my phone's GPS, so that I do not have to find the spot on a map.
11. As a Citizen, I want to move a map pin to correct my location, so that the Issue is placed exactly.
12. As a Citizen, I want the AI to suggest the Category and severity from my photo, so that I do not have to know the official terms.
13. As a Citizen, I want to change the suggested Category before submitting, so that a wrong guess does not misroute my Report.
14. As a Citizen, I want to add an optional description, so that I can explain what the photo does not show.
15. As a Citizen, I want to be told when my photo does not look like a civic problem, so that I understand why it was refused.
16. As a Citizen, I want to be told when my Report merged into an existing Issue, so that I know others reported it too.
17. As a Citizen, I want to be told "you have already reported this" when I report an Issue I already reported, so that I do not count twice.
18. As a Citizen, I want to be told when I hit the daily limit of 10 Reports, so that I know when I can report again.
19. As a Citizen, I want to delete my Report while its Issue is still Open, so that I can take back a mistake.
20. As a Citizen, I want the delete option to disappear once the Issue is assigned, so that the record an Office works from stays fixed.
21. As a suspended Citizen, I want to be told I can no longer report, so that I understand what happened.

### My reports
22. As a Citizen, I want a My reports page listing every Issue I reported with its status, so that I can follow progress.
23. As a Citizen, I want each Issue's timeline, so that I see when it was assigned, started and fixed.
24. As a Citizen, I want to see the after-repair photo when an Issue is Fixed, so that I can judge the Fix.
25. As a Citizen, I want to confirm a Fix, so that the Issue is recorded as Resolved.
26. As a Citizen, I want to reject a Fix with a comment, so that the Office goes back and finishes the job.
27. As a Citizen, I want an email when an Issue I reported is Fixed, so that I do not have to keep checking.
28. As a Citizen, I want an email when an Issue I reported is Resolved or closed unconfirmed, so that I know the outcome.

### Authority
29. As a person working for the city, I want a Request Authority access form (name, department, official email, phone), so that I can ask for official access.
30. As an Authority, I want a priority queue of Issues, highest priority first, so that I deal with the most serious problems first.
31. As an Authority, I want to filter the queue by status, Category and neighbourhood, so that I can focus.
32. As an Authority, I want to open an Issue and see every Report with the reporter's name, email and phone, so that I can contact them and judge credibility.
33. As an Authority, I want to put a Spam flag on a Report, so that abusive or fake Reports disappear.
34. As an Authority, I want an Issue whose only Report is flagged as spam to be removed, so that it does not clutter the queue.
35. As an Authority, I want a Citizen with 3 Spam flags to be suspended automatically, so that repeat abusers are stopped.
36. As an Authority, I want to see the Offices of the Issue's Department, nearest first with their distance, so that I can pick the right one quickly.
37. As an Authority, I want to make the final choice of Office myself, so that local knowledge can override distance.
38. As an Authority, I want to assign an Issue to an Office, so that the Office knows to act.
39. As an Authority, I want Issues sent back by an Office to return to my queue as Open with the Office's reason, so that I can reassign them.
40. As an Authority, I want to add Offices (name, Department, location), so that the list reflects reality.
41. As an Authority, I want to add and remove Office staff by email, so that the right people can see an Office's jobs.
42. As an Authority, I want to see every Issue in the city, so that nothing falls between areas.

### Office
43. As Office staff, I want to sign in with Google and see only my Office's jobs, so that I know what to do.
44. As Office staff, I want an email when an Issue is assigned to my Office, so that I notice new jobs.
45. As Office staff, I want to see the Issue's photos, location and the reporters' contact details, so that I can find the problem.
46. As Office staff, I want to start work on an assigned Issue, so that the Citizen sees it is In progress.
47. As Office staff, I want to send an assigned Issue back with a reason ("not our area", "not our department"), so that a wrong assignment does not sit with us.
48. As Office staff, I want to mark an Issue Fixed with a required after-repair photo and an optional note, so that there is proof of the repair.
49. As Office staff, I want a rejected Fix to come back to my jobs as In progress with the Citizen's comment, so that I know what is still wrong.
50. As Office staff in an Office with several staff, I want all of us to see the same jobs, so that anyone on shift can act.

### Super Admin
51. As a Super Admin, I want a list of pending Access requests, so that I can check each one.
52. As a Super Admin, I want to approve a request, so that the person signs in as an Authority from then on.
53. As a Super Admin, I want to decline a request, so that fake officials get no access.
54. As a Super Admin, I want my role to come from a server setting listing the team's emails, so that nobody can grant themselves Super Admin.

### Closure, privacy and trust
55. As a Citizen, I want an Issue nobody answered within 7 days of its Fix to show as closed unconfirmed, not Resolved, so that the record stays honest.
56. As a Citizen, I want my name, email and phone hidden from the public and from other Citizens, so that I feel safe reporting.
57. As any visitor, I want each Issue's public timeline and before/after photos, so that I can see accountability.
58. As any visitor, I want the heatmap, health score, neglected neighbourhoods and recurring problems to reflect the new workflow, so that the insights stay true.
59. As a judge, I want to switch between demo Citizen, Authority, Office and Super Admin accounts on the live site, so that I can try the whole flow without Google accounts.
60. As a team member, I want real sign-ins to work on the same site alongside demo mode, with real and demo data kept apart, so that we can test the real flow live.
61. As a visitor in demo mode, I want a visible Demo banner, so that I know the people and data are made up.

## Implementation Decisions

### Stack and data access
- One Next.js app; its API routes are the backend (ADR 0001). Before writing Next.js code, read the bundled Next.js docs, since this version has breaking changes.
- The app talks to Supabase's Postgres directly with SQL through a standard Postgres driver, not through the Supabase REST client. This keeps every query runnable against an in-process Postgres in tests. Supabase is used for Postgres and for Google sign-in only.
- Photos go to Cloudinary. Local disk storage (the `data/` folder and the uploads route that serves from it) is removed, and so is all SQLite code.
- The hard-coded admin passcode and its cookie are removed.

### Adapters (the only substitutable boundaries)
Each outside dependency sits behind a small interface with one real and one fake implementation, chosen at startup:
- **Session**: returns the signed-in person (id, email) or none. Real: Supabase Auth JWT cookie. Fake: a test or demo identity.
- **Photo store**: takes image bytes, returns a public URL. Real: Cloudinary.
- **Vision AI**: takes a photo and description, returns Category, severity, confidence, summary, and whether it is a civic problem at all. Real: Gemini, then Groq, then the existing offline keyword guess as fallbacks. The Claude code path is removed.
- **Mailer**: sends one email (to, subject, body). Real: Gmail SMTP with an app password.
- **Clock**: returns "now", so the 7-day closure and the daily limit can be tested.

### Roles
- Role is derived on every request, never trusted from the client: email listed in the Super Admin setting → Super Admin; an approved Access request for that email → Authority; listed as staff of an Office → Office staff for exactly that Office; otherwise → Citizen.
- One person has one role. Every API route checks the role before doing anything; a wrong role gets a "forbidden" response, and no session gets "unauthenticated".
- Demo accounts are flagged as demo. Demo mode is a server setting; when on, a role switcher signs the visitor in as one of the Demo accounts. Records created by demo accounts are flagged demo, and pages a real account sees exclude demo records (and the other way round).

### Schema (Postgres)
New or changed tables, in outline:
- **people**: auth id, email, display name, phone, is_demo, suspended_at, created_at.
- **departments**: name. Seeded: Roads, Sanitation, Electrical, Water & Sewerage, Accessibility, Building Control, General Maintenance.
- **categories**: key, label, department, hazard bonus (see table below).
- **offices**: name, department, sector, lat, lng, is_demo.
- **office_staff**: office, email (one Office per email).
- **access_requests**: name, department, official email, phone, decision (pending / approved / declined), decided_by, timestamps.
- **issues**: as today, plus office (nullable), constituency, fixed_at, closed_at, fix_note, is_demo; status uses the new values below. `assigned_team` is replaced by the office reference.
- **reports**: as today, but `reporter_id` references **people** (no free-text reporter name), plus is_spam, flagged_by, deleted_at; voice fields reserved for the Urdu step.
- **events**: as today (the public timeline), plus the actor's role.
- Seed script loads the ~70 demo Issues (keeping the I-10, G-11, I-9 neglect story and the G-9 recurrence), 15–25 Islamabad Offices at approximate locations, the Demo accounts, and a sector → constituency lookup.

Category → Department and hazard bonus (from the prototype):

| Category | Department | Hazard |
|---|---|---|
| road_damage | Roads | 6 |
| blocked_footpath | Roads | 0 |
| garbage | Sanitation | 0 |
| streetlight | Electrical | 3 |
| electrical_hazard | Electrical | 0 |
| water_leak | Water & Sewerage | 5 |
| drainage | Water & Sewerage | 5 |
| accessibility | Accessibility | 6 |
| building_damage | Building Control | 0 |
| other | General Maintenance | 0 |

### Issue state machine
Encoded in the prototype's reducer; this table is its decision-rich part plus the rules the prototype skipped (role checks, timing):

| From | Command | Who | To | Side effects |
|---|---|---|---|---|
| — | submit Report (no Duplicate) | Citizen | Open | timeline entry |
| Open / Assigned / In progress / Fixed | submit Report (Duplicate) | Citizen | unchanged | report count +1, priority recomputed |
| Open | assign(office) | Authority | Assigned | email to Office staff |
| Assigned | send back(reason) | Office staff of that Office | Open | office cleared, reason on timeline |
| Assigned | start work | Office staff of that Office | In progress | |
| In progress | record Fix(after-photo, note) | Office staff of that Office | Fixed | fixed_at set, email to every reporting Citizen |
| Fixed | confirm | a Citizen who reported it | Resolved | resolved_at set, email to reporting Citizens |
| Fixed | reject(comment) | a Citizen who reported it | In progress | after-photo cleared, comment on timeline |
| Fixed, 7 days after fixed_at | (time) | system | Closed unconfirmed | closed_at set, email to reporting Citizens |

Any other command in any other state is refused with a "conflict" response and changes nothing. The 7-day closure is applied lazily whenever Issues are read (and optionally by a daily Vercel cron), using the Clock adapter, so it needs no background worker.

### Reporting rules (checked in this order)
1. Signed in, profile complete, not suspended.
2. Fewer than 10 Reports by this Citizen in the last 24 hours (Clock).
3. Photo present; the Vision AI says it is a civic problem, otherwise refused with a message.
4. Duplicate check against open Issues (existing scoring: 150 m radius, merge at ≥ 0.6). If the matched Issue already has a Report from this Citizen, refuse with "already reported".
5. Recurrence check (same Category within 60 m, resolved in the last 180 days), then merge or create, in one transaction.

### Spam flags
- Flagging hides the Report from every view and the duplicate/priority counts. If no unflagged Reports remain, the Issue is removed (soft-deleted). A Citizen's third flagged Report sets suspended_at.

### Privacy
- Reporter name, email and phone are included in responses only for an Authority, or for staff of the Office the Issue is currently assigned to. Every other response (public pages, other Citizens, other Offices) omits them. This is enforced in the API response shape, not in the UI.

### API surface (by role)
- Public: list Issues (map), get Issue (anonymous), stats and insights, request Authority access.
- Citizen: get/update own profile, submit Report, delete own Report, list own Reports, confirm Fix, reject Fix.
- Authority: priority queue, Issue review, Spam flag, suggested Offices for an Issue (same Department, ordered by distance), assign, list/add Offices, add/remove Office staff.
- Office staff: list own Office's jobs, start work, send back, record Fix.
- Super Admin: list Access requests, approve, decline.

### UI
- Screens follow the approved prototype (kept for reference in the app's private prototype folder): Citizen screens phone-first, staff screens laptop-first.
- All on-screen text goes through a translation file from the start (English only in this spec), so Urdu can be added without editing screens.

## Testing Decisions

- **One seam: the API.** Tests call the real API route handlers with real requests and check the response and what is stored afterwards. They never call internal functions or assert on SQL, so internals can be rewritten freely.
- **Database in tests: PGlite** (Postgres running in Node), with the real schema and a small per-test seed. No Docker needed.
- **Fakes at the adapters only:** Session (set who is signed in), Photo store (returns a fixed URL), Vision AI (returns a scripted reading), Mailer (records sent emails for assertions), Clock (set and advance time).
- **Test runner:** Vitest. There are no tests in the repo yet, so there is no prior art; the existing duplicate, priority and recurrence formulas get covered through API tests that submit Reports and read Issues.
- **What to cover:** every row of the state machine table (allowed and refused), every role gets "forbidden" on another role's commands, each reporting rule in order, spam-flag removal and suspension at 3, the 7-day closure by advancing the Clock, the three emails (recipients and trigger), and privacy (reporter contact present for Authority and the assigned Office, absent for public, other Citizens and other Offices), demo and real data kept apart.
- A good test reads like a user story: "Office staff of another Office cannot record a Fix" rather than "updateIssueStatus throws".

## Out of Scope

- MNA scorecard and Constituency pages (Constituency is only stored on each Issue).
- Office track record table (PLAN step 9), Urdu translation and Urdu voice Reports (PLAN step 10), demo polish (PLAN step 11).
- Impact Score rule changes; the existing impact score is kept as is.
- SMS phone verification, email-and-password sign-in, optional gender and other profile conveniences.
- Video Reports.
- Authorities limited to particular areas.
- Office capacity limits (noted in the prototype README as a later idea).

## Further Notes

- Deadline 28 November 2026. Build in PLAN order; each step must leave the deployed app working.
- The team creates the Google OAuth client, Cloudinary account, project Gmail app password and Gemini key; the Supabase and Vercel projects are created with the team's approval. Secrets go in environment variables, listed in a new `.env.example`.
- Supabase's connection pooler should be used from Vercel's serverless functions to avoid running out of connections.
- New concepts that appear during implementation go into `GLOSSARY.md`; a rule change updates `docs/PRD.md` in the same change.
