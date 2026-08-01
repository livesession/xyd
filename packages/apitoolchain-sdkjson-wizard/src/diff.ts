/**
 * A tiny, browser-safe line differ used to show WHAT an option change did to the
 * generated SDK — many options (retry/timeout/telemetry/…) only touch deep
 * runtime files, so diffing prev→next surfaces the otherwise-invisible effect.
 */

export type LineType = "eq" | "add" | "del";
export interface DiffLine {
  type: LineType;
  text: string;
}
export interface Hunk {
  lines: DiffLine[];
}
export interface FileChange {
  path: string;
  label?: string;
  synthetic?: boolean;
  status: "added" | "removed" | "modified";
  hunks: Hunk[];
  adds: number;
  dels: number;
}
export interface DiffResult {
  changes: FileChange[];
  /** real file paths that changed (excludes synthetic entries like the usage snippet). */
  changedPaths: Set<string>;
  adds: number;
  dels: number;
}

export interface DiffEntry {
  path: string;
  code: string;
  label?: string;
  /** synthetic entries (e.g. the usage snippet) are shown but not tree-marked. */
  synthetic?: boolean;
}

/** LCS line diff. Falls back to a whole-file replace for very large inputs. */
export function diffLines(a: string[], b: string[]): DiffLine[] {
  const n = a.length;
  const m = b.length;
  if (n === 0) return b.map((text) => ({ type: "add", text }));
  if (m === 0) return a.map((text) => ({ type: "del", text }));
  if (n > 1500 || m > 1500) {
    return [
      ...a.map((text) => ({ type: "del" as const, text })),
      ...b.map((text) => ({ type: "add" as const, text })),
    ];
  }
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: "eq", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "del", text: a[i] });
      i++;
    } else {
      out.push({ type: "add", text: b[j] });
      j++;
    }
  }
  while (i < n) out.push({ type: "del", text: a[i++] });
  while (j < m) out.push({ type: "add", text: b[j++] });
  return out;
}

/** Group a diff into hunks of changed lines + `context` lines around them. */
export function toHunks(lines: DiffLine[], context = 3): Hunk[] {
  const N = lines.length;
  const keep = new Array<boolean>(N).fill(false);
  for (let i = 0; i < N; i++) {
    if (lines[i].type === "eq") continue;
    for (let d = -context; d <= context; d++) {
      const k = i + d;
      if (k >= 0 && k < N) keep[k] = true;
    }
  }
  const hunks: Hunk[] = [];
  let i = 0;
  while (i < N) {
    if (!keep[i]) {
      i++;
      continue;
    }
    let j = i;
    while (j < N && keep[j]) j++;
    hunks.push({ lines: lines.slice(i, j) });
    i = j;
  }
  return hunks;
}

const count = (lines: DiffLine[], t: LineType) =>
  lines.reduce((n, l) => n + (l.type === t ? 1 : 0), 0);

/** Diff two sets of files (prev = null → baseline, no changes). */
export function diffFiles(
  prev: DiffEntry[] | null,
  next: DiffEntry[],
): DiffResult {
  const result: DiffResult = {
    changes: [],
    changedPaths: new Set(),
    adds: 0,
    dels: 0,
  };
  if (!prev) return result;
  const prevMap = new Map(prev.map((e) => [e.path, e]));
  const nextMap = new Map(next.map((e) => [e.path, e]));

  for (const e of next) {
    const before = prevMap.get(e.path);
    if (!before) {
      const dl: DiffLine[] = e.code
        .split("\n")
        .map((text) => ({ type: "add", text }));
      result.changes.push({
        path: e.path,
        label: e.label,
        status: "added",
        hunks: toHunks(dl, 3),
        adds: dl.length,
        dels: 0,
      });
      if (!e.synthetic) result.changedPaths.add(e.path);
      result.adds += dl.length;
    } else if (before.code !== e.code) {
      const dl = diffLines(before.code.split("\n"), e.code.split("\n"));
      const adds = count(dl, "add");
      const dels = count(dl, "del");
      result.changes.push({
        path: e.path,
        label: e.label,
        status: "modified",
        hunks: toHunks(dl, 3),
        adds,
        dels,
      });
      if (!e.synthetic) result.changedPaths.add(e.path);
      result.adds += adds;
      result.dels += dels;
    }
  }
  for (const e of prev) {
    if (nextMap.has(e.path)) continue;
    const dl: DiffLine[] = e.code
      .split("\n")
      .map((text) => ({ type: "del", text }));
    result.changes.push({
      path: e.path,
      label: e.label,
      synthetic: e.synthetic,
      status: "removed",
      hunks: toHunks(dl, 3),
      adds: 0,
      dels: dl.length,
    });
    if (!e.synthetic) result.changedPaths.add(e.path);
    result.dels += dl.length;
  }

  // Synthetic (usage) first, then by path.
  result.changes.sort((a, b) => {
    if (!!a.synthetic !== !!b.synthetic) return a.synthetic ? -1 : 1;
    return a.path.localeCompare(b.path);
  });
  return result;
}
