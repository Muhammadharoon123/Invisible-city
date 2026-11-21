import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { NEIGHBORHOODS } from "./geo";
import { computePriority } from "./scoring";
import {
  CATEGORIES,
  CATEGORY_META,
  Category,
  Issue,
  IssueEvent,
  Report,
  Severity,
  Status,
} from "./types";

export const DATA_DIR = path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  neighborhood TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority INTEGER NOT NULL DEFAULT 0,
  assigned_team TEXT,
  report_count INTEGER NOT NULL DEFAULT 1,
  cover_image TEXT,
  after_image TEXT,
  resolution_note TEXT,
  recurrence_of INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  resolved_at TEXT
);
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  issue_id INTEGER NOT NULL REFERENCES issues(id),
  reporter_id TEXT NOT NULL,
  reporter_name TEXT,
  description TEXT NOT NULL DEFAULT '',
  image TEXT,
  image_hash TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  ai_category TEXT NOT NULL,
  ai_severity TEXT NOT NULL,
  ai_confidence REAL NOT NULL,
  ai_summary TEXT NOT NULL,
  ai_source TEXT NOT NULL,
  duplicate_score REAL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  issue_id INTEGER NOT NULL REFERENCES issues(id),
  kind TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reports_issue ON reports(issue_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_events_issue ON events(issue_id);
`;

const g = globalThis as unknown as { __icDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (!g.__icDb) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const d = new DatabaseSync(path.join(DATA_DIR, "invisible-city.db"));
    d.exec("PRAGMA journal_mode = WAL;");
    d.exec(SCHEMA);
    g.__icDb = d;
    const { n } = d.prepare("SELECT COUNT(*) AS n FROM issues").get() as { n: number };
    if (n === 0 && process.env.SEED_DEMO_DATA !== "false") seed(d);
  }
  return g.__icDb;
}

export function tx<T>(fn: (d: DatabaseSync) => T): T {
  const d = db();
  d.exec("BEGIN");
  try {
    const r = fn(d);
    d.exec("COMMIT");
    return r;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}

const now = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------
function withLivePriority(i: Issue): Issue {
  return { ...i, priority: computePriority(i) };
}

export function listIssues(filter: { status?: string; category?: string; neighborhood?: string } = {}) {
  const where: string[] = [];
  const params: string[] = [];
  if (filter.status === "unresolved") where.push("status != 'resolved'");
  else if (filter.status) {
    where.push("status = ?");
    params.push(filter.status);
  }
  if (filter.category) {
    where.push("category = ?");
    params.push(filter.category);
  }
  if (filter.neighborhood) {
    where.push("neighborhood = ?");
    params.push(filter.neighborhood);
  }
  const sql = `SELECT * FROM issues ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
  const rows = db().prepare(sql).all(...params) as unknown as Issue[];
  return rows.map(withLivePriority).sort((a, b) => b.priority - a.priority || b.id - a.id);
}

export function getIssue(id: number) {
  const issue = db().prepare("SELECT * FROM issues WHERE id = ?").get(id) as unknown as Issue | undefined;
  if (!issue) return null;
  const reports = db()
    .prepare("SELECT * FROM reports WHERE issue_id = ? ORDER BY created_at ASC")
    .all(id) as unknown as Report[];
  const events = db()
    .prepare("SELECT * FROM events WHERE issue_id = ? ORDER BY created_at ASC, id ASC")
    .all(id) as unknown as IssueEvent[];
  return { issue: withLivePriority(issue), reports, events };
}

/** Unresolved issues with the image hashes of their reports, for duplicate detection. */
export function duplicateCandidates() {
  const issues = db().prepare("SELECT * FROM issues WHERE status != 'resolved'").all() as unknown as Issue[];
  const hashRows = db()
    .prepare("SELECT issue_id, image_hash FROM reports WHERE image_hash IS NOT NULL")
    .all() as { issue_id: number; image_hash: string }[];
  const byIssue = new Map<number, string[]>();
  for (const r of hashRows) {
    const list = byIssue.get(r.issue_id) ?? [];
    list.push(r.image_hash);
    byIssue.set(r.issue_id, list);
  }
  return issues.map((i) => ({ ...i, hashes: byIssue.get(i.id) ?? [] }));
}

