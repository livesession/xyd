import type { BumpType } from "./types";

/**
 * Render the RELEASES.md latest-release summary block (the merge → publish
 * signal file, mirroring Speakeasy's `RELEASES.md`). One block per cycle.
 */
export function renderReleasesFile(i: {
  version: string;
  date: string;
  bump: BumpType;
  changeCount: number;
  language?: string;
  prUrl?: string;
}): string {
  const out = [
    `## v${i.version} (${i.date})`,
    "",
    `- Bump: \`${i.bump}\` (${i.changeCount} change${i.changeCount === 1 ? "" : "s"})`,
  ];
  if (i.language) out.push(`- SDK: ${i.language} v${i.version}`);
  if (i.prUrl) out.push(`- PR: ${i.prUrl}`);
  return `${out.join("\n")}\n`;
}
