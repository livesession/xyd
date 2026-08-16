//! Token reshape — a verbatim port of `syntax0-highlight/src/tokenizer.ts`
//! (`tokenize` + `tokenizeLine` + `getStyle`). Turns the grammar's packed
//! `tokenizeLine2` output (a flat `[start, metadata, start, metadata, …]` per
//! line) + the theme `ColorMap` into the styled lines that are the H1 oracle
//! (`.snap` = `highlight(code, lang, theme).lines`).
//!
//! This layer is engine-agnostic: it consumes `(start, metadata)` pairs, so it
//! is written + tested independently of how the grammar produces them.

use serde::Serialize;

use crate::encode::{font_style_bits, foreground_id, FontStyle, STYLE_MASK};

/// A styled token's CSS-ish style. `None` fields are omitted (matching the
/// syntax0 object where only present keys appear).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Default)]
pub struct Style {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", rename = "fontStyle")]
    pub font_style: Option<&'static str>,
    #[serde(skip_serializing_if = "Option::is_none", rename = "fontWeight")]
    pub font_weight: Option<&'static str>,
    #[serde(skip_serializing_if = "Option::is_none", rename = "textDecoration")]
    pub text_decoration: Option<&'static str>,
}

/// One styled token in the output lines.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct StyledToken {
    pub content: String,
    pub style: Style,
}

/// `getStyle(metadata, colors)` — foreground color + font-style flags.
pub fn get_style(metadata: u32, colors: &[String]) -> Style {
    let fg = foreground_id(metadata) as usize;
    let mut style = Style {
        color: colors.get(fg).cloned(),
        ..Default::default()
    };
    let fs = font_style_bits(metadata) as i32;
    if fs & FontStyle::ITALIC != 0 {
        style.font_style = Some("italic");
    }
    if fs & FontStyle::BOLD != 0 {
        style.font_weight = Some("bold");
    }
    if fs & FontStyle::UNDERLINE != 0 {
        style.text_decoration = Some("underline");
    }
    if fs & FontStyle::STRIKETHROUGH != 0 {
        // Note: syntax0 lets strikethrough overwrite underline on textDecoration
        // (last-write-wins), reproduced here.
        style.text_decoration = Some("line-through");
    }
    style
}

struct RawToken {
    content: String,
    metadata: u32,
}

/// Port of `tokenizeLine` (default, non-preserve-whitespace path): slice the
/// line by token starts, then join empty-space tokens into the previous token
/// (or the next if there is no previous), merging adjacent tokens that share the
/// same `STYLE_MASK`.
fn tokenize_line(line: &str, tokens: &[u32]) -> Vec<RawToken> {
    // Rebuild {content, metadata} back-to-front like the TS (`unshift`).
    let mut new_tokens: Vec<RawToken> = Vec::new();
    let mut token_end = line.len();
    // tokens is [start0, meta0, start1, meta1, ...]; walk pairs from the last.
    let mut i = tokens.len().saturating_sub(2);
    loop {
        if tokens.len() < 2 {
            break;
        }
        let token_start = tokens[i] as usize;
        let metadata = tokens[i + 1];
        let content = line[token_start..token_end].to_string();
        new_tokens.push(RawToken { content, metadata });
        token_end = token_start;
        if i == 0 {
            break;
        }
        i -= 2;
    }
    new_tokens.reverse(); // we pushed back-to-front; restore source order

    let mut raw: Vec<RawToken> = Vec::new();
    for idx in 0..new_tokens.len() {
        let is_blank = new_tokens[idx].content.trim().is_empty();
        if !is_blank {
            // Merge with the previous token when the visible style matches.
            let same_style = raw.last().is_some_and(|prev| {
                (prev.metadata & STYLE_MASK) == (new_tokens[idx].metadata & STYLE_MASK)
            });
            if same_style {
                let content = std::mem::take(&mut new_tokens[idx].content);
                raw.last_mut().unwrap().content.push_str(&content);
            } else {
                raw.push(RawToken {
                    content: std::mem::take(&mut new_tokens[idx].content),
                    metadata: new_tokens[idx].metadata,
                });
            }
        } else if let Some(prev) = raw.last_mut() {
            // Blank glued onto the previous emitted token.
            let content = std::mem::take(&mut new_tokens[idx].content);
            prev.content.push_str(&content);
        } else if idx < new_tokens.len() - 1 {
            // No previous token yet: prepend the blank onto the next token.
            let blank = std::mem::take(&mut new_tokens[idx].content);
            new_tokens[idx + 1].content = blank + &new_tokens[idx + 1].content;
        } else {
            // Sole blank token on the line.
            raw.push(RawToken {
                content: std::mem::take(&mut new_tokens[idx].content),
                metadata: new_tokens[idx].metadata,
            });
        }
    }
    raw
}