export function recentlyResolvedNearby(category: Category) {
  return db()
    .prepare(
      "SELECT * FROM issues WHERE status = 'resolved' AND category = ? AND resolved_at > ?",
    )
    .all(category, new Date(Date.now() - 180 * 86_400_000).toISOString()) as unknown as Issue[];
}

export function addEvent(issueId: number, kind: string, message: string, at = now()) {
  db().prepare("INSERT INTO events (issue_id, kind, message, created_at) VALUES (?, ?, ?, ?)").run(
    issueId,
    kind,
    message,
    at,
  );
}

export function reportsByReporter(reporterId: string) {
  return db()
    .prepare(
      `SELECT r.*, i.status AS issue_status, i.title AS issue_title, i.report_count AS issue_report_count,
              i.after_image AS issue_after_image, i.assigned_team AS issue_team, i.neighborhood AS issue_neighborhood
       FROM reports r JOIN issues i ON i.id = r.issue_id
       WHERE r.reporter_id = ? ORDER BY r.created_at DESC`,
    )
    .all(reporterId);
}

// ---------------------------------------------------------------------------
// Demo seed data: gives the map, heatmap and neighbourhood analytics something
// realistic to show on first launch. Deterministic so demos are repeatable.
// ---------------------------------------------------------------------------
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const SEED_TEXT: Record<Category, string[]> = {
  road_damage: [
    "Deep pothole near the service road, cars swerving to avoid it",
    "Large crack across the road surface after rain",
    "Broken asphalt at the junction, bikes keep slipping",
    "Pothole filled with water, impossible to see at night",
  ],
  garbage: [
    "Garbage bin overflowing for days, smell is unbearable",
    "Waste dumped on the green belt next to the market",
    "Litter pile attracting stray dogs near the school",
  ],
  streetlight: [
    "Streetlight not working, whole lane is dark at night",
    "Three lights out along the main avenue",
    "Lamp post leaning with exposed wires",
  ],
  water_leak: [
    "Water pipe leaking, clean water running onto the road",
    "Burst main flooding the street every morning",
  ],
  drainage: [
    "Drain blocked, sewage overflowing into the street",
    "Standing water after rain, nala clogged with plastic",
  ],
  blocked_footpath: [
    "Footpath blocked by construction debris",
    "Shops encroaching onto the footpath, pedestrians forced onto the road",
  ],
  accessibility: [
    "No ramp at the market entrance, wheelchair users can't get in",
    "Tactile paving broken and missing near the bus stop",
  ],
  other: ["Fallen tree branch partially blocking the lane"],
};

const SEED_NAMES = ["Ayesha K.", "Hamza R.", "Fatima S.", "Bilal A.", "Zainab M.", "Usman T.", "Sana I.", "Ali H.", "Mariam N.", "Omar F."];

// [neighbourhood, number of issues, share resolved]
const SEED_PROFILE: [string, number, number][] = [
  ["F-6", 5, 0.8],
  ["F-7", 6, 0.85],
  ["F-8", 4, 0.75],
  ["F-10", 4, 0.5],
  ["F-11", 3, 0.67],
  ["Blue Area", 4, 0.75],
  ["G-6", 4, 0.5],
  ["G-7", 3, 0.34],
  ["G-8", 4, 0.5],
  ["G-9", 7, 0.43],
  ["G-10", 3, 0.67],
  ["G-11", 5, 0.2],
  ["H-8", 2, 0.5],
  ["I-8", 3, 0.67],
  ["I-9", 4, 0.25],
  ["I-10", 8, 0.12],
];

