// Throwaway prototype data. Everything here is made up and lives only in browser memory.
// Delete the whole app/prototype folder once the layouts are approved (docs/PLAN.md step 0).

export type Role = "citizen" | "authority" | "office" | "superadmin";

export type Status = "open" | "assigned" | "in_progress" | "fixed" | "resolved" | "closed_unconfirmed";
export const FLOW: Status[] = ["open", "assigned", "in_progress", "fixed", "resolved"];
export const STATUS_LABEL: Record<Status, string> = {
  open: "Open",
  assigned: "Assigned",
  in_progress: "In progress",
  fixed: "Fixed",
  resolved: "Resolved",
  closed_unconfirmed: "Closed unconfirmed",
};

export type Severity = "low" | "medium" | "high" | "critical";
export const SEVERITY_WEIGHT: Record<Severity, number> = { low: 1, medium: 2, high: 3, critical: 4 };

export type Department =
  | "Roads"
  | "Sanitation"
  | "Electrical"
  | "Water & Sewerage"
  | "Accessibility"
  | "Building Control"
  | "General Maintenance";
export const DEPARTMENTS: Department[] = [
  "Roads",
  "Sanitation",
  "Electrical",
  "Water & Sewerage",
  "Accessibility",
  "Building Control",
  "General Maintenance",
];

export type Category =
  | "road_damage"
  | "blocked_footpath"
  | "garbage"
  | "streetlight"
  | "electrical_hazard"
  | "water_leak"
  | "drainage"
  | "accessibility"
  | "building_damage"
  | "other";

export const CATEGORY: Record<Category, { label: string; department: Department; hazard: number }> = {
  road_damage: { label: "Road damage / pothole", department: "Roads", hazard: 6 },
  blocked_footpath: { label: "Blocked footpath", department: "Roads", hazard: 0 },
  garbage: { label: "Garbage overflow", department: "Sanitation", hazard: 0 },
  streetlight: { label: "Broken streetlight", department: "Electrical", hazard: 3 },
  electrical_hazard: { label: "Electrical hazard", department: "Electrical", hazard: 0 },
  water_leak: { label: "Water leak", department: "Water & Sewerage", hazard: 5 },
  drainage: { label: "Blocked drain / flooding", department: "Water & Sewerage", hazard: 5 },
  accessibility: { label: "Accessibility barrier", department: "Accessibility", hazard: 6 },
  building_damage: { label: "Building / structural damage", department: "Building Control", hazard: 0 },
  other: { label: "Other", department: "General Maintenance", hazard: 0 },
};
export const CATEGORIES = Object.keys(CATEGORY) as Category[];

export interface Office {
  id: string;
  name: string;
  department: Department;
  sector: string;
  lat: number;
  lng: number;
  staff: string[];
}

export interface Report {
  id: string;
  citizenId: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  urdu?: string;
  photo: string | null; // object URL of a picked photo, or null for the placeholder
  at: string;
  spam: boolean;
}

export interface TimelineEntry {
  at: string;
  text: string;
}

export interface Issue {
  id: number;
  title: string;
  category: Category;
  severity: Severity;
  status: Status;
  sector: string;
  lat: number;
  lng: number;
  ageDays: number;
  recurring: boolean;
  reports: Report[];
  officeId: string | null;
  afterPhoto: string | null | "placeholder";
  fixNote: string;
  timeline: TimelineEntry[];
}

export interface AccessRequest {
  id: string;
  name: string;
  department: string;
  email: string;
  phone: string;
  at: string;
  decision: "pending" | "approved" | "declined";
}

export interface Profile {
  name: string;
  phone: string;
}

export interface State {
  profile: Profile | null;
  issues: Issue[];
  offices: Office[];
  requests: AccessRequest[];
  spamCount: Record<string, number>;
  minute: number; // fake clock, minutes after 22 Nov 09:00
  nextId: number;
  toast: string | null;
}

export const ME = { id: "c-me", email: "ayesha.khan@gmail.com" };

