//! `xyd_math` — Rust-native LaTeX math rendering.
//!
//! The Rust-first replacement for xyd's `remark-math` + `rehype-katex` JS step.
//! It renders inline (`$…$`) and block (`$$…$$`) LaTeX to **MathML Core** via the
//! pure-Rust [`pulldown-latex`] crate — no embedded JS engine, no KaTeX CSS/fonts,
//! browser-native rendering, and a small footprint suited to the `bun --compile`
//! binary.
//!
//! # Why MathML (not KaTeX-parity)
//!
//! `rehype-katex`'s output is *defined by KaTeX* — a hand-built HTML+CSS visual
//! tree plus a MathML `<annotation>`. Reproducing it byte/DOM-equivalently means
//! running KaTeX (the `katex` Rust crate embeds KaTeX-in-a-JS-engine, which
//! reintroduces the very JS runtime the migration is shedding and bloats the
//! binary). The only *truly Rust-native* path is to render **MathML** and let the
//! browser lay it out. Every modern browser ships MathML Core (Chrome 109+,
//! Firefox, Safari 16.4+), so this is a lighter, dependency-free result — at the
//! cost of a *different* DOM from KaTeX. Hence the gate here is **functional
//! equivalence** ([`equiv`]), not byte-parity: we verify our MathML renders the
//! same symbols and the same layout skeleton as real KaTeX across a broad corpus.
//!
//! # Public surface
//!
//! - [`latex_to_mathml`] — LaTeX body → `<math>…</math>` string (honest
//!   [`MathError::Parse`] on anything the renderer can't handle, so callers fall
//!   back to JS rather than emit a wrong result).
//! - [`parse_mathml`] / [`MathNode`] — parse MathML into a generic tree (`xyd_mdx`
//!   maps this onto `mdxjs::hast`; this crate stays mdxjs-free).
//! - [`equiv`] — the token/structure functional-equivalence metric.
//!
//! [`pulldown-latex`]: https://crates.io/crates/pulldown-latex

mod dom;
pub mod equiv;
mod render;

pub use dom::{parse_mathml, MathNode, MathParseError};
pub use render::{latex_to_mathml, MathDisplay, MathError};
