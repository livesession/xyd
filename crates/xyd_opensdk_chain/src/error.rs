//! Error surface.
//!
//! The TS throws plain `Error`s whose *messages* are part of the contract
//! (`sources.test.ts` asserts on them, and the CLI prints them). Three shapes exist:
//!
//! 1. messages the chain code authors itself — reproduced **byte-for-byte** here
//!    ([`Error::Message`]);
//! 2. `Failed to parse <abs>: <parser message>` — the authored prefix is reproduced,
//!    the wrapped text is engine-specific ([`Error::Parse`]);
//! 3. a bare Node fs error (`ENOENT: no such file or directory, open '<abs>'`) —
//!    no Rust equivalent text exists ([`Error::Io`]).
//!
//! Keeping (2) and (3) as distinct variants is what lets `tests/oracle.rs` compare
//! authored messages exactly while only classifying the foreign ones.

use std::fmt;
use std::path::Path;

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Error {
    /// A message authored by the chain implementation. Byte-identical to the TS.
    Message(String),
    /// `Failed to parse {path}: {source}` — authored prefix, foreign suffix
    /// (`resolveChain` wraps its parse failures like this).
    Parse { path: String, source: String },
    /// A parse failure with **no** authored wrapper: `readRawDoc` lets the raw
    /// `JSON.parse` / js-yaml message propagate, so there is no shared text at all.
    Syntax { path: String, source: String },
    /// Reading a file failed. The TS surfaces Node's raw fs message.
    Io { path: String, source: String },
}

impl Error {
    pub(crate) fn msg(m: impl Into<String>) -> Self {
        Error::Message(m.into())
    }

    pub(crate) fn io(path: &Path, err: &std::io::Error) -> Self {
        Error::Io {
            path: path.display().to_string(),
            source: err.to_string(),
        }
    }

    pub(crate) fn parse(path: &Path, source: impl fmt::Display) -> Self {
        Error::Parse {
            path: path.display().to_string(),
            source: source.to_string(),
        }
    }

    pub(crate) fn syntax(path: &Path, source: impl fmt::Display) -> Self {
        Error::Syntax {
            path: path.display().to_string(),
            source: source.to_string(),
        }
    }

    /// The path an [`Error::Io`] / [`Error::Parse`] / [`Error::Syntax`] concerns.
    pub fn path(&self) -> Option<&str> {
        match self {
            Error::Message(_) => None,
            Error::Parse { path, .. } | Error::Syntax { path, .. } | Error::Io { path, .. } => {
                Some(path)
            }
        }
    }
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::Message(m) => f.write_str(m),
            Error::Parse { path, source } => write!(f, "Failed to parse {path}: {source}"),
            Error::Syntax { path, source } => write!(f, "{source} (parsing {path})"),
            Error::Io { path, source } => write!(f, "{source} (reading {path})"),
        }
    }
}

impl std::error::Error for Error {}
