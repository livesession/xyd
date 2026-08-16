//! Encoded token metadata — the packed `u32` vscode-textmate carries per token
//! and that `tokenizer.ts`/`getStyle` decodes. Bit layout (from
//! `syntax0-highlight/src/tokenizer.ts`, i.e. vscode-textmate `MetadataConsts`):
//!
//! ```text
//!   bits  0.. 7  languageId       (unused for highlighting)
//!   bits  8.. 9  tokenType        (unused for highlighting)
//!   bit  10      balancedBracket  (unused)
//!   bits 11..14  fontStyle        Italic=1 Bold=2 Underline=4 Strikethrough=8
//!   bits 15..23  foreground       ColorMap index (9 bits)
//!   bits 24..31  background       ColorMap index (8 bits)
//! ```
//! Only fontStyle + foreground are read downstream (`getStyle`), but we pack the
//! full word so state-stack metadata inheritance matches vscode exactly.
//!
//! NOTE: the decode-side helpers/constants are consumed by the tokenizer +
//! reshape (H1→H3, in progress) — allow dead_code until they land so concurrent
//! sub-ports of this crate stay clippy-clean.
#![allow(dead_code)]

pub const FONT_STYLE_MASK: u32 = 0b0000_0000_0000_0000_0111_1000_0000_0000;
pub const FOREGROUND_MASK: u32 = 0b0000_0000_1111_1111_1000_0000_0000_0000;
pub const BACKGROUND_MASK: u32 = 0b1111_1111_0000_0000_0000_0000_0000_0000;
/// fontStyle + foreground — the fields `tokenizer.ts` compares to merge tokens.
pub const STYLE_MASK: u32 = 0b0000_0000_1111_1111_1111_1000_0000_0000;

pub const FONT_STYLE_OFFSET: u32 = 11;
pub const FOREGROUND_OFFSET: u32 = 15;
pub const BACKGROUND_OFFSET: u32 = 24;

/// Font-style bitset (a bitwise-or of these). `NotSet` (-1) means "inherit from
/// the parent scope"; `None` (0) explicitly clears.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct FontStyle(pub i32);

impl FontStyle {
    pub const NOT_SET: FontStyle = FontStyle(-1);
    pub const NONE: FontStyle = FontStyle(0);
    pub const ITALIC: i32 = 1;
    pub const BOLD: i32 = 2;
    pub const UNDERLINE: i32 = 4;
    pub const STRIKETHROUGH: i32 = 8;
}

/// The resolved style for a scope stack: a font-style bitset + ColorMap indices.
/// `NOT_SET`/`0` sentinels mean "not specified by this theme rule" (the caller
/// inherits the parent value), mirroring vscode's `StyleAttributes`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct StyleAttributes {
    pub font_style: FontStyle,
    pub foreground_id: u32,
    pub background_id: u32,
}

/// Pack fontStyle/fg/bg into the metadata word (the fields highlighting uses).
/// languageId/tokenType are left 0 — they don't affect the decoded style.
pub fn pack_metadata(font_style: FontStyle, foreground_id: u32, background_id: u32) -> u32 {
    let fs = if font_style.0 < 0 {
        0
    } else {
        font_style.0 as u32
    };
    ((fs << FONT_STYLE_OFFSET) & FONT_STYLE_MASK)
        | ((foreground_id << FOREGROUND_OFFSET) & FOREGROUND_MASK)
        | ((background_id << BACKGROUND_OFFSET) & BACKGROUND_MASK)
}

/// Decode the foreground ColorMap index (`getStyle`'s `fg`).
pub fn foreground_id(metadata: u32) -> u32 {
    (metadata & FOREGROUND_MASK) >> FOREGROUND_OFFSET
}

/// Decode the font-style bitset.
pub fn font_style_bits(metadata: u32) -> u32 {
    (metadata & FONT_STYLE_MASK) >> FONT_STYLE_OFFSET
}
