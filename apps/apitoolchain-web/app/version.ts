/**
 * Render a version with exactly one leading "v" — tolerant of values that
 * already carry it (e.g. "v1.0.1", "v1") so we never render "vv1". Empty /
 * missing → "—".
 */
export function formatVersion(version?: string | null): string {
  const v = (version ?? "").trim();
  if (!v) return "—";
  return `v${v.replace(/^v/i, "")}`;
}
