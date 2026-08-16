//! The functional-equivalence metric between two MathML trees.
//!
//! Byte/DOM parity with KaTeX is *unreachable* by design — KaTeX ships a
//! hand-built HTML+CSS visual layer plus a MathML `<annotation>`; a pure-Rust
//! MathML renderer emits MathML Core only, and even the MathML differs in
//! grouping (`<mrow>` wrapping), spacing representation, the token-element split
//! (`<mi>` vs `<mo>` for the same glyph), how styled letters are encoded (a
//! `mathvariant` attribute vs a Mathematical-Alphanumeric code point), and the
//! `<semantics>`/`<annotation>` envelope. So we define a **defensible functional
//! metric** — comparing what a reader actually perceives:
//!
//! 1. **Rendered glyph stream** — the concatenation, in document order, of the
//!    normalized text of the visible token elements (`mi`/`mn`/`mo`/`mtext`/`ms`),
//!    *tag-agnostic*. Normalization strips grouping/spacing/invisible operators
//!    and the `<annotation>`, folds Mathematical-Alphanumeric styled letters back
//!    to their base letter (KaTeX carries the style in an ignored attribute), and
//!    canonicalizes visually-identical operator/delimiter code points (minus
//!    family, `|`↔`∣`, `‖`↔`∥`). This is literally *the text the reader sees*.
//!    Being tag-agnostic and concatenated, it is robust to the `<mi>`/`<mo>`
//!    disagreement and to token-granularity differences (KaTeX splits the
//!    `\pmod` operator name into per-letter `<mi>`; pulldown emits one).
//! 2. **Structure multiset** — the sorted multiset of layout schemata
//!    (`msup`/`msub`/`msubsup`, `mfrac`, `msqrt`/`mroot`, `munder`/`mover`/
//!    `munderover`, `mtable`/`mtr`/`mtd`, `mmultiscripts`) — *the layout
//!    skeleton*: fractions, scripts, roots, matrices, big-operator limits.
//!
//! Two expressions are **functionally equivalent** iff BOTH match. The metric is
//! applied by parsing each side into a [`MathNode`] and reducing it — one parser,
//! one reducer, applied symmetrically to our output and the KaTeX reference.

use crate::dom::MathNode;

/// A reduced, comparable shape of a MathML tree.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MathShape {
    /// Visible token elements in document order: `(kind, normalized_text)`.
    /// Kept for diagnostics; the equivalence decision uses [`Self::glyphs`].
    pub tokens: Vec<(String, String)>,
    /// The rendered glyph stream: concatenated normalized token text.
    pub glyphs: String,
    /// Sorted multiset of layout-schema element tags.
    pub structure: Vec<String>,
}

/// The outcome of comparing our MathML against a reference MathML.
#[derive(Debug, Clone)]
pub struct EquivReport {
    pub glyphs_match: bool,
    pub structure_match: bool,
    pub mine: MathShape,
    pub reference: MathShape,
}

impl EquivReport {
    /// Functionally equivalent iff BOTH the rendered glyph stream and the
    /// structure multiset match.
    pub fn equivalent(&self) -> bool {
        self.glyphs_match && self.structure_match
    }

    /// A short human-readable explanation of the first divergence (for test
    /// failure messages), or `None` when equivalent.
    pub fn divergence(&self) -> Option<String> {
        if !self.glyphs_match {
            return Some(format!(
                "rendered glyphs differ:\n    mine: {:?}  {:?}\n    ref : {:?}  {:?}",
                self.mine.glyphs, self.mine.tokens, self.reference.glyphs, self.reference.tokens
            ));
        }
        if !self.structure_match {
            return Some(format!(
                "structure multiset differs:\n    mine: {:?}\n    ref : {:?}",
                self.mine.structure, self.reference.structure
            ));
        }
        None
    }
}

/// Token-bearing MathML leaf elements.
const TOKEN_TAGS: &[&str] = &["mi", "mn", "mo", "mtext", "ms"];

/// MathML layout schemata that define the visible structure. Grouping/style
/// wrappers (`mrow`, `mstyle`, `mpadded`, `mphantom`, `semantics`, `math`) are
/// deliberately excluded — the two renderers wrap rows differently.
const STRUCTURE_TAGS: &[&str] = &[
    "msup",
    "msub",
    "msubsup",
    "mfrac",
    "msqrt",
    "mroot",
    "munder",
    "mover",
    "munderover",
    "mtable",
    "mtr",
    "mtd",
    "mmultiscripts",
];

