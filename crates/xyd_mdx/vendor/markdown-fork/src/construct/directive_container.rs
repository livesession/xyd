//! Container directive occurs in the [flow][] content type.
//!
//! SPIKE: parse-time construct for `remark-directive` container directives:
//! `:::name[label]{attrs}` … `:::`. Adapted from `raw_flow` (fenced code): the
//! multi-line open/content/close-fence machinery (`concrete`, the
//! non-lazy-continuation `check`, per-line content chunks) is reused verbatim,
//! with the fence marker set to `:` (min 3) and the header parsed as
//! name + optional `{attributes}` instead of info/meta.
//!
//! PoC scope: the inner content is captured RAW (one text child). Re-parsing the
//! content as nested flow (via `Content::Flow` links, as `document.rs` does for
//! block-quote/list) and true `:::`-in-`:::` nesting through the document
//! container machine is the estimated remainder — see VERDICT.md.
//!
//! [flow]: crate::construct::flow

use crate::event::Name;
use crate::state::{Name as StateName, State};
use crate::tokenizer::Tokenizer;

const SEQUENCE_MIN: usize = 3;

fn is_name_start(byte: Option<u8>) -> bool {
    matches!(byte, Some(b) if b.is_ascii_alphabetic())
}

fn is_name_char(byte: Option<u8>) -> bool {
    matches!(byte, Some(b) if b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
}

/// Start of a container directive.
///
/// ```markdown
/// > | :::note{kind="info"}
///     ^
///   | content
///   | :::
/// ```
pub fn start(tokenizer: &mut Tokenizer) -> State {
    if tokenizer.parse_state.options.constructs.mdx_expression_flow
        && tokenizer.current == Some(b':')
    {
        tokenizer.tokenize_state.size = 0;
        tokenizer.enter(Name::DirectiveContainer);
        tokenizer.enter(Name::DirectiveContainerFence);
        tokenizer.enter(Name::DirectiveContainerSequence);
        State::Retry(StateName::DirectiveContainerSequenceOpen)
    } else {
        State::Nok
    }
}

/// In opening `:::` sequence.
pub fn sequence_open(tokenizer: &mut Tokenizer) -> State {
    if tokenizer.current == Some(b':') {
        tokenizer.tokenize_state.size += 1;
        tokenizer.consume();
        State::Next(StateName::DirectiveContainerSequenceOpen)
    } else if tokenizer.tokenize_state.size < SEQUENCE_MIN {
        tokenizer.tokenize_state.size = 0;
        State::Nok
    } else {
        // Become concrete as soon as `:::` is confirmed, BEFORE the header's
        // `{attributes}` is read — otherwise the `{` triggers an
        // mdx-expression-driven split of the flow content and the trailing eol
        // ends up in a separate (unlinked) chunk, closing the container early.
        tokenizer.concrete = true;
        tokenizer.exit(Name::DirectiveContainerSequence);
        State::Retry(StateName::DirectiveContainerName)
    }
}

/// At first name byte (name is required, immediately after the colons).
pub fn name(tokenizer: &mut Tokenizer) -> State {
    if is_name_start(tokenizer.current) {
        tokenizer.enter(Name::DirectiveContainerName);
        tokenizer.consume();
        State::Next(StateName::DirectiveContainerNameInside)
    } else {
        tokenizer.tokenize_state.size = 0;
        State::Nok
    }
}

/// In name.
pub fn name_inside(tokenizer: &mut Tokenizer) -> State {
    if is_name_char(tokenizer.current) {
        tokenizer.consume();
        State::Next(StateName::DirectiveContainerNameInside)
    } else {
        tokenizer.exit(Name::DirectiveContainerName);
        State::Retry(StateName::DirectiveContainerAfterName)
    }
}

/// After name: optional `{attributes}`, then the header ends at eol/eof.
pub fn after_name(tokenizer: &mut Tokenizer) -> State {
    match tokenizer.current {
        Some(b'{') => State::Retry(StateName::DirectiveContainerAttributesStart),
        None | Some(b'\n') => State::Retry(StateName::DirectiveContainerAfterOpen),
        _ => {
            tokenizer.tokenize_state.size = 0;
            State::Nok
        }
    }
}

/// At `{` of the header attributes block.
///
/// The container header is a fence line already claimed by `:::`, so (unlike the
/// leaf) the `{` never risks reaching the MDX-expression tokenizer. We therefore
/// read the whole header remainder (from `{` up to — but NOT including — the eol)
/// as a single token that STOPS at the eol, exactly like `name_inside`. This
/// keeps the eol accessible as `current` for `after_open`. (Consuming past the
/// last header byte — e.g. the `}` — instead lands `current` on an
/// as-yet-unlinked flow chunk boundary and closes the container early; the
/// stop-at-eol shape is what the working no-attr path uses.) Attributes are
/// de-braced in `to_mdast`.
pub fn attributes_start(tokenizer: &mut Tokenizer) -> State {
    tokenizer.enter(Name::DirectiveContainerAttributes);
    tokenizer.enter(Name::DirectiveContainerAttributesContent);
    State::Retry(StateName::DirectiveContainerAttributesInside)
}

/// Inside header attributes — read until eol/eof, stopping there.
pub fn attributes_inside(tokenizer: &mut Tokenizer) -> State {
    match tokenizer.current {
        None | Some(b'\n') => {
            tokenizer.exit(Name::DirectiveContainerAttributesContent);
            tokenizer.exit(Name::DirectiveContainerAttributes);
            State::Retry(StateName::DirectiveContainerAfterOpen)
        }
        Some(_) => {
            tokenizer.consume();
            State::Next(StateName::DirectiveContainerAttributesInside)
        }
    }
}

/// Header done (at eol/eof). Close the fence, become concrete, look for a
/// closing fence or content. Mirrors `raw_flow::info_before`.
pub fn after_open(tokenizer: &mut Tokenizer) -> State {
    match tokenizer.current {
        None | Some(b'\n') => {
            tokenizer.exit(Name::DirectiveContainerFence);
            // Do not form containers inside.
            tokenizer.concrete = true;
            tokenizer.check(
                State::Next(StateName::DirectiveContainerAtNonLazyBreak),
                State::Next(StateName::DirectiveContainerAfter),
            );
            State::Retry(StateName::NonLazyContinuationStart)
        }
        _ => {
            tokenizer.tokenize_state.size = 0;
            State::Nok
        }
    }
}

/// At eol, before a possible closing fence or a content line.
/// Mirrors `raw_flow::at_non_lazy_break`.
pub fn at_non_lazy_break(tokenizer: &mut Tokenizer) -> State {
    tokenizer.attempt(
        State::Next(StateName::DirectiveContainerAfter),
        State::Next(StateName::DirectiveContainerContentBefore),
    );
    tokenizer.enter(Name::LineEnding);
    tokenizer.consume();
    tokenizer.exit(Name::LineEnding);
    State::Next(StateName::DirectiveContainerCloseStart)
}

/// At the start of a line that might be the closing fence.
pub fn close_start(tokenizer: &mut Tokenizer) -> State {
    if tokenizer.current == Some(b':') {
        tokenizer.enter(Name::DirectiveContainerFence);
        tokenizer.enter(Name::DirectiveContainerSequence);
        tokenizer.tokenize_state.size_b = 0;
        State::Retry(StateName::DirectiveContainerCloseSequence)
    } else {
        State::Nok
    }
}

/// In closing `:::` sequence.
pub fn close_sequence(tokenizer: &mut Tokenizer) -> State {
    if tokenizer.current == Some(b':') {
        tokenizer.tokenize_state.size_b += 1;
        tokenizer.consume();
        State::Next(StateName::DirectiveContainerCloseSequence)
    } else if tokenizer.tokenize_state.size_b >= tokenizer.tokenize_state.size {
        tokenizer.tokenize_state.size_b = 0;
        tokenizer.exit(Name::DirectiveContainerSequence);
        State::Retry(StateName::DirectiveContainerCloseAfter)
    } else {
        tokenizer.tokenize_state.size_b = 0;
        State::Nok
    }
}

/// After the closing sequence — must be eol/eof.
///
/// Returns `State::Ok` so the `attempt(After, ContentBefore)` set up in
/// `at_non_lazy_break` resolves to its ok-target (`After`); returning
/// `Retry(After)` would leave that attempt unresolved and corrupt the token
/// stack (mirrors `raw_flow::sequence_close_after`).
pub fn close_after(tokenizer: &mut Tokenizer) -> State {
    match tokenizer.current {
        None | Some(b'\n') => {
            tokenizer.exit(Name::DirectiveContainerFence);
            State::Ok
        }
        _ => {
            tokenizer.tokenize_state.size_b = 0;
            State::Nok
        }
    }
}

/// Not a closing fence: this line is content. Consume the eol, read the line.
/// Mirrors `raw_flow::content_before`.
pub fn content_before(tokenizer: &mut Tokenizer) -> State {
    tokenizer.enter(Name::LineEnding);
    tokenizer.consume();
    tokenizer.exit(Name::LineEnding);
    State::Next(StateName::DirectiveContainerContentInside)
}

/// At the start of a content line (or its end).
pub fn content_inside(tokenizer: &mut Tokenizer) -> State {
    match tokenizer.current {
        None | Some(b'\n') => {
            tokenizer.check(
                State::Next(StateName::DirectiveContainerAtNonLazyBreak),
                State::Next(StateName::DirectiveContainerAfter),
            );
            State::Retry(StateName::NonLazyContinuationStart)
        }
        _ => {
            tokenizer.enter(Name::DirectiveContainerContent);
            State::Retry(StateName::DirectiveContainerContentChunk)
        }
    }
}

/// In a content line.
pub fn content_chunk(tokenizer: &mut Tokenizer) -> State {
    match tokenizer.current {
        None | Some(b'\n') => {
            tokenizer.exit(Name::DirectiveContainerContent);
            State::Retry(StateName::DirectiveContainerContentInside)
        }
        _ => {
            tokenizer.consume();
            State::Next(StateName::DirectiveContainerContentChunk)
        }
    }
}

/// After the whole container.
pub fn after(tokenizer: &mut Tokenizer) -> State {
    tokenizer.exit(Name::DirectiveContainer);
    tokenizer.tokenize_state.size = 0;
    tokenizer.tokenize_state.size_b = 0;
    tokenizer.tokenize_state.marker = 0;
    tokenizer.interrupt = false;
    tokenizer.concrete = false;
    State::Ok
}