export function clock(minute: number) {
  const day = 22 + Math.floor((9 * 60 + minute) / (24 * 60));
  const m = (9 * 60 + minute) % (24 * 60);
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${day} Nov, ${hh}:${mm}`;
}

/* ---------- geo + priority (same formulas as the PRD) ---------- */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function liveReports(issue: Issue) {
  return issue.reports.filter((r) => !r.spam);
}

export function priority(issue: Issue) {
  if (issue.status === "resolved" || issue.status === "closed_unconfirmed") return 0;
  const n = Math.max(1, liveReports(issue).length);
  const p =
    SEVERITY_WEIGHT[issue.severity] * 15 +
    Math.min(20, 8 * Math.log2(n)) +
    Math.min(10, 0.4 * issue.ageDays) +
    CATEGORY[issue.category].hazard +
    (issue.recurring ? 4 : 0);
  return Math.min(100, Math.round(p));
}

/* ---------- seed ---------- */
const OFFICES: Office[] = [
  { id: "o-roads-f10", name: "CDA Roads Maintenance, F-10", department: "Roads", sector: "F-10", lat: 33.6955, lng: 73.0105, staff: ["imran.roads@cda.gov.pk", "sana.roads@cda.gov.pk"] },
  { id: "o-roads-g9", name: "CDA Roads Maintenance, G-9", department: "Roads", sector: "G-9", lat: 33.6880, lng: 73.0335, staff: ["kashif.g9@cda.gov.pk"] },
  { id: "o-roads-i8", name: "CDA Roads Maintenance, I-8", department: "Roads", sector: "I-8", lat: 33.6680, lng: 73.0750, staff: ["rehan.i8@cda.gov.pk"] },
  { id: "o-roads-blue", name: "CDA Roads Directorate, Blue Area", department: "Roads", sector: "Blue Area", lat: 33.7180, lng: 73.0700, staff: [] },
  { id: "o-san-f7", name: "CDA Sanitation, F-7", department: "Sanitation", sector: "F-7", lat: 33.7200, lng: 73.0550, staff: ["nadia.san@cda.gov.pk"] },
  { id: "o-san-g9", name: "CDA Sanitation, G-9", department: "Sanitation", sector: "G-9", lat: 33.6870, lng: 73.0300, staff: ["tariq.san@cda.gov.pk"] },
  { id: "o-san-i10", name: "CDA Sanitation, I-10", department: "Sanitation", sector: "I-10", lat: 33.6450, lng: 73.0380, staff: [] },
  { id: "o-iesco-f8", name: "IESCO Sub-division, F-8", department: "Electrical", sector: "F-8", lat: 33.7090, lng: 73.0400, staff: ["line.f8@iesco.com.pk"] },
  { id: "o-iesco-g10", name: "IESCO Sub-division, G-10", department: "Electrical", sector: "G-10", lat: 33.6750, lng: 73.0150, staff: ["line.g10@iesco.com.pk"] },
  { id: "o-iesco-i9", name: "IESCO Sub-division, I-9", department: "Electrical", sector: "I-9", lat: 33.6550, lng: 73.0600, staff: [] },
  { id: "o-ws-f11", name: "CDA Water & Sewerage, F-11", department: "Water & Sewerage", sector: "F-11", lat: 33.6850, lng: 72.9900, staff: ["asad.ws@cda.gov.pk"] },
  { id: "o-ws-g6", name: "CDA Water & Sewerage, G-6", department: "Water & Sewerage", sector: "G-6", lat: 33.7200, lng: 73.0900, staff: ["hina.ws@cda.gov.pk"] },
  { id: "o-acc-blue", name: "CDA Accessibility Cell, Blue Area", department: "Accessibility", sector: "Blue Area", lat: 33.7170, lng: 73.0720, staff: [] },
  { id: "o-bc-g7", name: "CDA Building Control, G-7", department: "Building Control", sector: "G-7", lat: 33.7050, lng: 73.0800, staff: [] },
  { id: "o-gm-h8", name: "CDA General Maintenance, H-8", department: "General Maintenance", sector: "H-8", lat: 33.6780, lng: 73.0650, staff: ["ops.h8@cda.gov.pk"] },
];

function rep(id: string, who: "me" | "bilal" | "usman" | "fatima" | "spammer", description: string, at: string, urdu?: string): Report {
  const people = {
    me: { citizenId: ME.id, name: "Ayesha Khan", email: ME.email, phone: "+92 301 2345678" },
    bilal: { citizenId: "c-bilal", name: "Bilal Ahmed", email: "bilal.ahmed@gmail.com", phone: "+92 333 9876543" },
    usman: { citizenId: "c-usman", name: "Usman Tariq", email: "usman.t@gmail.com", phone: "+92 345 1122334" },
    fatima: { citizenId: "c-fatima", name: "Fatima Noor", email: "fatima.noor@gmail.com", phone: "+92 312 5566778" },
    spammer: { citizenId: "c-spam", name: "xx_gamer", email: "freecoins4u@gmail.com", phone: "+92 300 0000000" },
  };
  return { id, ...people[who], description, urdu, photo: null, at, spam: false };
}

export function seed(): State {
  return {
    profile: null,
    minute: 0,
    nextId: 200,
    toast: null,
    spamCount: { "c-spam": 2 },
    offices: OFFICES.map((o) => ({ ...o, staff: [...o.staff] })),
    requests: [
      { id: "ar1", name: "Shahid Mehmood", department: "CDA Roads Directorate", email: "shahid.mehmood@cda.gov.pk", phone: "+92 300 5551234", at: "21 Nov, 16:20", decision: "pending" },
      { id: "ar2", name: "Rabia Saleem", department: "IESCO Islamabad Circle", email: "rabia.saleem@iesco.com.pk", phone: "+92 321 4447788", at: "22 Nov, 08:05", decision: "pending" },
      { id: "ar3", name: "Ali Raza", department: "Municipal (says he is)", email: "aliraza1999@gmail.com", phone: "+92 311 0001111", at: "22 Nov, 08:40", decision: "pending" },
      { id: "ar0", name: "Zainab Qureshi", department: "CDA Sanitation", email: "zainab.q@cda.gov.pk", phone: "+92 302 8889990", at: "18 Nov, 11:00", decision: "approved" },
    ],
    issues: [
      {
        id: 101, title: "Deep pothole on Street 41", category: "road_damage", severity: "high", status: "open",
        sector: "F-10/3", lat: 33.6968, lng: 73.0142, ageDays: 3, recurring: true, officeId: null, afterPhoto: null, fixNote: "",
        reports: [
          rep("r1", "me", "Big pothole in the middle of the road, two bikes fell yesterday.", "19 Nov, 18:10", "سڑک کے بیچ میں بڑا گڑھا ہے"),
          rep("r2", "bilal", "Same pothole, it filled with water after rain.", "21 Nov, 07:45"),
        ],
        timeline: [
          { at: "19 Nov, 18:10", text: "Reported. AI read: road damage, high severity" },
          { at: "19 Nov, 18:10", text: "Recurrence: same spot was resolved on 2 Aug" },
          { at: "21 Nov, 07:45", text: "A second Report was merged as a Duplicate" },
        ],
      },
      {
        id: 102, title: "Garbage overflowing at Karachi Company", category: "garbage", severity: "medium", status: "open",
        sector: "G-9 Markaz", lat: 33.6885, lng: 73.0330, ageDays: 6, recurring: false, officeId: null, afterPhoto: null, fixNote: "",
        reports: [
          rep("r3", "usman", "Bins have not been emptied for a week, smell is bad.", "16 Nov, 10:00"),
          rep("r4", "fatima", "Garbage spilling onto the footpath.", "18 Nov, 12:30"),
          rep("r5", "bilal", "Still not collected.", "21 Nov, 19:00"),
        ],
        timeline: [
          { at: "16 Nov, 10:00", text: "Reported. AI read: garbage overflow, medium severity" },
          { at: "18 Nov, 12:30", text: "A second Report was merged as a Duplicate" },
          { at: "21 Nov, 19:00", text: "A third Report was merged as a Duplicate" },
        ],
      },
      {
        id: 103, title: "Photo of a phone screen", category: "other", severity: "low", status: "open",
        sector: "F-9 Park", lat: 33.7010, lng: 73.0250, ageDays: 0, recurring: false, officeId: null, afterPhoto: null, fixNote: "",
        reports: [rep("r6", "spammer", "lol", "22 Nov, 08:55")],
        timeline: [{ at: "22 Nov, 08:55", text: "Reported. AI read: other, low severity, confidence 0.31" }],
      },
      {
        id: 104, title: "Streetlight out near Jinnah Avenue crossing", category: "streetlight", severity: "medium", status: "fixed",
        sector: "F-8/2", lat: 33.7105, lng: 73.0420, ageDays: 9, recurring: false, officeId: "o-iesco-f8", afterPhoto: "placeholder",
        fixNote: "Replaced the sodium lamp and the fuse.",
        reports: [rep("r7", "me", "Whole stretch is dark at night, unsafe for walking.", "13 Nov, 21:15")],
        timeline: [
          { at: "13 Nov, 21:15", text: "Reported. AI read: broken streetlight, medium severity" },
          { at: "14 Nov, 10:02", text: "Assigned to IESCO Sub-division, F-8" },
          { at: "17 Nov, 09:30", text: "Work started" },
          { at: "21 Nov, 15:40", text: "Fix recorded with an after-repair photo" },
        ],
      },
      {
        id: 105, title: "Water leaking from main line near I-8 Markaz", category: "water_leak", severity: "high", status: "in_progress",
        sector: "I-8 Markaz", lat: 33.6690, lng: 73.0760, ageDays: 4, recurring: false, officeId: "o-ws-g6", afterPhoto: null, fixNote: "",
        reports: [rep("r8", "fatima", "Clean water running down the road for days.", "18 Nov, 08:00")],
        timeline: [
          { at: "18 Nov, 08:00", text: "Reported. AI read: water leak, high severity" },
          { at: "18 Nov, 13:10", text: "Assigned to CDA Water & Sewerage, G-6" },
          { at: "20 Nov, 09:00", text: "Work started" },
        ],
      },
      {
        id: 106, title: "Blocked drain flooding the service road", category: "drainage", severity: "medium", status: "assigned",
        sector: "G-10/4", lat: 33.6760, lng: 73.0170, ageDays: 2, recurring: false, officeId: "o-ws-f11", afterPhoto: null, fixNote: "",
        reports: [rep("r9", "usman", "Drain is full of plastic, water stands for hours after rain.", "20 Nov, 17:20")],
        timeline: [
          { at: "20 Nov, 17:20", text: "Reported. AI read: blocked drain, medium severity" },
          { at: "21 Nov, 11:00", text: "Assigned to CDA Water & Sewerage, F-11" },
        ],
      },
      {
        id: 107, title: "Broken footpath tiles outside the school", category: "blocked_footpath", severity: "low", status: "resolved",
        sector: "F-7/2", lat: 33.7210, lng: 73.0530, ageDays: 25, recurring: false, officeId: "o-roads-blue", afterPhoto: "placeholder",
        fixNote: "Tiles relaid.",
        reports: [rep("r10", "me", "Children trip on the loose tiles every morning.", "28 Oct, 08:15")],
        timeline: [
          { at: "28 Oct, 08:15", text: "Reported" },
          { at: "29 Oct, 10:00", text: "Assigned to CDA Roads Directorate, Blue Area" },
          { at: "4 Nov, 14:00", text: "Fix recorded with an after-repair photo" },
          { at: "5 Nov, 09:12", text: "Resolution: a reporting Citizen confirmed the Fix" },
        ],
      },
    ],
  };
}

/* ---------- actions ---------- */
export type Action =
  | { type: "reset" }
  | { type: "dismissToast" }
  | { type: "setProfile"; profile: Profile }
  | {
      type: "submitReport";
      category: Category;
      severity: Severity;
      title: string;
      description: string;
      urdu?: string;
      lat: number;
      lng: number;
      sector: string;
      photo: string | null;
    }
  | { type: "deleteReport"; issueId: number; reportId: string }
  | { type: "assign"; issueId: number; officeId: string }
  | { type: "startWork"; issueId: number }
  | { type: "sendBack"; issueId: number; reason: string }
  | { type: "markFixed"; issueId: number; note: string; photo: string | "placeholder" }
  | { type: "confirmFix"; issueId: number }
  | { type: "rejectFix"; issueId: number; comment: string }
  | { type: "spamFlag"; issueId: number; reportId: string }
  | { type: "addOffice"; name: string; department: Department; sector: string }
  | { type: "addStaff"; officeId: string; email: string }
  | { type: "removeStaff"; officeId: string; email: string }
  | { type: "decideAccess"; id: string; approve: boolean }
  | { type: "requestAccess"; name: string; department: string; email: string; phone: string };

function officeName(s: State, id: string) {
  return s.offices.find((o) => o.id === id)?.name ?? id;
}

function patchIssue(s: State, id: number, fn: (i: Issue, at: string) => Issue, toast: string): State {
  const minute = s.minute + 7;
  const at = clock(minute);
  return { ...s, minute, toast, issues: s.issues.map((i) => (i.id === id ? fn(i, at) : i)) };
}

const log = (i: Issue, at: string, text: string) => [...i.timeline, { at, text }];

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "reset":
      return seed();
    case "dismissToast":
      return { ...s, toast: null };
    case "setProfile":
      return { ...s, profile: a.profile, toast: "Profile saved" };
    case "submitReport": {
      const minute = s.minute + 3;
      const at = clock(minute);
      const id = s.nextId;
      const issue: Issue = {
        id, title: a.title, category: a.category, severity: a.severity, status: "open", sector: a.sector,
        lat: a.lat, lng: a.lng, ageDays: 0, recurring: false, officeId: null, afterPhoto: null, fixNote: "",
        reports: [
          {
            id: `r${id}`, citizenId: ME.id, name: s.profile?.name ?? "Ayesha Khan", email: ME.email,
            phone: s.profile?.phone ?? "+92 301 2345678", description: a.description, urdu: a.urdu, photo: a.photo, at, spam: false,
          },
        ],
        timeline: [{ at, text: `Reported. Category: ${CATEGORY[a.category].label}, ${a.severity} severity` }],
      };
      return { ...s, minute, nextId: id + 1, issues: [issue, ...s.issues], toast: `Report sent. Issue #${id} is Open` };
    }
    case "deleteReport": {
      const issue = s.issues.find((i) => i.id === a.issueId);
      if (!issue || issue.status !== "open") return s;
      const rest = issue.reports.filter((r) => r.id !== a.reportId);
      const issues = rest.length
        ? s.issues.map((i) => (i.id === a.issueId ? { ...i, reports: rest } : i))
        : s.issues.filter((i) => i.id !== a.issueId);
      return { ...s, issues, toast: "Your Report was deleted" };
    }
    case "assign":
      return patchIssue(s, a.issueId, (i, at) => ({ ...i, status: "assigned", officeId: a.officeId, timeline: log(i, at, `Assigned to ${officeName(s, a.officeId)}`) }), `Issue #${a.issueId} assigned. Email sent to the Office staff`);
    case "startWork":
      return patchIssue(s, a.issueId, (i, at) => ({ ...i, status: "in_progress", timeline: log(i, at, "Work started") }), `Issue #${a.issueId} is In progress`);
    case "sendBack":
      return patchIssue(s, a.issueId, (i, at) => ({ ...i, status: "open", officeId: null, timeline: log(i, at, `Sent back by ${officeName(s, i.officeId ?? "")}: ${a.reason}`) }), `Issue #${a.issueId} sent back to the Authorities`);
    case "markFixed":
      return patchIssue(s, a.issueId, (i, at) => ({ ...i, status: "fixed", afterPhoto: a.photo, fixNote: a.note, timeline: log(i, at, "Fix recorded with an after-repair photo") }), `Issue #${a.issueId} marked Fixed. Reporting Citizens were emailed`);
    case "confirmFix":
      return patchIssue(s, a.issueId, (i, at) => ({ ...i, status: "resolved", timeline: log(i, at, "Resolution: a reporting Citizen confirmed the Fix") }), `Thanks! Issue #${a.issueId} is Resolved`);
    case "rejectFix":
      return patchIssue(s, a.issueId, (i, at) => ({ ...i, status: "in_progress", afterPhoto: null, timeline: log(i, at, `Rejection: "${a.comment}"`) }), `Rejection sent. Issue #${a.issueId} is back In progress`);
    case "spamFlag": {
      const issue = s.issues.find((i) => i.id === a.issueId);
      const report = issue?.reports.find((r) => r.id === a.reportId);
      if (!issue || !report) return s;
      const count = (s.spamCount[report.citizenId] ?? 0) + 1;
      const spamCount = { ...s.spamCount, [report.citizenId]: count };
      const suspended = count >= 3 ? ` ${report.name} is now suspended.` : "";
      const reports = issue.reports.map((r) => (r.id === a.reportId ? { ...r, spam: true } : r));
      if (reports.every((r) => r.spam))
        return { ...s, spamCount, issues: s.issues.filter((i) => i.id !== a.issueId), toast: `Spam flag added. Issue #${a.issueId} removed (it had no other Reports).${suspended}` };
      return { ...s, spamCount, issues: s.issues.map((i) => (i.id === a.issueId ? { ...i, reports } : i)), toast: `Spam flag added. The Report is hidden.${suspended}` };
    }
    case "addOffice": {
      const id = `o-new-${s.nextId}`;
      const office: Office = { id, name: a.name, department: a.department, sector: a.sector, lat: 33.69, lng: 73.04, staff: [] };
      return { ...s, nextId: s.nextId + 1, offices: [...s.offices, office], toast: `${a.name} added` };
    }
    case "addStaff":
      return { ...s, offices: s.offices.map((o) => (o.id === a.officeId ? { ...o, staff: [...o.staff, a.email] } : o)), toast: `${a.email} can now sign in as Office staff` };
    case "removeStaff":
      return { ...s, offices: s.offices.map((o) => (o.id === a.officeId ? { ...o, staff: o.staff.filter((e) => e !== a.email) } : o)), toast: `${a.email} removed` };
    case "decideAccess":
      return { ...s, requests: s.requests.map((r) => (r.id === a.id ? { ...r, decision: a.approve ? "approved" : "declined" } : r)), toast: a.approve ? "Approved. They are now an Authority" : "Access request declined" };
    case "requestAccess": {
      const id = `ar${s.nextId}`;
      return { ...s, nextId: s.nextId + 1, requests: [{ id, name: a.name, department: a.department, email: a.email, phone: a.phone, at: clock(s.minute), decision: "pending" }, ...s.requests], toast: "Access request sent to the Super Admins" };
    }
  }
}