/// Reduce a parsed MathML tree to its comparable [`MathShape`].
pub fn shape(root: &MathNode) -> MathShape {
    let mut tokens = Vec::new();
    let mut structure = Vec::new();
    walk(root, &mut tokens, &mut structure);
    structure.sort();
    let glyphs = tokens.iter().map(|(_, t)| t.as_str()).collect::<String>();
    MathShape {
        tokens,
        glyphs,
        structure,
    }
}

fn walk(node: &MathNode, tokens: &mut Vec<(String, String)>, structure: &mut Vec<String>) {
    let MathNode::Element { tag, children, .. } = node else {
        return;
    };
    let t = tag.as_str();

    // Drop the LaTeX-source annotation entirely (not visible math).
    if t == "annotation" {
        return;
    }

    if TOKEN_TAGS.contains(&t) {
        let text = normalize_token_text(&node.text_content());
        if !text.is_empty() {
            tokens.push((t.to_string(), text));
        }
        return; // token elements have no meaningful element children
    }

    if STRUCTURE_TAGS.contains(&t) {
        structure.push(t.to_string());
    }

    for c in children {
        walk(c, tokens, structure);
    }
}

/// Normalize the text of a token element so visually-identical renderings from
/// different engines compare equal: fold styled letters, drop invisible/spacing
/// characters, canonicalize equivalent operator/delimiter code points, and
/// collapse whitespace.
fn normalize_token_text(raw: &str) -> String {
    let mut out = String::with_capacity(raw.len());
    for ch in raw.chars() {
        // Fold Mathematical-Alphanumeric styled letters/digits (𝐀 ℝ ℒ …) to their
        // base — KaTeX keeps the base letter and styles via a `mathvariant`
        // attribute we already ignore, so this makes bold/bb/script/… compare
        // equal to their plain form.
        let ch = fold_math_alnum(ch);
        let c = match ch {
            // Invisible operators (times / function-application / separator /
            // plus) — engines insert these inconsistently; they carry no glyph.
            '\u{2061}' | '\u{2062}' | '\u{2063}' | '\u{2064}' => continue,
            // Zero-width space / joiners / KaTeX vlist filler.
            '\u{200B}' | '\u{200C}' | '\u{200D}' | '\u{FEFF}' => continue,
            // Canonicalize the many "minus/hyphen" code points to ASCII '-'.
            '\u{2212}' | '\u{2010}' | '\u{2011}' | '\u{2012}' | '\u{2013}' | '\u{2014}' => '-',
            // Prime variants → ASCII apostrophe.
            '\u{2032}' => '\'',
            // Vertical-bar delimiters: KaTeX uses U+2223 DIVIDES / U+2225
            // PARALLEL TO where pulldown uses U+007C / U+2016 — same rendered
            // bar / double bar.
            '\u{2223}' => '|',
            '\u{2225}' => '\u{2016}',
            // Various spaces → normal space (collapsed below).
            '\u{00A0}' | '\u{2009}' | '\u{2005}' | '\u{2006}' | '\u{202F}' | '\u{2007}'
            | '\u{2008}' | '\u{200A}' => ' ',
            other => other,
        };
        out.push(c);
    }
    // Collapse internal whitespace and trim.
    out.split_whitespace().collect::<Vec<_>>().join(" ")
}

/// Fold a Mathematical-Alphanumeric Symbols code point (bold/italic/script/
/// fraktur/double-struck/sans/monospace letters and styled digits, U+1D400–
/// U+1D7FF) or a letterlike-symbols alias (ℝ ℂ ℒ …) to its base ASCII letter/
/// digit. Non-styled characters pass through unchanged.
fn fold_math_alnum(c: char) -> char {
    let cp = c as u32;
    // Mathematical Alphanumeric Symbols: Latin letter styles (13 contiguous
    // 52-letter alphabets: A-Z then a-z). Reserved holes are never emitted
    // (the glyph lives in Letterlike Symbols, handled below), so a plain
    // mod-52 index is correct for every *emitted* code point in this range.
    if (0x1D400..=0x1D6A3).contains(&cp) {
        let idx = (cp - 0x1D400) % 52;
        return if idx < 26 {
            (b'A' + idx as u8) as char
        } else {
            (b'a' + (idx - 26) as u8) as char
        };
    }
    // Styled digits: 5 contiguous 10-digit runs.
    if (0x1D7CE..=0x1D7FF).contains(&cp) {
        let idx = (cp - 0x1D7CE) % 10;
        return (b'0' + idx as u8) as char;
    }
    // Letterlike-symbols aliases used for the "holes" in the block above.
    match c {
        'ℂ' | 'ℭ' => 'C',
        'ℍ' | 'ℌ' => 'H',
        'ℕ' => 'N',
        'ℙ' => 'P',
        'ℚ' => 'Q',
        'ℝ' | 'ℜ' | 'ℛ' => 'R',
        'ℤ' | 'ℨ' => 'Z',
        'ℬ' => 'B',
        'ℰ' => 'E',
        'ℯ' => 'e',
        'ℱ' => 'F',
        'ℐ' | 'ℑ' => 'I',
        'ℒ' => 'L',
        'ℳ' => 'M',
        'ℊ' => 'g',
        'ℴ' => 'o',
        'ℎ' => 'h',
        _ => c,
    }
}

