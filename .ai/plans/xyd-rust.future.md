# xyd-rust — Future / Postponed Work

Ideas evaluated or scoped but deliberately NOT done yet, with the evidence and
the exact conditions under which they become worth revisiting. This is the
"someday, not now" bucket for the Rust migration (see `xyd-rust.progress.md`
for what IS done, `xyd-rust-package.md` for the wave plan).

---

## 1. Rewrite the content MD plugins + codehike into Rust (POSTPONED)

**Status:** Evaluated in S6+ W5 → **NO-GO for now** (evidence-backed). Content
(`@xyd-js/content` + the MDX/remark/rehype/recma pipeline + codehike) stays JS.

**Why postponed — the blockers, in priority order:**

1. **markdown-rs cannot parse xyd content today.** Empirically (the `markdown`
   crate v1.0.0, probed over all 84 apps/docs files): `<Foo/>` →
   `mdxJsxFlowElement` ✓, but `:::callout` → plain paragraph text, `$math$` →
   text, GFM tables → text; **0/84 files produced a directive node**.
   - Directives are a **parse-time micromark construct** — you cannot run
     remark-directive on an already-parsed Rust mdast (the `:::` is text by
     then), so directives MUST be tokenized in the initial Rust parse.
   - `markdown-rs` constructs are a **fixed enum with no public extension API**.
     gfm/math/frontmatter are reachable via `opts.constructs.*` flags; the
     directive family and the bespoke `outputVars` `<`-fence construct are NOT.
   - → Parity requires **forking markdown-rs** to hand-write two tokenizers:
     the directive family (`:::` container / `::` leaf / `:name` text) and the
     `outputVars` `<`-fence (a micromark-extension-directive fork living in
     `packages/xyd-content/packages/md/plugins/output-variables/lib/`). Both are
     load-bearing: `mdComponentDirective`, `mdComposer`, and the whole
     component-directive + output-variable machinery consume nodes only these
     produce.

2. **It wouldn't pay even with perfect fidelity.** markdown-rs parse is fast
   (0.267ms/file vs JS mdast parse 3.3ms/file — ~12×), but:
   - That ~3ms is measured against the ~3.9ms **base** @mdx compile. The REAL
     xyd per-page compile is dominated by the 14 custom remark transforms +
     rehype(katex/raw, conditional mermaid/graphviz) + **async codehike
     highlighting** + the composer (React trees) + mdMeta — all JS. Parse is a
     small fraction of that true denominator.
   - The mdast→JSON→`JSON.parse` **marshal per page** eats most of the ~3ms.
   - Only **4 of 12** live custom remark transforms are cleanly portable
     (mdHeadingId, remarkInjectCodeMeta, mdImage, remarkMdxToc). Porting those
     CHEAP transforms is a **net loss** (marshal > compute saved). The other 7
     (the four `@`-function plugins, mdComponentDirective, mdComposer, mdMeta)
     are async + coupled to `@xyd-js/{sources,uniform,composer,context}` +
     codehike, so they stay JS regardless.
   - `mdMeta` (terminal transform) reads `file.data.outputVars` (VFile data, NOT
     the tree) and REPLACES the whole tree via the composer — a tree-only Rust
     boundary can't carry it.

3. **codehike itself is a separate, larger beast.** It's the syntax highlighter
   (`@code-hike/lighter`). A Rust rewrite would need to byte-match its
   highlighted-token JSON output — infeasible to match exactly with
   syntect/tree-sitter. codehike is **position-agnostic** though (`highlight()`
   takes only `{value, lang, meta}` strings; no mdast positions), so IF it were
   ever ported it wouldn't need position fidelity — but that's not the hard part.

**Non-issue we can stop worrying about:** position fidelity. NO custom transform
reads `node.position` (grep-confirmed across all 18). It only matters for the JS
mdx-compile tail's source maps.

**Revisit ONLY when at least one of these changes:**
- A Rust MDX parser gains a **public construct-extension API** (so directive +
  outputVars can be added without forking), OR someone lands+maintains a
  markdown-rs fork with those two constructs.
- MDX/directives leave the per-page hot path (e.g. content is pre-compiled to a
  cheaper IR), making a Rust parse a meaningful fraction of compile time.
- A profiling checkpoint shows the JS parse (not codehike/composer) is the
  actual bottleneck on a real large corpus.

**If revisited, the minimal viable slice** (do NOT boil the ocean):
- Fork markdown-rs; add the directive + outputVars constructs; enable
  gfm+math+frontmatter via `constructs`.
- Replace ONLY the parse: `createProcessor()` + `processor.parser = () =>
  JSON.parse(rustMdastJson)`, keep every existing JS remark/rehype/recma
  transform + the composer/mdMeta tail unchanged.
- Gate on the merge criterion: **per-page compile time must IMPROVE on the
  apps/docs corpus** net of marshal, AND a byte-diff of rendered output must be
  identical. If either fails, stop.
- Reference measurements to beat (this machine, apps/docs 84 files): JS mdast
  parse 3.3ms/file, markdown-rs parse 0.267ms/file, base @mdx compile
  3.9ms/file (parse = ~85% of BASE, but a small fraction of the REAL compile).

**Map artifacts** (for whoever picks this up): the W5 pipeline map lives in this
session's workflow journal; the decisive facts are the full 18-transform
inventory + third-party-vs-custom split + the markdown-rs construct gaps, all
summarized in the W5 section of `xyd-rust.progress.md`.

---

## 2. Deferred follow-ups from earlier waves (smaller, not blockers)

- **W3 tail:** gql/mcp fusion (same fused-endpoint pattern as OpenAPI, small);
  fix the `composeFileMap` second-build bug (compose stayed JS — now orthogonal
  to fusion); the per-page Reference cache keyed `"<source>#<region>"` to kill
  `uniformProcessor`'s per-page spec re-parse (the real wall-clock lever, but
  builds are render-dominated so measure first).
- **W4:** consolidate the llms.txt `gray-matter` pass — note it needs a
  **js-yaml/1.1** parser, SEPARATE from the eemeli/1.2 frontmatter batch, so it
  can't share `crates/xyd_frontmatter`'s parser; feed frontmatter batch metadata
  into `buildAccessMap` to un-break frontmatter access rules (`public`/
  `accessGroups` are a pre-existing no-op — this is a **behavior change**, needs
  product sign-off before flipping).
