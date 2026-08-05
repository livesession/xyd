# Content-Engine Tails — Rust-Native Port Research

> **Scope.** xyd's content engine now compiles most pages in Rust (`crates/xyd_mdx`)
> via a per-page **capability gate**: a page compiles in Rust (`full`) only when it
> uses no construct still owned by the JS plugin chain; otherwise it returns a
> `fallback` sentinel and the JS `ContentFS` pipeline runs unchanged
> (`crates/xyd_mdx/src/lib.rs:86-102`). This report examines the four remaining
> "content-engine tails" that still fall back to JS: what each does, where the JS
> lives, why it isn't Rust-native yet, and what a Rust-native port would require.
>
> **Method note.** Every claim is grounded in the repo at `path:line`. Web access
> was unavailable during this research, so the KaTeX-crate landscape in Item 4 is
> characterized from general knowledge of those crates' architecture (stable,
> well-known facts) rather than freshly re-verified release metadata — flagged
> inline.

## Summary

| # | Item | Category | Effort | Risk | Recommendation |
|---|------|----------|--------|------|----------------|
| 1 | props→JSX serializer (`<Atlas .../>` with resolved refs) | **portable serializer, but gated by an irreducible-for-now upstream** (`oas-to-snippet` endpoint examples + arbitrary React description trees) | L | High | **Keep JS.** The serializer is provably reproducible, but the value is zero until `@readme/oas-to-snippet` is ported — a separate track. Revisit only after that. |
| 2 | `<<<` outputVars fence | **portable-with-a-fork-extension** (new micromark-style construct in the vendored fork) | M | Low–Med | **Keep JS** (low value — only feeds atlas-with-source, already `fallback`). No hardening needed: the "gate hole" was empirically disproven — mdxjs fails `<<<` closed to `fallback`. |
| 3 | `mdTable` / `:::table` directive | **portable** (pure sync mdast rewrite; the only un-ported directive) | S | Low–Med | **Port it (small)** once a parity fixture exists — closes the directive set to 8/8. Parity risk is only "no golden yet," not a hard blocker. |
| 4 | math / KaTeX (`remark-math` + `rehype-katex`) | **irreducible-JS for byte-parity**; portable-with-a-dep only by *changing the renderer* (MathML) and re-baselining | L | Very High | **Keep JS.** Byte/DOM parity with `rehype-katex` requires KaTeX itself. Pure-Rust math crates emit structurally different DOM. |

**Bottom line:** three of the four tails should stay JS permanently; only `mdTable`
(Item 3) is a clean, cheap, low-risk Rust win, and even it has limited real-world
value because it co-occurs with the JS-only atlas/outputVars path. (An earlier draft
flagged a "latent wrong-`full` hole" for `<<<`; it was **empirically disproven** — the
mdxjs parser fails `<<<` closed to `fallback`, so no hardening is needed. See Item 2.)
The single highest-leverage future port remains `oas-to-snippet`→Rust (unblocks Item 1).

---

## How the gate decides `full` vs `fallback` (context)

`compile_mdx` runs a cheap **source pre-scan** (`capability::scan`,
`crates/xyd_mdx/src/capability.rs:212-229`) then the **full pipeline**
(`pipeline::compile_full`, `crates/xyd_mdx/src/pipeline.rs:50-107`). Pre-scan forces
`fallback` for: composer/atlas frontmatter with a source or `componentProps`
(`capability.rs:89-125`), the `@uniform`/`@importCode` functions
(`capability.rs:200-207`), math (`capability.rs:152-178`), and mermaid/graphviz
fences (`capability.rs:181-192`). Post-parse, the pipeline additionally falls back
on any surviving raw MDX node (`pipeline.rs:62-64`), an un-ported directive
(`directives::process` → `Err`, `pipeline.rs:77`), or an un-ported
`@include`/`@changelog` target (`functions::process` → `Err`, `pipeline.rs:83`).

The design invariant is **honest coverage**: the gate emits `full` only when the
Rust output provably equals the JS output; anything uncertain falls back. All four
tails below are gated correctly today (no *known* wrong-`full`), with one latent
exception flagged in Item 2.

---

## Item 1 — props→JSX serializer (the `componentLike` round-trip)

