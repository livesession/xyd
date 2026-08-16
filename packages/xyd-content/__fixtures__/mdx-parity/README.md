# MDX-parity — the JS-owned compliance harness for the Rust content engine (Track C)

This corpus is the **oracle** that gates every Track C stage: a Rust MDX compiler
(`crates/xyd_mdx`, not built yet) must reproduce **today's** JS pipeline output.
It is the content-engine analogue of the highlighter's JS-owned goldens — the
committed files are the source of truth; the generator only regenerates them
from the live pipeline.

Everything here is produced from the **current JS pipeline only**
(`@xyd-js/content`): there is no dependency on any Rust crate.

## The two-oracle design

For every fixture we capture **two** independent views of what the pipeline does,
so a future compiler can be diffed against both:

### Oracle A — compiled function-body (`compiled.normalized.js`)

`ContentFS.compileContent(source)` (the real `outputFormat:'function-body',
jsx:false` path, driven through `markdownPlugins(...)` exactly as the page loader
does) emits a JS function-body string. We store it **AST-normalized** so the diff
is semantic, not cosmetic:

1. Parse to ESTree with `acorn` (`allowReturnOutsideFunction` — MDX emits a
   top-level `return`).
2. **alpha-rename** the churny compiler temporaries to a canonical `$`-scheme
   (see the identifier map below). Component references (`Callout`, `MDXContent`,
   `MDXLayout`, `props`, `toc`, `frontmatter`) and all string literals (text
   nodes, the server-highlight JSON) are left untouched.
3. Re-serialize with `estree-util-to-js` (`toJs`) — the **same** generator
   `@mdx-js/mdx` uses — producing canonical, comment-free, formatting-stable JS.

`normalize()` is **idempotent** and a **fixed point** on the committed goldens:
`normalize(read("compiled.normalized.js")) === read("compiled.normalized.js")`.
The reference implementation is `_harness/normalize.mjs`.

The identifier map (`CANONICAL_IDENTIFIERS` in `_harness/normalize.mjs`) — the
only compiler temporaries `@mdx-js/mdx` emits across the whole `apps/docs`
corpus, plus a `$t<N>` fallback for hypothetical numeric-suffix temps:

| MDX temp | canonical |
|---|---|
| `_Fragment` | `$Fragment` |
| `_jsx` / `_jsxs` / `_jsxDEV` | `$jsx` / `$jsxs` / `$jsxDEV` |
| `_components` | `$components` |
| `_createMdxContent` | `$createMdxContent` |
| `_missingMdxReference` | `$missingMdxReference` |
| `_provideComponents` | `$provideComponents` |
| any other `_`-prefixed local | `$t0`, `$t1`, … (first-seen order) |

### Oracle B — rendered HTML (`rendered.html`)

The compiled module is **executed** (`new Function`, mirroring the real loader in
`packages/xyd-plugin-docs/src/pages/page.tsx`) against a **frozen component-stub
set** + a fixed jsx runtime, then `renderToStaticMarkup` → **DOM-normalized**
(attribute-order-insensitive) HTML. This proves *rendered* equivalence even when
the compiled JS differs cosmetically. Reference implementation:
`_harness/render.mjs`.

The stub set is deliberately **identity-ish**:

- HTML-tag components (`h1`, `p`, `ul`, `a`, `table`, …) stay as their identity
  strings → real HTML elements.
- `pre`/`code` are stubbed to a clean `<pre><code class="language-…">` form,
  dropping the heavy server-highlight blob (Oracle A already pins that verbatim;
  Oracle B asserts code **structure** only).
- Every xyd/file component a page needs (`Callout`, `Tabs`, `Steps`, `Atlas`,
  `DirectiveCodeGroup`, … including dotted members like `Steps.Item`) becomes a
  children-preserving `<xyd-stub data-stub="Name">` wrapper. The exact set is
  **discovered per page** from the compiled `_missingMdxReference("Name", …)`
  guards — nothing hard-coded.
- Short scalar props (`kind`, `title`, `description`, …) are serialized to sorted
  `data-prop-*` attributes so prop-carrying components render non-degenerate HTML;
  JSON-blob props (server-highlight `codeblocks`, values > 200 chars) are dropped.

> **Porting to Rust:** Oracle B stays a **JS** step even for `crates/xyd_mdx`.
> The Rust MDX compiler emits a JS function-body; the parity test runs *that*
> through this same `_harness/render.mjs` (via node) and diffs the normalized
> HTML. `_harness/` has **no** live-pipeline dependency (only `react` /
> `react-dom` + the estree tools), so the Rust test reuses it verbatim.

## Capability tags & the staging gate

Each fixture's `meta.json` carries a `capability` tag (authored in `corpus.json`).
The tag maps to the Track C stage that must satisfy it, and to the gate rule:

