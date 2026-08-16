//! LaTeX → MathML rendering via `pulldown-latex`.
//!
//! The single fallible entry point [`latex_to_mathml`]. It renders a `$…$` /
//! `$$…$$` LaTeX body to a MathML `<math>` string (MathML Core, browser-native
//! rendering — no KaTeX CSS/fonts, no JS engine).
//!
//! ## Honest failure
//! `pulldown-latex` never *hard-fails*: on an unknown command / unbalanced group
//! it emits a visible `<merror>` node instead of returning `Err`. That is wrong
//! for a parity gate — a page that silently renders a red error box is worse than
//! one that falls back to the JS KaTeX path. So we iterate the parser FIRST,
//! collect every event, and if ANY is a `ParserError` we return
//! [`MathError::Parse`] (the caller falls back to JS). Only fully-parsed
//! expressions render `full`. This is the "never wrong output" invariant.

use pulldown_latex::config::{DisplayMode, RenderConfig};
use pulldown_latex::{push_mathml, Parser, Storage};

/// Whether the expression is inline (`$…$`, `display="inline"`) or block
/// (`$$…$$`, `display="block"`, centered on its own line).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MathDisplay {
    Inline,
    Block,
}

impl MathDisplay {
    fn to_pulldown(self) -> DisplayMode {
        match self {
            MathDisplay::Inline => DisplayMode::Inline,
            MathDisplay::Block => DisplayMode::Block,
        }
    }
}

/// Why a LaTeX expression could not be rendered `full`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MathError {
    /// One or more `pulldown-latex` parser errors — an unsupported command,
    /// unbalanced group, etc. Carries a short human-readable summary. The MDX
    /// caller treats this as "defer this page to the JS KaTeX pipeline".
    Parse(String),
    /// The MathML writer returned an I/O error (writing into a `String` — should
    /// never happen in practice; kept for completeness).
    Render(String),
}

impl std::fmt::Display for MathError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MathError::Parse(m) => write!(f, "latex parse error: {m}"),
            MathError::Render(m) => write!(f, "mathml render error: {m}"),
        }
    }
}

impl std::error::Error for MathError {}

/// Render a LaTeX math body to a MathML `<math>…</math>` string.
///
/// The output includes the `xmlns` namespace (matches KaTeX's MathML, and helps
/// non-browser user agents) and an `<annotation encoding="application/x-tex">`
/// carrying the original LaTeX (accessibility + copy-paste, exactly like KaTeX).
///
/// Returns [`MathError::Parse`] when the expression contains anything
/// `pulldown-latex` cannot parse cleanly, so the caller can fall back to JS
/// rather than emit a wrong/`<merror>` result.
pub fn latex_to_mathml(latex: &str, display: MathDisplay) -> Result<String, MathError> {
    let storage = Storage::new();

    // 1. Parse once, eagerly, so we can detect ANY parser error before emitting.
    //    (The parser is a lazy iterator of `Result<Event, ParserError>`.)
    let events: Vec<_> = Parser::new(latex, &storage).collect();
    let mut parse_errs: Vec<String> = Vec::new();
    for ev in &events {
        if let Err(e) = ev {
            parse_errs.push(e.to_string());
        }
    }
    if !parse_errs.is_empty() {
        // Summarize (first line of the first error is the useful bit).
        let first = parse_errs
            .first()
            .map(|s| s.lines().next().unwrap_or(s).trim().to_string())
            .unwrap_or_default();
        return Err(MathError::Parse(format!(
            "{first} ({} error(s))",
            parse_errs.len()
        )));
    }

    // 2. Clean parse → render to MathML.
    let config = RenderConfig {
        display_mode: display.to_pulldown(),
        annotation: Some(latex),
        xml: true,
        ..Default::default()
    };
    let mut out = String::new();
    push_mathml(&mut out, events.into_iter(), config)
        .map_err(|e| MathError::Render(e.to_string()))?;
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn renders_simple_inline() {
        let ml = latex_to_mathml("a^2 + b^2 = c^2", MathDisplay::Inline).unwrap();
        assert!(ml.starts_with("<math"));
        assert!(ml.contains("display=\"inline\""));
        assert!(ml.contains("<msup><mi>a</mi><mn>2</mn></msup>"));
        assert!(ml.contains("application/x-tex"));
    }

    #[test]
    fn renders_block_fraction() {
        let ml = latex_to_mathml(r"\frac{1}{3}", MathDisplay::Block).unwrap();
        assert!(ml.contains("display=\"block\""));
        assert!(ml.contains("<mfrac>"));
    }

    #[test]
    fn unknown_command_is_parse_error_not_merror() {
        let err = latex_to_mathml(r"\notacommand{x}", MathDisplay::Inline).unwrap_err();
        assert!(matches!(err, MathError::Parse(_)), "got {err:?}");
    }

    #[test]
    fn unbalanced_group_is_parse_error() {
        let err = latex_to_mathml(r"\frac{1}{2", MathDisplay::Inline).unwrap_err();
        assert!(matches!(err, MathError::Parse(_)), "got {err:?}");
    }

    #[test]
    fn clean_output_has_no_merror() {
        // The whole point of the eager-parse guard: `full` output is never an
        // error box.
        let ml = latex_to_mathml(r"\sum_{i=1}^n i", MathDisplay::Block).unwrap();
        assert!(!ml.contains("<merror"), "{ml}");
    }
}
