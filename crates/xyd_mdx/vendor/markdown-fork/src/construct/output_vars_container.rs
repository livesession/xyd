//! Output-variables container occurs in the [flow][] content type.
//!
//! xyd: parse-time construct for xyd's bespoke output-variables fence:
//! `<<<name[{attrs}]` … `<<<`. A direct sibling of [`directive_container`] with
//! the fence marker set to `<` (min 3) instead of `:`. The header is
//! `name` + optional `{attributes}`; a `[label]` after the name is NOT accepted
//! (it lands on the `_ => Nok` arm of [`after_name`]), so labelled fences fall
//! through to the JS pipeline — the `xyd_mdx` gate never emits a wrong-`full` for
//! them.
//!
//! The inner content is captured RAW (one text child), exactly like
//! `directive_container`; `xyd_mdx`'s `output_vars` transform re-parses it (from
//! the original source via the node's byte span) and rewrites the whole fence to
//! a `<div>` wrapping the code blocks — matching the JS whole-page pipeline,
//! where the surviving `outputVars` mdast node renders through
//! `mdast-util-to-hast`'s unknown handler as a `<div>`.
//!
//! [flow]: crate::construct::flow
//! [`directive_container`]: crate::construct::directive_container

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

/// Start of an output-variables container.
///
/// ```markdown
/// > | <<<example
///     ^
///   | ```bash
///   | ...
///   | ```
///   | <<<
/// ```
pub fn start(tokenizer: &mut Tokenizer) -> State {
    // Gate on the MDX-expression flow flag (mdxjs sets it `true`), so upstream
    // plain-markdown parsing is unaffected — same piggyback as the directive
    // constructs.
    if tokenizer.parse_state.options.constructs.mdx_expression_flow
        && tokenizer.current == Some(b'<')
    {
        tokenizer.tokenize_state.size = 0;
        tokenizer.enter(Name::OutputVarsContainer);
        tokenizer.enter(Name::OutputVarsContainerFence);
        tokenizer.enter(Name::OutputVarsContainerSequence);
        State::Retry(StateName::OutputVarsContainerSequenceOpen)
    } else {
        State::Nok
    }
}

/// In opening `<<<` sequence.
pub fn sequence_open(tokenizer: &mut Tokenizer) -> State {
    if tokenizer.current == Some(b'<') {
        tokenizer.tokenize_state.size += 1;
        tokenizer.consume();
        State::Next(StateName::OutputVarsContainerSequenceOpen)
    } else if tokenizer.tokenize_state.size < SEQUENCE_MIN {
        tokenizer.tokenize_state.size = 0;
        State::Nok
    } else {
        // Become concrete as soon as `<<<` is confirmed, BEFORE the header's
        // `{attributes}` is read (mirrors `directive_container`).
        tokenizer.concrete = true;
        tokenizer.exit(Name::OutputVarsContainerSequence);
        State::Retry(StateName::OutputVarsContainerName)
    }
}

/// At first name byte (name is required, immediately after the `<<<`).
pub fn name(tokenizer: &mut Tokenizer) -> State {
    if is_name_start(tokenizer.current) {
        tokenizer.enter(Name::OutputVarsContainerName);
        tokenizer.consume();
        State::Next(StateName::OutputVarsContainerNameInside)
    } else {
        tokenizer.tokenize_state.size = 0;
        State::Nok
    }
}

/// In name.
pub fn name_inside(tokenizer: &mut Tokenizer) -> State {
    if is_name_char(tokenizer.current) {
        tokenizer.consume();
        State::Next(StateName::OutputVarsContainerNameInside)
    } else {
        tokenizer.exit(Name::OutputVarsContainerName);
        State::Retry(StateName::OutputVarsContainerAfterName)
    }
}

/// After name: optional `{attributes}`, then the header ends at eol/eof. Anything
/// else (notably a `[label]`) is not a clean output-vars header — Nok so it falls
/// through to the JS pipeline.
pub fn after_name(tokenizer: &mut Tokenizer) -> State {
    match tokenizer.current {
        Some(b'{') => State::Retry(StateName::OutputVarsContainerAttributesStart),
        None | Some(b'\n') => State::Retry(StateName::OutputVarsContainerAfterOpen),
        _ => {
            tokenizer.tokenize_state.size = 0;
            State::Nok
        }
    }
}

/// At `{` of the header attributes block. Read the whole header remainder up to —
/// but NOT including — the eol as a single token (mirrors `directive_container`;
/// attributes are dropped by the `xyd_mdx` transform since the rendered `<div>`
/// carries none).
pub fn attributes_start(tokenizer: &mut Tokenizer) -> State {
    tokenizer.enter(Name::OutputVarsContainerAttributes);
    tokenizer.enter(Name::OutputVarsContainerAttributesContent);
    State::Retry(StateName::OutputVarsContainerAttributesInside)
}