### What it is
The composer's mechanism for turning a resolved meta-component's props into a page
node. `mdMeta` calls a `@metaComponent` transform to compute `resolvedComponentProps`,
then hands them to `componentLike(componentName, props, [])`, and splices the result
into the tree (`packages/xyd-content/packages/md/plugins/meta/mdMeta.ts:159-182`).
`componentLike` does a full React round-trip:
`React.createElement(name, props)` → `react-element-to-jsx-string` → `fromMarkdown`
with the `mdxJsx` micromark extension, yielding an `MdxJsxFlowElement` mdast node
(`packages/xyd-content/packages/md/plugins/utils/componentLike.ts:12-48`). The mdx
codegen tail then lowers `<Atlas references={…}/>` to `$jsx(Atlas, {references: …})`.

The hard part is not the round-trip shape but *what the props contain* for the
`atlas`-with-source case (`Composer.ts:127-326`, `atlasMetaComponent`):
- **`references`** — the resolved Uniform `Reference[]` (from converters).
- **`description` as a compiled React tree** — manual page prose (`treeChilds`) and
  the reference's own markdown description are converted markdown→HTML→JSX→React and
  merged into a `React.createElement(React.Fragment, …)` (`Composer.ts:207-285`), via
  `jsxStringToReactTree`/`buildElement` (`Composer.ts:329-456`).
- **`definitions[].properties[].description`** recursively turned into React trees
  (`processDefinitionProperties`/`processDefinitionProperty`, `Composer.ts:463-529`),
  gated by a `marked.lexer`-based "is this markdown?" check (`Composer.ts:534-548`).
- **highlighted `examples`** — either from the `<<<` outputVars (Item 2), or (fallback)
  highlighted on the spot from the reference's own `examples` via the async
  `highlight()` (`Composer.ts:287-317`).
- **function values** carried through props (e.g. a `__UNSAFE_selector`) that survive
  as live JS references in the built-time React element.

### Where
- `packages/xyd-content/packages/md/plugins/utils/componentLike.ts` (the serializer).
- `packages/xyd-composer/src/Composer.ts:127-326` (atlas transform),
  `:329-456` (`buildElement`/`jsxStringToReactTree`), `:463-529`
  (`processDefinitionProperties`).
- `packages/xyd-content/packages/md/plugins/meta/mdMeta.ts:159-182` (call site).
- Rust side: `crates/xyd_mdx/src/meta_component.rs` handles only the SOURCE-FREE,
  PROP-FREE cases (`atlas` no source → `<Atlas references={[]}/>`, `home`/`bloghome`/
  `firstslide`; `meta_component.rs:84-99`). The gate routes anything with a source or
  `componentProps` to `fallback` before it ever reaches here
  (`capability.rs:104-124`, `meta_component.rs:62-71`).

### Why not Rust yet
The serializer *round-trip itself* is proven and portable — the docs in
`meta_component.rs:30-47` are explicit that the blocker is **not** the serializer but
an intentionally **JS-only upstream**:

1. **Endpoint code `examples` come from `@readme/oas-to-snippet`.** The Rust OpenAPI
   converter deliberately emits no endpoint examples —
   `crates/xyd_openapi/src/paths.rs:109` returns `examples: Default::default()`, and
   `crates/xyd_openapi/src/fused.rs:47` documents "endpoint examples are a JS post-pass
   the page flow never needs." So a source-backed atlas page cannot be reproduced in
   Rust until `oas-to-snippet` (multi-language curl/fetch/python/go snippet generation,
   then highlighting) is itself ported — a separate, large track.
2. **`description` is an arbitrary compiled React tree.** Serializing a
   `$jsxs($Fragment, …)` expression (with nested elements from `htmlToJsx` +
   `buildElement`) to a byte-identical JS expression means re-implementing the exact
   markdown→HTML→JSX conversion chain (`mdast-util-to-hast` + `hast-util-to-html` +
   `html-to-jsx-transform` + Babel JSX walking) in Rust with byte parity.
3. **Function-valued props** (`__UNSAFE_selector` etc.) are live JS closures; there is
   no data representation to serialize — they only exist because the whole thing runs
   in a JS runtime.

