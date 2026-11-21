import { isAdmin } from "@/lib/auth";
import { addEvent, db, getIssue } from "@/lib/db";
import { STATUSES, Status, TEAMS } from "@/lib/types";

export async function GET(_req: Request, ctx: RouteContext<"/api/issues/[id]">) {
  const { id } = await ctx.params;
  const data = getIssue(Number(id));
  if (!data) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(data);
}

/** Admin: assign a team and/or move the issue through the workflow. */
export async function PATCH(req: Request, ctx: RouteContext<"/api/issues/[id]">) {
  if (!(await isAdmin())) return Response.json({ error: "Admin login required" }, { status: 401 });
  const { id } = await ctx.params;
  const current = getIssue(Number(id));
  if (!current) return Response.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { status?: string; assigned_team?: string };
  const now = new Date().toISOString();
  const issue = current.issue;

  let team = issue.assigned_team;
  if (body.assigned_team !== undefined) {
    if (!(TEAMS as readonly string[]).includes(body.assigned_team))
      return Response.json({ error: "Unknown team" }, { status: 400 });
    team = body.assigned_team;
  }
  let status: Status = issue.status;
  if (body.status !== undefined) {
    if (!(STATUSES as readonly string[]).includes(body.status) || body.status === "resolved")
      return Response.json({ error: "Use the resolve endpoint to resolve an issue" }, { status: 400 });
    status = body.status as Status;
  }
  if (team && team !== issue.assigned_team && status === "open") status = "assigned";

  db()
    .prepare(
      "UPDATE issues SET assigned_team = ?, status = ?, updated_at = ?, resolved_at = CASE WHEN ? = 'resolved' THEN resolved_at ELSE NULL END WHERE id = ?",
    )
    .run(team, status, now, status, issue.id);

  if (team !== issue.assigned_team) addEvent(issue.id, "assigned", `Assigned to ${team}`, now);
  const autoAssigned = status === "assigned" && team !== issue.assigned_team;
  if (status !== issue.status && !autoAssigned) {
    const label: Record<Status, string> = {
      open: issue.status === "resolved" ? "Re-opened" : "Moved back to open",
      assigned: "Waiting for crew",
      in_progress: "Repair work started",
      resolved: "Resolved",
    };
    addEvent(issue.id, status, label[status], now);
  }
  return Response.json(getIssue(issue.id));
}
