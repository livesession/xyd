import { writeHtml } from "./htmlOut";

/**
 * Prerender orchestration for the Bun static build. Stage 2 (this file) extracts
 * the content-page loop out of buildStatic behind a stable `{ ok, missing }`
 * contract so it can be satisfied by either the in-process serial loop below OR
 * (Stage 3) a worker pool — with byte-identical output. The serial path here is
 * lifted verbatim from buildStatic's original loop, so extracting it is a no-op
 * on the emitted site.
 */

export interface PrerenderCtx {
  /** `.xyd/build/client` — the publish dir. */
  clientDir: string;
  /** Content-page slugs (Object.keys(__xydPagePathMapping)). */
  slugs: string[];
  /** Page → access level ("public" | "authenticated" | groups). */
  accessMap: Record<string, string>;
}

export interface PrerenderResult {
  ok: number;
  /** Per-page failures ("<slug>: <message>") — buildStatic fails loud on any. */
  missing: string[];
}

/** Render one content page to `<slug>.html`. Pure fn of the slug + the read-only
 *  render globals; a protected page (no deploy adapter) renders an empty shell. */
async function renderOne(ctx: PrerenderCtx, slug: string): Promise<boolean> {
  const acc = ctx.accessMap["/" + slug] || ctx.accessMap[slug];
  const shellOnly = !!acc && acc !== "public"; // static host = no deploy adapter → always shell
  const html = await (globalThis as any).__xydRenderStatic(slug, { shellOnly });
  writeHtml(ctx.clientDir, slug, html);
  return true;
}

/** In-process serial prerender — the default path and the fallback whenever the
 *  worker pool is disabled or unavailable. Byte-identical to buildStatic's loop. */
export async function prerenderPagesSerial(ctx: PrerenderCtx): Promise<PrerenderResult> {
  let ok = 0;
  const missing: string[] = [];
  for (const slug of ctx.slugs) {
    try {
      await renderOne(ctx, slug);
      ok++;
    } catch (e: any) {
      missing.push(`${slug}: ${e?.message || e}`);
    }
  }
  return { ok, missing };
}

/** Entry point buildStatic calls. For now always serial; Stage 3 adds the worker
 *  pool here (gated on XYD_BUILD_CONCURRENCY) with this serial path as fallback. */
export async function prerenderPages(ctx: PrerenderCtx): Promise<PrerenderResult> {
  return prerenderPagesSerial(ctx);
}