/// Port of `tokenize(code, grammar, colors)` at the reshape level: given each
/// line's text + its `tokenizeLine2` packed output + the ColorMap, produce the
/// styled lines. (Line splitting `/\r?\n|\r/` and grammar tokenization happen in
/// the caller; this is the per-line → styled-token mapping.)
pub fn styled_lines(
    lines: &[&str],
    per_line_tokens: &[Vec<u32>],
    colors: &[String],
) -> Vec<Vec<StyledToken>> {
    lines
        .iter()
        .zip(per_line_tokens.iter())
        .map(|(line, tokens)| {
            tokenize_line(line, tokens)
                .into_iter()
                .map(|t| StyledToken {
                    content: t.content,
                    style: get_style(t.metadata, colors),
                })
                .collect()
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::encode::pack_metadata;

    fn meta(fg: u32) -> u32 {
        pack_metadata(FontStyle::NONE, fg, 0)
    }

    #[test]
    fn slices_and_styles_tokens() {
        // colors[1]="#AAA", colors[2]="#BBB"
        let colors = vec!["".to_string(), "#AAA".to_string(), "#BBB".to_string()];
        let line = "abcd";
        // one token [0..2] fg=1, one [2..4] fg=2
        let tokens = vec![0, meta(1), 2, meta(2)];
        let out = styled_lines(&[line], &[tokens], &colors);
        assert_eq!(out[0].len(), 2);
        assert_eq!(out[0][0].content, "ab");
        assert_eq!(out[0][0].style.color.as_deref(), Some("#AAA"));
        assert_eq!(out[0][1].content, "cd");
        assert_eq!(out[0][1].style.color.as_deref(), Some("#BBB"));
    }

    #[test]
    fn merges_same_style_adjacent_tokens() {
        let colors = vec!["".to_string(), "#AAA".to_string()];
        // two adjacent tokens with identical style → merged into one
        let tokens = vec![0, meta(1), 3, meta(1)];
        let out = styled_lines(&["foobar"], &[tokens], &colors);
        assert_eq!(out[0].len(), 1);
        assert_eq!(out[0][0].content, "foobar");
    }

    #[test]
    fn blank_glued_onto_previous() {
        // "ab" (fg1) then "  " blank (fg2) → blank joins the previous token,
        // yielding a single "ab  " token (the empty-space-join rule).
        let colors = vec!["".to_string(), "#AAA".to_string(), "#BBB".to_string()];
        let tokens = vec![0, meta(1), 2, meta(2)];
        let out = styled_lines(&["ab  "], &[tokens], &colors);
        assert_eq!(out[0].len(), 1);
        assert_eq!(out[0][0].content, "ab  ");
        assert_eq!(out[0][0].style.color.as_deref(), Some("#AAA"));
    }

    #[test]
    fn font_style_bits_to_css() {
        let colors = vec!["".to_string(), "#AAA".to_string()];
        let m = pack_metadata(FontStyle(FontStyle::ITALIC | FontStyle::BOLD), 1, 0);
        let s = get_style(m, &colors);
        assert_eq!(s.font_style, Some("italic"));
        assert_eq!(s.font_weight, Some("bold"));
    }
}