function seed(d: DatabaseSync) {
  const rand = rng(42);
  const pick = <T,>(a: readonly T[]) => a[Math.floor(rand() * a.length)];
  const sevs: Severity[] = ["low", "medium", "medium", "high", "high", "critical"];
  const insertIssue = d.prepare(`INSERT INTO issues
    (category, severity, title, summary, lat, lng, neighborhood, status, priority, assigned_team, report_count,
     resolution_note, created_at, updated_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`);
  const insertReport = d.prepare(`INSERT INTO reports
    (issue_id, reporter_id, reporter_name, description, lat, lng, ai_category, ai_severity, ai_confidence,
     ai_summary, ai_source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'seed', ?)`);

  d.exec("BEGIN");
  for (const [name, count, resolvedShare] of SEED_PROFILE) {
    const hood = NEIGHBORHOODS.find((n) => n.name === name)!;
    const resolvedCount = Math.round(count * resolvedShare);
    for (let k = 0; k < count; k++) {
      // G-9 gets recurring road damage to drive the predictive-maintenance insight.
      const category: Category =
        name === "G-9" && k < 4 ? "road_damage" : pick(CATEGORIES.filter((c) => c !== "other"));
      const severity = pick(sevs);
      const text = pick(SEED_TEXT[category]);
      const lat = hood.lat + (rand() - 0.5) * 0.012;
      const lng = hood.lng + (rand() - 0.5) * 0.014;
      const ageDays = 3 + Math.floor(rand() * 75);
      const created = new Date(Date.now() - ageDays * 86_400_000);
      const resolved = k < resolvedCount;
      const reportCount = 1 + Math.floor(rand() * rand() * 9);
      const team = CATEGORY_META[category].team;
      const status: Status = resolved ? "resolved" : rand() < 0.35 ? "assigned" : "open";
      const resolvedAt = resolved
        ? new Date(created.getTime() + (1 + rand() * Math.min(ageDays - 1, 14)) * 86_400_000)
        : null;
      const r = insertIssue.run(
        category,
        severity,
        text.split(",")[0],
        text + ".",
        lat,
        lng,
        name,
        status,
        status === "open" ? null : team,
        reportCount,
        resolved ? "Repaired by field team." : null,
        created.toISOString(),
        (resolvedAt ?? created).toISOString(),
        resolvedAt?.toISOString() ?? null,
      );
      const issueId = Number(r.lastInsertRowid);
      addEventRaw(d, issueId, "created", `Reported by citizen in ${name}`, created.toISOString());
      for (let j = 0; j < reportCount; j++) {
        const at = new Date(created.getTime() + j * rand() * 2 * 86_400_000).toISOString();
        const reporter = pick(SEED_NAMES);
        insertReport.run(
          issueId,
          "seed-" + reporter.replace(/\W/g, "").toLowerCase(),
          reporter,
          j === 0 ? text : pick(SEED_TEXT[category]),
          lat + (rand() - 0.5) * 0.0004,
          lng + (rand() - 0.5) * 0.0004,
          category,
          severity,
          0.8,
          text,
          at,
        );
      }
      if (reportCount > 1)
        addEventRaw(d, issueId, "merged", `${reportCount - 1} duplicate report(s) grouped by AI`, created.toISOString());
      if (status !== "open")
        addEventRaw(d, issueId, "assigned", `Assigned to ${team}`, new Date(created.getTime() + 86_400_000).toISOString());
      if (resolvedAt) addEventRaw(d, issueId, "resolved", "Marked resolved by city official", resolvedAt.toISOString());
    }
  }
  d.exec("COMMIT");
}

function addEventRaw(d: DatabaseSync, issueId: number, kind: string, message: string, at: string) {
  d.prepare("INSERT INTO events (issue_id, kind, message, created_at) VALUES (?, ?, ?, ?)").run(issueId, kind, message, at);
}
