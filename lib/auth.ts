import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE = "ic_admin";
const passcode = () => process.env.ADMIN_PASSCODE || "admin123";
const token = () => crypto.createHash("sha256").update("ic:" + passcode()).digest("hex");

export async function isAdmin() {
  const c = await cookies();
  return c.get(COOKIE)?.value === token();
}

export async function login(code: string) {
  const ok =
    code.length === passcode().length &&
    crypto.timingSafeEqual(Buffer.from(code), Buffer.from(passcode()));
  if (!ok) return false;
  (await cookies()).set(COOKIE, token(), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  return true;
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}
