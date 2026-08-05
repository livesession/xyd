//! Leaf directive occurs in the [flow][] content type.
//!
//! SPIKE: parse-time construct for `remark-directive` leaf directives:
//! `::name[label]{attrs}` on its own line. Modeled on `heading_atx`.
//!
//! Gating: piggybacks on `constructs.mdx_expression_flow` so the UNMODIFIED
//! `mdxjs-rs` (which sets that flag `true`) enables it via `[patch.crates-io]`
//! without needing to touch mdxjs's exhaustive `Constructs { .. }` literal.
//! Production would add a dedicated `constructs.directive` field (+ 3-line
//! mdxjs patch).
//!
//! [flow]: crate::construct::flow

use crate::event::Name;
use crate::state::{Name as StateName, State};
use crate::tokenizer::Tokenizer;

fn is_name_start(byte: Option<u8>) -> bool {
    matches!(byte, Some(b) if b.is_ascii_alphabetic())
}

fn is_name_char(byte: Option<u8>) -> bool {
    matches!(byte, Some(b) if b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
}

/// Start of a leaf directive.
///
/// ```markdown
/// > | ::name{attr="x"}
///     ^
/// ```
pub fn start(tokenizer: &mut Tokenizer) -> State {
    if tokenizer.parse_state.options.constructs.mdx_expression_flow {
        tokenizer.tokenize_state.size = 0;
        tokenizer.enter(Name::DirectiveLeaf);
        tokenizer.enter(Name::DirectiveLeafSequence);
        State::Retry(StateName::DirectiveLeafSequenceOpen)
    } else {
        State::Nok
    }
}

/// In opening `::` sequence.
pub fn sequence_open(tokenizer: &mut Tokenizer) -> State {
    if tokenizer.current == Some(b':') {
        if tokenizer.tokenize_state.size < 2 {
            tokenizer.tokenize_state.size += 1;
            tokenizer.consume();
            State::Next(StateName::DirectiveLeafSequenceOpen)
        } else {
            // A third colon: this is container territory, not a leaf.
            tokenizer.tokenize_state.size = 0;
            State::Nok
        }
    } else if tokenizer.tokenize_state.size == 2 {
        tokenizer.tokenize_state.size = 0;
        tokenizer.exit(Name::DirectiveLeafSequence);
        State::Retry(StateName::DirectiveLeafName)
    } else {
        tokenizer.tokenize_state.size = 0;
        State::Nok
    }
}

/// At first name byte.
pub fn name(tokenizer: &mut Tokenizer) -> State {
    if is_name_start(tokenizer.current) {
        tokenizer.enter(Name::DirectiveLeafName);
        tokenizer.consume();
        State::Next(StateName::DirectiveLeafNameInside)
    } else {
        State::Nok
    }
}

/// In name.
pub fn name_inside(tokenizer: &mut Tokenizer) -> State {
    if is_name_char(tokenizer.current) {
        tokenizer.consume();
        State::Next(StateName::DirectiveLeafNameInside)
    } else {
        tokenizer.exit(Name::DirectiveLeafName);
        State::Retry(StateName::DirectiveLeafAfterName)
    }
}

/// After name: optional `{attributes}`, then eol/eof.
pub fn after_name(tokenizer: &mut Tokenizer) -> State {
    match tokenizer.current {
        Some(b'{') => State::Retry(StateName::DirectiveLeafAttributesStart),
        None | Some(b'\n') => {
            tokenizer.exit(Name::DirectiveLeaf);
            State::Ok
        }
        // Trailing junk after the name (no attributes) => not a clean leaf.
        _ => State::Nok,
    }
}

/// At `{` of the attributes block.
///
/// Claims the whole `{ .. }` — including nested braces inside quoted values —
/// so the MDX-expression tokenizer never sees the `{` (the make-or-break).
pub fn attributes_start(tokenizer: &mut Tokenizer) -> State {
    tokenizer.enter(Name::DirectiveLeafAttributes);
    tokenizer.enter(Name::DirectiveLeafAttributesMarker);
    tokenizer.consume(); // `{`
    tokenizer.exit(Name::DirectiveLeafAttributesMarker);
    tokenizer.tokenize_state.marker = 0; // active quote char (0 = none)
    tokenizer.enter(Name::DirectiveLeafAttributesContent);
    State::Next(StateName::DirectiveLeafAttributesInside)
}

/// Inside the attributes block, tracking quote state.
pub fn attributes_inside(tokenizer: &mut Tokenizer) -> State {
    match tokenizer.current {
        // Attributes must terminate on the same line.
        None | Some(b'\n') => {
            tokenizer.tokenize_state.marker = 0;
            State::Nok
        }
        Some(b'}') if tokenizer.tokenize_state.marker == 0 => {
            tokenizer.exit(Name::DirectiveLeafAttributesContent);
            tokenizer.enter(Name::DirectiveLeafAttributesMarker);
            tokenizer.consume(); // `}`
            tokenizer.exit(Name::DirectiveLeafAttributesMarker);
            tokenizer.exit(Name::DirectiveLeafAttributes);
            State::Retry(StateName::DirectiveLeafAfterAttributes)
        }
        Some(byte @ (b'"' | b'\'')) => {
            if tokenizer.tokenize_state.marker == 0 {
                tokenizer.tokenize_state.marker = byte;
            } else if tokenizer.tokenize_state.marker == byte {
                tokenizer.tokenize_state.marker = 0;
            }
            tokenizer.consume();
            State::Next(StateName::DirectiveLeafAttributesInside)
        }
        Some(_) => {
            tokenizer.consume();
            State::Next(StateName::DirectiveLeafAttributesInside)
        }
    }
}

/// After the `}`: expect eol/eof.
pub fn after_attributes(tokenizer: &mut Tokenizer) -> State {
    match tokenizer.current {
        None | Some(b'\n') => {
            tokenizer.exit(Name::DirectiveLeaf);
            State::Ok
        }
        _ => {
            tokenizer.tokenize_state.marker = 0;
            State::Nok
        }
    }
}