| capability | Track C stage | gate | meaning |
|---|---|---|---|
| `prose` | C-S1 | `full` | plain md/mdx, gfm tables, frontmatter, headings, images, code fences, math — no directives, no `@`-functions, no `component:` frontmatter, no user plugins. Rust output **must match Oracle A + Oracle B**. |
| `directive` | C-S2 | `full` | `:::callout`, `:::tabs`, `:::code-group`, `:::steps`, `:::details`, `:::subtitle`, `:::badge`, nesting. Rust output **must match A + B**. |
| `async` | C-S3 / C-S4 | `fallback` | `@include` / `@changelog` / `uniform:` / `component: atlas`. **Exempt** — tracked as coverage until the corresponding stage lands. A `fallback`/unsupported Rust result is acceptable here; a `full` result must still match A + B. |

**The gate a `crates/xyd_mdx` test implements** (per fixture, reading `meta.json`):

```
raw       = xyd_mdx.compile(input.mdx, settings.json)   // Rust output
gate      = meta.capability -> corpus.gate[...]          // full | fallback
if gate == "full":
    assert normalize(raw)            == read("compiled.normalized.js")   // Oracle A
    assert normalizeHtml(render(raw)) == read("rendered.html")          // Oracle B (JS render step)
else: // fallback
    if xyd_mdx reports "supported": run the same asserts
    else: count as tracked-uncovered coverage, do not fail
```

## Directory layout

```
__fixtures__/mdx-parity/
├── README.md              # this file
├── corpus.json           # source of truth: cases + capability tags + gate + provenance
├── _harness/             # reusable oracle contract (NO live-pipeline dep)
│   ├── normalize.mjs     #   Oracle A: normalize()  (acorn → alpha-rename → toJs)
│   └── render.mjs        #   Oracle B: buildStubs/execMDX/renderOracle/normalizeHtml
└── <case>/
    ├── input.mdx              # INPUT  (authored / curated)
    ├── settings.json          # INPUT  (auto-provisioned default if absent)
    ├── <sidecars>             # INPUT  (async cases: partial.md, changelog.md, api.yaml)
    ├── compiled.normalized.js # GOLDEN — Oracle A
    ├── rendered.html          # GOLDEN — Oracle B
    └── meta.json              # GENERATED summary (capability, gate, statuses, hashes)
```

## Regenerating (the gen script)

`packages/xyd-content/scripts/gen-mdx-goldens.mjs` regenerates both oracles for
every fixture from the **live** JS pipeline. Requires the workspace built
(`dist/`) so `@xyd-js/content` resolves; run from the package root.

```bash
cd packages/xyd-content

# verify (default): regenerate in-memory, diff vs committed goldens, exit 1 on drift.
# doubles as the idempotency / parity check.
node scripts/gen-mdx-goldens.mjs

# write: (re)generate goldens to disk.
MDX_BUILD_FIXTURES=1 node scripts/gen-mdx-goldens.mjs

# restrict to a subset
MDX_BUILD_FIXTURES=1 node scripts/gen-mdx-goldens.mjs --filter directive
```

**Idempotency:** write once, then run verify (or write again) → zero drift; the
oracle output is deterministic (raw compile is byte-identical run-to-run; the
highlight theme is pinned to `github-dark` via `settings.theme.coder.syntaxHighlight`).

## Oracle-generation setup (what it takes to drive the pipeline headlessly)

This setup is itself a C-S1 deliverable — it documents exactly what the compile /
render path needs outside the app:

- **Built workspace.** `@xyd-js/content` (+ `@xyd-js/native`, react/react-dom)
  must be resolvable from `packages/xyd-content` — i.e. `pnpm build` has run.
- **Minimal settings suffice.** An empty-ish settings object works; we pin only
  `theme.coder.syntaxHighlight: "github-dark"` for deterministic highlighting.
- **Native highlighter is ON** (`@xyd-js/native`). Consequence: **every code
  fence must declare a language.** A no-language fence (```` ``` ````) crashes
  the native path with *"Failed to convert JavaScript value `Undefined` into rust
  type `String`"* (the JS `codehike` fallback under `XYD_NATIVE=0` tolerates it,
  but then goldens diverge from the native path the app actually ships). The
  corpus avoids no-lang fences.
- **`console.time*` chatter** — the plugins log timings; the gen script silences
  them.

### Documented headless gaps (why `async` is `fallback`)

- `@include` and `@changelog` **do** resolve — relative to `input.mdx` — so their
  goldens show the pulled-in content.
- `uniform:` / `component: atlas` **degrade** headlessly: the composer
  meta-component registry (`new Composer()` in the `plugin-docs` layout loader)
  is not active outside the app, so the OpenAPI/atlas reference is not composed.
  The compile still succeeds deterministically; we capture that current behavior
  and tag it `async` (exempt). Fully driving these would require standing up the
  composer registry + `globalThis.__xydSettings` + spec resolution — out of scope
  for the oracle, and precisely the C-S3/S4 target surface.
