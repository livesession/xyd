import { createHash } from "node:crypto";

/** URL/id-safe slug from a display name (bounded length). */
export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "api"
  );
}

export function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
