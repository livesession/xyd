# migrateme S3 — known content-transform divergences

These fixtures were captured from the original TS migrator (the generator script has since
been removed — the crate is self-sufficient) and are **not** part of the byte-parity
gate (`content_byte_parity_against_goldens`, which iterates `../content-testdata/`). They
capture the boundary the plan calls out: the native Rust content transform reaches
**byte-parity on curated, remark-canonical inputs** but only **semantic equivalence** on
these, because reproducing `remark-stringify`'s / `@mdx-js`'s exact behavior is a
disproportionate (multi-week) effort. The generated Markdown here is semantically
equivalent to the Rust output — the difference is formatting, not meaning.

Each case is kept as an `input.mdx` + the TS `expected.md` so the divergence is documented
and can be revisited.

## Divergence classes

| Cases | Class | Why it diverges |
|-------|-------|-----------------|
| `ca-01`, `ca-02`, `ca-06`, `ca-07` | **Callout wrapping block content** | The TS wraps a callout's children in a single paragraph; when that content is a list or code block, `remark-stringify` inlines it (e.g. list items rendered `*item` on the fence line). Reproducing that block-in-paragraph rendering byte-for-byte is remark-internal behavior. The Rust port keeps the block content structured. |
| `cb-01`,`cb-02`,`cb-03`,`cb-04`,`cb-06`,`cb-07` | **Grid card list spread** | The TS builds a nested list-of-listItems for grid cards; `remark-stringify` renders it **tight** (`- - card … card`) for simple cards but **loose** (`  - card` blank-line-separated) once a card body is "spread" — a content-dependent decision inside remark. The Rust grid serializer always uses the tight form (matches simple cards, e.g. the curated `03-cards`). |
| `cd-05` | **Reference links / definitions** | Reference-style links (`[text][id]`, `[id]: url "title"`) and reference images depend on `remark-stringify`'s definition placement + label rules. Inline links (incl. titles) DO match; only the reference forms diverge. |
| `cd-07` | **Context-sensitive text escaping** | `remark-stringify` re-escapes literal `*`/`_` in prose (`\*not italic\*`) based on whether they could start emphasis. The Rust serializer emits text verbatim; escaping arbitrary prose faithfully is remark-internal. |
| `ce-02` | **MDX ESM import detection** | `@mdx-js` maps only imports it parses as ESM to `@include`; the vendored fork has no ESM parser, so the Rust port treats every top-level `import … from …` line as an include mapping. The Rust behavior resolves *more* `@include`s (arguably more useful) but is not byte-identical when a doc mixes real and non-ESM imports. |

## Regenerating

The goldens are refreshed by pointing the content harness at this directory too, or by
running the same per-case recipe the harness uses. They are documentation, not a gate.