/// Inside header attributes — read until eol/eof, stopping there.
pub fn attributes_inside(tokenizer: &mut Tokenizer) -> State {
    match tokenizer.current {
        None | Some(b'\n') => {
            tokenizer.exit(Name::OutputVarsContainerAttributesContent);
            tokenizer.exit(Name::OutputVarsContainerAttributes);
            State::Retry(StateName::OutputVarsContainerAfterOpen)
        }
        Some(_) => {
            tokenizer.consume();
            State::Next(StateName::OutputVarsContainerAttributesInside)
        }
    }
}

/// Header done (at eol/eof). Close the fence, become concrete, look for a closing
/// fence or content. Mirrors `directive_container::after_open`.
pub fn after_open(tokenizer: &mut Tokenizer) -> State {
    match tokenizer.current {
        None | Some(b'\n') => {
            tokenizer.exit(Name::OutputVarsContainerFence);
            tokenizer.concrete = true;
            tokenizer.check(
                State::Next(StateName::OutputVarsContainerAtNonLazyBreak),
                State::Next(StateName::OutputVarsContainerAfter),
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
pub fn at_non_lazy_break(tokenizer: &mut Tokenizer) -> State {
    tokenizer.attempt(
        State::Next(StateName::OutputVarsContainerAfter),
        State::Next(StateName::OutputVarsContainerContentBefore),
    );
    tokenizer.enter(Name::LineEnding);
    tokenizer.consume();
    tokenizer.exit(Name::LineEnding);
    State::Next(StateName::OutputVarsContainerCloseStart)
}

/// At the start of a line that might be the closing fence.
pub fn close_start(tokenizer: &mut Tokenizer) -> State {
    if tokenizer.current == Some(b'<') {
        tokenizer.enter(Name::OutputVarsContainerFence);
        tokenizer.enter(Name::OutputVarsContainerSequence);
        tokenizer.tokenize_state.size_b = 0;
        State::Retry(StateName::OutputVarsContainerCloseSequence)
    } else {
        State::Nok
    }
}

/// In closing `<<<` sequence.
pub fn close_sequence(tokenizer: &mut Tokenizer) -> State {
    if tokenizer.current == Some(b'<') {
        tokenizer.tokenize_state.size_b += 1;
        tokenizer.consume();
        State::Next(StateName::OutputVarsContainerCloseSequence)
    } else if tokenizer.tokenize_state.size_b >= tokenizer.tokenize_state.size {
        tokenizer.tokenize_state.size_b = 0;
        tokenizer.exit(Name::OutputVarsContainerSequence);
        State::Retry(StateName::OutputVarsContainerCloseAfter)
    } else {
        tokenizer.tokenize_state.size_b = 0;
        State::Nok
    }
}

/// After the closing sequence — must be eol/eof.
pub fn close_after(tokenizer: &mut Tokenizer) -> State {
    match tokenizer.current {
        None | Some(b'\n') => {
            tokenizer.exit(Name::OutputVarsContainerFence);
            State::Ok
        }
        _ => {
            tokenizer.tokenize_state.size_b = 0;
            State::Nok
        }
    }
}

/// Not a closing fence: this line is content. Consume the eol, read the line.
pub fn content_before(tokenizer: &mut Tokenizer) -> State {
    tokenizer.enter(Name::LineEnding);
    tokenizer.consume();
    tokenizer.exit(Name::LineEnding);
    State::Next(StateName::OutputVarsContainerContentInside)
}

/// At the start of a content line (or its end).
pub fn content_inside(tokenizer: &mut Tokenizer) -> State {
    match tokenizer.current {
        None | Some(b'\n') => {
            tokenizer.check(
                State::Next(StateName::OutputVarsContainerAtNonLazyBreak),
                State::Next(StateName::OutputVarsContainerAfter),
            );
            State::Retry(StateName::NonLazyContinuationStart)
        }
        _ => {
            tokenizer.enter(Name::OutputVarsContainerContent);
            State::Retry(StateName::OutputVarsContainerContentChunk)
        }
    }
}

/// In a content line.
pub fn content_chunk(tokenizer: &mut Tokenizer) -> State {
    match tokenizer.current {
        None | Some(b'\n') => {
            tokenizer.exit(Name::OutputVarsContainerContent);
            State::Retry(StateName::OutputVarsContainerContentInside)
        }
        _ => {
            tokenizer.consume();
            State::Next(StateName::OutputVarsContainerContentChunk)
        }
    }
}

/// After the whole container.
pub fn after(tokenizer: &mut Tokenizer) -> State {
    tokenizer.exit(Name::OutputVarsContainer);
    tokenizer.tokenize_state.size = 0;
    tokenizer.tokenize_state.size_b = 0;
    tokenizer.tokenize_state.marker = 0;
    tokenizer.interrupt = false;
    tokenizer.concrete = false;
    State::Ok
}
