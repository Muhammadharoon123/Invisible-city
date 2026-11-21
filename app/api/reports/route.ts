import { analyzeReport } from "@/lib/ai";
import {
  addEvent,

  duplicateCandidates,
  getIssue,
  recentlyResolvedNearby,
  reportsByReporter,
  tx,
} from "@/lib/db";
import { haversineMeters, nearestNeighborhood } from "@/lib/geo";
import { contributors } from "@/lib/insights";
import { computePriority, findDuplicate, maxSeverity } from "@/lib/scoring";
import { CATEGORIES, CATEGORY_META, Category, Issue } from "@/lib/types";
import { saveImage } from "@/lib/uploads";

export async function GET(req: Request) {
  const reporterId = new URL(req.url).searchParams.get("reporterId");
  if (!reporterId) return Response.json({ error: "reporterId required" }, { status: 400 });
  return Response.json({
    reports: reportsByReporter(reporterId),
    impact: contributors(reporterId)[0] ?? null,
  });
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart form data" }, { status: 400 });
  }
  const description = String(form.get("description") ?? "").slice(0, 2000);
  const lat = Number(form.get("lat"));
  const lng = Number(form.get("lng"));
  const reporterId = String(form.get("reporterId") ?? "").slice(0, 64) || "anonymous";
  const reporterName = String(form.get("reporterName") ?? "").slice(0, 80) || null;
  const hashRaw = String(form.get("imageHash") ?? "");
  const imageHash = /^[0-9a-f]{16}$/.test(hashRaw) ? hashRaw : null;
  const hintRaw = String(form.get("categoryHint") ?? "");
  const categoryHint = (CATEGORIES as readonly string[]).includes(hintRaw) ? (hintRaw as Category) : null;
  const image = form.get("image");

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
    return Response.json({ error: "A valid location is required" }, { status: 400 });
  if (!(image instanceof File && image.size > 0) && !description.trim())
    return Response.json({ error: "Add a photo or a description" }, { status: 400 });

  let saved: Awaited<ReturnType<typeof saveImage>> | null = null;
  if (image instanceof File && image.size > 0) {
    try {
      saved = await saveImage(image);
    } catch (e) {
      return Response.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  // 1. AI: classify + estimate severity
  const ai = await analyzeReport({
    imageBase64: saved ? saved.buf.toString("base64") : null,
    mediaType: saved?.mediaType ?? "image/jpeg",
    description,
    categoryHint,
  });

  // 2. AI: duplicate detection against open issues
  const match = findDuplicate(duplicateCandidates(), {
    lat,
    lng,
    category: ai.category,
    hash: imageHash,
  });

  // 3. Recurrence: same problem re-appearing where a repair was made recently
  const recurrence = match
    ? null
    : recentlyResolvedNearby(ai.category).find((i) => haversineMeters(lat, lng, i.lat, i.lng) < 60) ?? null;

  const now = new Date().toISOString();
  const neighborhood = nearestNeighborhood(lat, lng);

  const issueId = tx((d) => {
    let id: number;
    if (match) {
      const issue = match.issue;
      const severity = maxSeverity(issue.severity, ai.severity);
      const reportCount = issue.report_count + 1;
      d.prepare(
        `UPDATE issues SET severity = ?, report_count = ?, cover_image = COALESCE(cover_image, ?),
         priority = ?, updated_at = ? WHERE id = ?`,
      ).run(
        severity,
        reportCount,
        saved?.name ?? null,
        computePriority({ ...issue, severity, report_count: reportCount }),
        now,
        issue.id,
      );
      id = issue.id;
      addEvent(
        id,
        "merged",
        `New report grouped as duplicate (match ${Math.round(match.score * 100)}%, ${match.distance} m away). ${reportCount} citizens have now reported this.`,
        now,
      );
      if (severity !== issue.severity) addEvent(id, "escalated", `Severity raised to ${severity}`, now);
    } else {
      const base: Pick<Issue, "severity" | "category" | "report_count" | "created_at" | "status" | "recurrence_of"> = {
        severity: ai.severity,
        category: ai.category,
        report_count: 1,
        created_at: now,
        status: "open",
        recurrence_of: recurrence?.id ?? null,
      };
      const r = d
        .prepare(
          `INSERT INTO issues (category, severity, title, summary, lat, lng, neighborhood, status, priority,
           report_count, cover_image, recurrence_of, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, 1, ?, ?, ?, ?)`,
        )
        .run(
          ai.category,
          ai.severity,
          ai.title,
          ai.summary,
          lat,
          lng,
          neighborhood,
          computePriority(base),
          saved?.name ?? null,
          recurrence?.id ?? null,
          now,
          now,
        );
      id = Number(r.lastInsertRowid);
      addEvent(
        id,
        "created",
        `Reported in ${neighborhood}. AI classified as ${CATEGORY_META[ai.category].label} (${ai.severity}, ${Math.round(
          ai.confidence * 100,
        )}% confidence).`,
        now,
      );
      if (recurrence) addEvent(id, "recurring", `Recurring problem: issue #${recurrence.id} here was repaired before`, now);
    }

    d.prepare(
      `INSERT INTO reports (issue_id, reporter_id, reporter_name, description, image, image_hash, lat, lng,
       ai_category, ai_severity, ai_confidence, ai_summary, ai_source, duplicate_score, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      reporterId,
      reporterName,
      description,
      saved?.name ?? null,
      imageHash,
      lat,
      lng,
      ai.category,
      ai.severity,
      ai.confidence,
      ai.summary,
      ai.source,
      match?.score ?? null,
      now,
    );
    return id;
  });

  return Response.json({
    issueId,
    analysis: ai,
    duplicate: match
      ? {
          issueId: match.issue.id,
          title: match.issue.title,
          score: match.score,
          distance: match.distance,
          imageSimilarity: match.imageSimilarity,
        }
      : null,
    recurrenceOf: recurrence?.id ?? null,
    issue: getIssue(issueId)?.issue,
  });
}