This is therefore **category (a) partly, (c) partly**: the serialization envelope is
portable, but the *payload* is gated by a JS-only library (`oas-to-snippet`) and by
byte-exact re-implementation of several JS AST libraries. Per
`.ai/plans/xyd-rust.progress.md:621-628`, emitting incomplete references just to force
`full` would be dishonest coverage the gate forbids — hence the honest `fallback`.

### Rust-native path
- **Approach:** (1) Port `@readme/oas-to-snippet` (or an equivalent request-snippet
  generator) to Rust so `xyd_openapi` can emit endpoint `examples`; the highlighter is
  already Rust (`xyd_highlight`, reachable inline as in `directives.rs:600-615`).
  (2) Port the markdown→React-tree description composition — re-implement the
  `mdast→hast→html→jsx` chain to emit the same `$jsxs($Fragment, …)` expression the
  mdx codegen tail produces. (3) Emit `references`/props as a JS expression literal
  (a Rust codegen that serializes the Uniform `Reference[]` — already Rust data — plus
  the composed description sub-expression).
- **Dependencies:** a Rust snippet generator (no drop-in equivalent to
  `oas-to-snippet`); byte-exact ports of `hast-util-to-html` + `html-to-jsx-transform`
  behavior; the existing `xyd_uniform`/`xyd_openapi`/`xyd_highlight` crates.
- **Effort:** **L** (the `oas-to-snippet` port alone is a multi-week track; the
  description-tree codegen is another substantial slice).
- **Risk:** **High** — three independent byte-parity surfaces (snippet text, HTML→JSX
  conversion, React-element codegen), each of which can drift from the JS oracle in
  ways the gate would (correctly) reject.

### Recommendation
**Keep JS.** The serializer is not the bottleneck; `oas-to-snippet` is. This tail
becomes worth revisiting only *after* a Rust endpoint-snippet generator exists, at
which point the props codegen is the natural follow-on. Until then, atlas-with-source
pages should stay `fallback` — which is exactly what the gate does.

---

## Item 2 — the `<<<` outputVars fence

### What it is
A bespoke block construct, `<<<name[label]{attrs}` … `<<<`, that captures a labelled
group of code blocks (and `:::code-group` blocks) as an **output variable** used to
supply an atlas page's `examples`. Example (`__fixtures__/1.simple/input.md`):

```
<<<example
  ```bash npm
  npm i -g xyd-js
  ```
  ```bash pnpm
  pnpm add -g xyd-js
  ```
<<<
```

It is a real micromark construct (a fenced container, min fence length 3), not a
directive. `remarkOutputVars` registers a micromark tokenizer + from/to-markdown
extensions (`output-variables/remarkOutputVars.ts:4-21`); the tokenizer is
`outputVarsContainer` (`output-variables/lib/outputVarsContainer.ts:31-262`). The
primary fence character is **`<`** — `PRIMARY_SYMBOL = codes.lessThan`
(`output-variables/lib/const.ts`); note the sibling `PRIMARY_SYMBOL_STR = '>'` used by
the *serialize-back* path (`util.ts:467-493`) is a latent inconsistency, but the
**parse** path (what pages exercise) uses `<`, confirmed by every fixture and real page.

Downstream, `mdComposer` visits `outputVars` nodes, highlights their code (and
`:::code-group` children), and writes the collected groups to
`file.data.outputVars` (`composer/mdComposer.ts:33-145`). `mdMeta` then passes
`file.data.outputVars` into the atlas transform as `vars.examples`
(`meta/mdMeta.ts:163`; consumed at `Composer.ts:139-205`). So the construct is
**meaningful only as input to the atlas meta-component**.

### Where
- Parser: `packages/xyd-content/packages/md/plugins/output-variables/` —
  `remarkOutputVars.ts`, `lib/outputVarsContainer.ts`, `lib/util.ts`,
  `lib/{const,factoryAttributes,factoryLabel,factoryName}.ts`.
- Consumers: `composer/mdComposer.ts:33-145`, `meta/mdMeta.ts:163`,
  `Composer.ts:139-205`.
- Plugin order: registered as `outputVars` before `mdComponentDirective`/`mdComposer`
  (`packages/xyd-content/packages/md/plugins/index.ts:60`, `:75`).
- Fixtures: `output-variables/__fixtures__/{1.simple,2.multiple-vars}/` (input.md +
  output.json), test `output-variables/__tests__/index.test.ts`.