/// Parse two MathML strings and compare them with the functional metric.
///
/// `mine` and `reference` are `<math>…</math>` strings. Returns an
/// [`EquivReport`]; parse failures on either side surface as an empty shape (so
/// the caller sees a mismatch rather than a panic).
pub fn compare(mine: &str, reference: &str) -> EquivReport {
    let mine_shape = crate::dom::parse_mathml(mine)
        .map(|n| shape(&n))
        .unwrap_or_else(|_| MathShape {
            tokens: vec![("<<parse-error>>".into(), mine.into())],
            glyphs: format!("<<parse-error>> {mine}"),
            structure: Vec::new(),
        });
    let ref_shape = crate::dom::parse_mathml(reference)
        .map(|n| shape(&n))
        .unwrap_or_else(|_| MathShape {
            tokens: vec![("<<parse-error>>".into(), reference.into())],
            glyphs: format!("<<parse-error>> {reference}"),
            structure: Vec::new(),
        });
    EquivReport {
        glyphs_match: mine_shape.glyphs == ref_shape.glyphs,
        structure_match: mine_shape.structure == ref_shape.structure,
        mine: mine_shape,
        reference: ref_shape,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{latex_to_mathml, MathDisplay};

    #[test]
    fn identical_mathml_is_equivalent() {
        let ml = latex_to_mathml("a^2+b^2=c^2", MathDisplay::Inline).unwrap();
        let rep = compare(&ml, &ml);
        assert!(rep.equivalent(), "{:?}", rep.divergence());
    }

    #[test]
    fn grouping_differences_are_ignored() {
        let a =
            r#"<math><semantics><mrow><msup><mi>x</mi><mn>2</mn></msup></mrow></semantics></math>"#;
        let b = r#"<math><msup><mi>x</mi><mrow><mn>2</mn></mrow></msup></math>"#;
        assert!(compare(a, b).equivalent());
    }

    #[test]
    fn mi_mo_tag_split_is_ignored() {
        // Same glyphs, different token-element choice → equivalent.
        let a = r#"<math><mi>e</mi><mi>-</mi><mi>x</mi></math>"#;
        let b = r#"<math><mi>e</mi><mo>-</mo><mi>x</mi></math>"#;
        assert!(compare(a, b).equivalent());
    }

    #[test]
    fn token_granularity_is_ignored() {
        // KaTeX splits an operator name into per-letter <mi>; pulldown emits one.
        let a = r#"<math><mi>mod</mi></math>"#;
        let b = r#"<math><mi>m</mi><mi>o</mi><mi>d</mi></math>"#;
        assert!(compare(a, b).equivalent());
    }

    #[test]
    fn styled_letters_fold_to_base() {
        let a = r#"<math><mi>𝐀</mi></math>"#; // bold A (U+1D400)
        let b = r#"<math><mi>A</mi></math>"#;
        assert!(compare(a, b).equivalent());
        let c = r#"<math><mi>ℝ</mi></math>"#; // blackboard R
        let d = r#"<math><mi>R</mi></math>"#;
        assert!(compare(c, d).equivalent());
    }

    #[test]
    fn vertical_bar_delimiters_canonicalized() {
        let a = r#"<math><mo>|</mo><mi>x</mi><mo>|</mo></math>"#;
        let b = r#"<math><mo>∣</mo><mi>x</mi><mo>∣</mo></math>"#;
        assert!(compare(a, b).equivalent());
    }

    #[test]
    fn different_symbols_are_not_equivalent() {
        let a = r#"<math><mi>a</mi></math>"#;
        let b = r#"<math><mi>b</mi></math>"#;
        assert!(!compare(a, b).equivalent());
    }

    #[test]
    fn different_structure_is_not_equivalent() {
        // Same glyphs "x2", different structure (msup vs none).
        let a = r#"<math><msup><mi>x</mi><mn>2</mn></msup></math>"#;
        let b = r#"<math><mi>x</mi><mn>2</mn></math>"#;
        let rep = compare(a, b);
        assert!(rep.glyphs_match && !rep.structure_match);
        assert!(!rep.equivalent());
    }
}
