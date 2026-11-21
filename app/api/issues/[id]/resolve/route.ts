import { isAdmin } from "@/lib/auth";
import { addEvent, db, getIssue } from "@/lib/db";
import { saveImage } from "@/lib/uploads";

/** Admin: mark resolved with an after-repair photo (Before vs After proof). */
export async function POST(req: Request, ctx: RouteContext<"/api/issues/[id]/resolve">) {
  if (!(await isAdmin())) return Response.json({ error: "Admin login required" }, { status: 401 });
  const { id } = await ctx.params;
  const current = getIssue(Number(id));
  if (!current) return Response.json({ error: "Not found" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ error: "Expected multipart form data" }, { status: 400 });
  const note = String(form.get("note") ?? "").slice(0, 1000) || "Repair completed.";
  const image = form.get("afterImage");

  let afterName: string | null = current.issue.after_image;
  if (image instanceof File && image.size > 0) {
    try {
      afterName = (await saveImage(image)).name;
    } catch (e) {
      return Response.json({ error: (e as Error).message }, { status: 400 });
    }
  }
  const now = new Date().toISOString();
  db()
    .prepare(
      "UPDATE issues SET status = 'resolved', after_image = ?, resolution_note = ?, resolved_at = ?, updated_at = ?, assigned_team = COALESCE(assigned_team, 'General Maintenance') WHERE id = ?",
    )
    .run(afterName, note, now, now, current.issue.id);
  addEvent(current.issue.id, "resolved", `Resolved: ${note}${afterName ? " (after-repair photo uploaded)" : ""}`, now);
  return Response.json(getIssue(current.issue.id));
}