- Real pages: `apps/docs/components/{tables,steps,tabs,callouts,details,grid,
  guide-card}.md` all use `<<<examples` (each also carries `uniform: "@components/…"`
  frontmatter).
- Rust side: **no handling** — the capability gate does not scan for `<<<`
  (`capability.rs` has no outputVars branch, grep-confirmed), and the vendored fork has
  **no outputVars construct** (`crates/xyd_mdx/vendor/markdown-fork/src/construct/`
  has `directive_leaf.rs`/`directive_container.rs` only).

### Why not Rust yet
**Category (b), portable-but-not-done — but currently low-value.** Two reasons:
1. **It only matters for atlas-with-source pages, which already `fallback`.** Every
   real `<<<examples` page also sets `uniform:`/`component: atlas`, so
   `frontmatter_forces_fallback` (`capability.rs:108-109`, source key) routes it to JS
   *before* the fence ever matters. Porting the fence yields zero coverage gain unless
   Item 1 lands first.
2. **`markdown-rs` constructs are a fixed enum with no extension API** — the same
   reason directives required forking. A native `<<<` port means hand-writing a new
   micromark-style container construct inside the vendored fork, parallel to
   `directive_container.rs`. (`.ai/plans/xyd-rust.progress.md:255-262` documents this
   exact constraint: "the bespoke `outputVars` `<`-fence construct … [is] not reachable
   via `opts.constructs.*` flags.")

### ✅ "Latent gate hole" — EMPIRICALLY DISPROVEN (no action needed)
> **Correction (verified 2026-08-06 by running the real `compile_mdx`).** The concern
> below — that a standalone `<<<` page would compile `full` and be silently miscompiled —
> does **not** hold. `crates/xyd_mdx` compiles in MDX mode, where `<` starts a JSX tag; the
> mdxjs parser rejects the second `<` with `Unexpected character '<' (U+003C) before name`,
> so `compile_full` returns `Err` → **`fallback`**. Test: the real `output-variables/
> __fixtures__/1.simple/input.md` through the `dump` example returns
> `CAPABILITY=fallback reason=Some("mdast: 4:2: Unexpected character `<` …")`. Because `<<`
> is *never* a valid JSX-tag start, **any** `<<<` construct fails closed to `fallback`. The
> parser already enforces the "never wrong-`full`" invariant here — **no defensive scan is
> needed** (adding one would be dead code). The original reasoning assumed plain-markdown
> literal-text parsing, but xyd_mdx never parses in plain-markdown mode.

~~Because the gate does not scan for `<<<`, a page that used `<<<…<<<` without a
fallback-forcing frontmatter key would compile `full` and be silently miscompiled…~~
(superseded by the correction above — the parser fails closed).

### Rust-native path
- ~~To close the latent hole: add a `has_output_vars` scan~~ — **unnecessary** (see the
  correction above; the mdxjs parser already fails `<<<` closed to `fallback`).
- **To actually port the construct (not recommended now):** add an `output_vars`
  container construct to the fork (tokenizer for `<<<name[label]{attrs}` open + `<<<`
  close, min length 3, capturing content as sub-parsed flow), produce an mdast node,
  then port `mdComposer`'s collection + highlighting into a Rust transform that
  populates the equivalent of `file.data.outputVars`. **Effort M, Risk Low–Med** (the
  tokenizer is mechanical; the risk is byte-parity of the collected+highlighted
  `examples` blob, which is dropped by Oracle B anyway).

### Recommendation
**Keep the feature in JS** (no coverage value without Item 1). **No hardening action
needed** — the mdxjs parser already fails `<<<` closed to `fallback` (see the ✅
correction above), so the gate can never emit a wrong-`full` for an outputVars page.

---

## Item 3 — `mdTable` / `:::table` directive

### What it is
A container directive whose single raw child is a JSON 2-D array; it rewrites into the
theme `Table`/`Table.Head`/`Table.Tr`/`Table.Th`/`Table.Td` component tree, with each
cell's string re-parsed as markdown. JS handler `mdTable`
(`component-directives/mdComponentDirective.ts:349-395`):
`JSON.parse(node.children[0].value)` → `[header, ...rows]` → build the JSX tree, each
cell via `parseMarkdown` (`= unified().use(remarkParse).use(remarkMdx).parse`,
`mdComponentDirective.ts:83-90`). `table: true` is in `supportedDirectives`
(`mdComponentDirective.ts:22-52`). Real usage: `apps/docs/components/tables.md` (a
`:::table` with a JSON body, nested inside a `<<<examples` block).

### Where
- JS: `packages/xyd-content/packages/md/plugins/component-directives/mdComponentDirective.ts:349-395`
  (`mdTable`), dispatched at `:156-159`; `parseMarkdown` at `:83-90`.
- Rust: `crates/xyd_mdx/src/directives.rs:309` returns
  `Err("directive special-handler \`table\`")` → `fallback`. The deferral rationale is
  documented at `directives.rs:33-40` ("no `directive-table` fixture exists to pin
  parity, so it stays a fallback rather than shipping unverified"). Test:
  `crates/xyd_mdx/src/lib.rs:150-158`.

### Why not Rust yet
**Category (b), portable-but-not-done.** The generic directive machinery, the
`steps`/`tabs`/`code-group` special handlers, and `:::`-in-`:::` nesting are already
ported and byte-parity-verified (`.ai/plans/xyd-rust.progress.md:567-574`, 7/7
directive fixtures). `table` was left out for one reason only: **there is no committed
parity fixture** to prove byte-equality, and the project's invariant is "no unverified
`full`." The handler itself is pure, synchronous mdast rewriting with no async, no I/O,
and no JS-only dependency — squarely portable. The only subtlety is that each cell runs
through a **separate `remark-parse`+`remark-mdx` sub-parse** (`parseMarkdown`), which
in Rust means calling `mdast_util_from_mdx` per cell (the module already does exactly
this pattern for directive content re-parsing, `directives.rs:235-241`).

### Rust-native path
- **Approach:** in `directives.rs`, replace the `"table"` `Err` arm with a
  `build_table(...)` mirroring the go-`steps`/`nav` handlers: `serde_json` the raw
  content into `Vec<Vec<String>>`, split header/rows, and emit the `Table`/`.Head`/
  `.Tr`/`.Th`/`.Td` `MdxJsxFlowElement` tree, re-parsing each cell via
  `reparse_content` (`directives.rs:235-241`). Add a `directive-table` fixture and pin
  it in `DIRECTIVE_FULL_FLOOR`.
- **Dependencies:** none new — `serde_json` and `mdxjs::mdast_util_from_mdx` are
  already in the crate.
- **Effort:** **S** (a few hours; the code pattern is copy-shaped from `build_nav`/
  `build_steps`, `directives.rs:432-478`).
- **Risk:** **Low–Med.** The only real risk is per-cell sub-parse byte-parity vs JS
  `remark-parse`+`remark-mdx` (e.g. inline-code, links inside cells). This must be
  proven with a fixture before shipping `full`, per the invariant.

### Recommendation
**Port it (small), gated on adding a `directive-table` fixture first.** It closes the
directive family to 8/8 for a few hours' work and removes the last structural-directive
fallback. Caveat on value: because `:::table` in practice appears inside `<<<examples`
on atlas-with-source pages (which fall back anyway), the immediate coverage gain is
small — but it is cheap, low-risk, and completes the directive surface cleanly, so it is
the one tail worth actually porting.

---

## Item 4 — math / KaTeX (`remark-math` + `rehype-katex`)

### What it is
Inline (`$…$`) and block (`$$…$$`) LaTeX math. `remark-math` parses it to math nodes;
`rehype-katex` renders each to KaTeX's output — a `.katex` container holding **both** an
MathML `<annotation>` tree **and** a hand-built HTML+CSS visual rendering (spans with
precise `style` offsets), the exact structure KaTeX ships.

### Where
- JS: `packages/xyd-content/packages/md/plugins/index.ts:6-7` (imports), `:45`
  (`remarkMath` in the remark chain), `:175` (`rehypeKatex` in the rehype chain).
- Rust: the gate forces `fallback` on any math via `has_math`
  (`crates/xyd_mdx/src/capability.rs:152-178` → `Fallback::Math`), documented at
  `pipeline.rs:29-31` and `capability.rs:6-7` ("math (needs rehype-katex) … Anything
  matched here returns `fallback`"). `.ai/plans/xyd-rust.progress.md:632` names
  `prose-math` as one of two "irreducible-JS core by design" fallbacks.

### Why not Rust yet
**Category (a), genuinely irreducible for byte/DOM parity.** `rehype-katex`'s output is
*defined by KaTeX*. Reproducing it byte- or DOM-equivalently means running KaTeX. The
Rust crate landscape (characterized from architecture knowledge; release metadata not
freshly verified due to no web access):

- **`katex` (Rust crate):** not a re-implementation — it **embeds the KaTeX JavaScript
  library and executes it through a JS engine backend** (quick-js/duktape, or a
  wasm/js backend). Its output *is* KaTeX's output (identical), but it is not
  "Rust-native math": it reintroduces a JS runtime and a C dependency, defeating the
  no-JS-runtime goal. Functionally equivalent to just calling `rehype-katex`.
- **`pulldown-latex`:** pure-Rust LaTeX→**MathML** renderer. Emits MathML markup (relying
  on the browser's native MathML engine + provided CSS). Its DOM is *fundamentally
  different* from KaTeX's `.katex` HTML+MathML structure — not a parity match.
- **`latex2mathml`:** pure-Rust LaTeX→MathML string. Same story — MathML only, different
  DOM from KaTeX.
- **`mathml-core`:** a MathML data model, not a LaTeX renderer at all.

So there is **no pure-Rust path to KaTeX-equivalent output.** The only "Rust-native"
option is to *change the math renderer* to a MathML-based one (`pulldown-latex`) and
**re-baseline the parity oracle** — i.e. accept different HTML, different visual
rendering, and a dependence on browser MathML support. That is a product/design change,
not a byte-parity port.

### Rust-native path
- **Option A (parity-preserving, not really Rust-native):** vendor the `katex` crate
  (KaTeX-in-a-JS-engine). Gets identical output but reintroduces a JS runtime + native
  backend. **Effort M, Risk Med** (build/platform complexity), **but defeats the point.**
- **Option B (truly Rust-native, parity-breaking):** adopt `pulldown-latex`/MathML,
  re-baseline the `prose-math` oracle, ship different DOM + a MathML CSS, and accept the
  browser-MathML dependency. **Effort L, Risk Very High** (visual regressions across all
  math pages; every math oracle must be re-captured; no longer byte-comparable to the
  JS engine, so the whole "independently re-rendered + diffed" gate methodology no longer
  applies to math).

### Recommendation
**Keep JS.** This is the textbook irreducible-JS tail. Byte/DOM parity with
`rehype-katex` is achievable only by running KaTeX (Option A, which reintroduces the JS
runtime the migration is trying to shed) or by abandoning parity (Option B). Neither is
worthwhile; `has_math → fallback` is the correct, honest behavior and should remain
permanent. If a future xyd version *chooses* MathML as its math format, revisit
`pulldown-latex` — but that is a rendering-strategy decision, not a port.

---

## Cross-cutting notes & suggested sequencing

1. **The four tails are not independent.** Items 1, 2, 3 all converge on the
   atlas/composer path: `<<<examples` (2) feeds `vars.examples`, `:::table` (3) commonly
   lives inside it, and both are consumed by the props serializer (1). Because
   atlas-with-source already falls back at the frontmatter scan, porting 2 or 3 in
   isolation yields little coverage until 1's `oas-to-snippet` blocker is resolved.
2. **Only two actions are worth taking now:**
   - **(S, Low risk) Add a defensive `<<<` scan** to `capability::scan` (Item 2) to
     eliminate the one latent wrong-`full` hole. This is a correctness hardening, not a
     feature port.
   - **(S, Low–Med risk) Port `mdTable`** (Item 3) *after* adding a `directive-table`
     parity fixture — completes the directive surface for a few hours' work.
3. **Two tails should stay JS permanently:** the props serializer's payload (Item 1,
   gated by `oas-to-snippet`) and math (Item 4, gated by KaTeX). Both are consistent
   with the project's own stated "irreducible-JS core by design"
   (`.ai/plans/xyd-rust.progress.md:630-636`).
4. **If a large future investment is ever justified,** the highest-leverage single port
   is **`@readme/oas-to-snippet` → Rust**, because it unblocks Item 1 (source-backed
   atlas pages — the single largest remaining `fallback` category) and is a
   self-contained, testable unit with its own JS oracle.
