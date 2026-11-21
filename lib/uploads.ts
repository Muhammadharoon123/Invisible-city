import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { UPLOAD_DIR, db } from "./db";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export async function saveImage(file: File) {
  const ext = EXT[file.type];
  if (!ext) throw new Error("Only JPEG, PNG, WebP or GIF images are supported");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Image is larger than 8 MB");
  db(); // ensures the upload dir exists
  const buf = Buffer.from(await file.arrayBuffer());
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
  return { name, buf, mediaType: file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif" };
}

