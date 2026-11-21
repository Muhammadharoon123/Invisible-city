import { aiProvider } from "@/lib/ai";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  return Response.json({ aiMode: aiProvider(), isAdmin: await isAdmin() });
}
