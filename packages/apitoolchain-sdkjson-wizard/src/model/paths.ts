/** Read a dot-path (`behavior.retry.maxRetries`) out of a nested object. */
export function getPath(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const seg of path.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

/**
 * Immutably set a dot-path, cloning each object along the way. An `undefined`
 * value DELETES the leaf key (so cleared fields drop out of the emitted
 * sdk.json and fall back to the emitter/behavior defaults).
 */
export function setPath<T extends object>(
  obj: T,
  path: string,
  value: unknown,
): T {
  const segs = path.split(".");
  const root: Record<string, unknown> = { ...(obj as Record<string, unknown>) };
  let cur = root;
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i];
    const next = cur[seg];
    cur[seg] = next && typeof next === "object" ? { ...(next as object) } : {};
    cur = cur[seg] as Record<string, unknown>;
  }
  const leaf = segs[segs.length - 1];
  if (value === undefined || value === "") delete cur[leaf];
  else cur[leaf] = value;
  return root as T;
}
