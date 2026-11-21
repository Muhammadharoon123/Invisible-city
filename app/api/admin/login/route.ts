import { login } from "@/lib/auth";

export async function POST(req: Request) {
  const { passcode } = (await req.json().catch(() => ({}))) as { passcode?: string };
  if (!passcode || !(await login(passcode))) return Response.json({ error: "Wrong passcode" }, { status: 401 });
  return Response.json({ ok: true });
}
