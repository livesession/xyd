import { groupChanges } from "./group";
import type { ReleaseChange } from "./types";

function section(title: string, changes: ReleaseChange[]): string[] {
  if (changes.length === 0) return [];
  const lines = [`### ${title}`, ""];
  for (const c of changes) lines.push(`- ${c.detail} (\`${c.path}\`)`);
  lines.push("");
  return lines;
}

/**
 * Render one CHANGELOG.md entry for a release cycle. Deterministic and
 * timestamp-free apart from the injected `date`, so a re-run with the same
 * inputs produces a byte-identical entry.
 */
export function renderChangelogEntry(i: {
  version: string;
  date: string;
  changes: readonly ReleaseChange[];
}): string {
  const g = groupChanges(i.changes);
  const out = [`## ${i.version} (${i.date})`, ""];
  if (i.changes.length === 0) {
    out.push("_No API changes._", "");
  } else {
    out.push(
      ...section("⚠ BREAKING CHANGES", g.breaking),
      ...section("Features", g.additive),
      ...section("Changes", g.other),
    );
  }
  return `${out.join("\n").trimEnd()}\n`;
}

/** A previously-rendered changelog entry (newest-first ordering expected). */
export interface ChangelogHistoryEntry {
  version: string;
  date: string;
  /** Pre-rendered markdown from `renderChangelogEntry` (stored per release). */
  body: string;
}

/** Stitch the full CHANGELOG.md from stored per-release entries (newest first). */
export function renderChangelogFromHistory(
  entries: readonly ChangelogHistoryEntry[],
): string {
  const blocks = entries.map((e) => e.body.trimEnd());
  return `# Changelog\n\n${blocks.join("\n\n")}\n`;
}
