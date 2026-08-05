//! Raw TextMate grammar model — the serde deserialization target for a grammar
//! JSON file, mirroring vscode-textmate's `IRawGrammar` / `IRawRule` /
//! `IRawRepository` / `IRawCaptures`. No behavior here; rule compilation
//! (`rule.rs`) turns this into compiled rules with assigned ids.

use std::collections::HashMap;

use serde::Deserialize;

/// A grammar document (one `<lang>.json`).
#[derive(Debug, Clone, Deserialize)]
pub struct RawGrammar {
    #[serde(rename = "scopeName")]
    pub scope_name: String,

    #[serde(default)]
    pub patterns: Vec<RawRule>,

    /// Named rules referenced via `#name` (and the special `$self` / `$base`).
    #[serde(default)]
    pub repository: HashMap<String, RawRule>,

    /// Injections: selector expression → rule. Applied into other grammars.
    #[serde(default)]
    pub injections: HashMap<String, RawRule>,

    #[serde(default, rename = "injectionSelector")]
    pub injection_selector: Option<String>,

    #[serde(default)]
    pub name: Option<String>,
}

/// A raw rule. Every field is optional in the JSON; which combination is present
/// determines the compiled rule kind (match / begin-end / begin-while /
/// include-only / captures-only).
#[derive(Debug, Clone, Default, Deserialize)]
pub struct RawRule {
    #[serde(default)]
    pub include: Option<String>,

    #[serde(default)]
    pub name: Option<String>,

    #[serde(default, rename = "contentName")]
    pub content_name: Option<String>,

    #[serde(default, rename = "match")]
    pub match_: Option<String>,

    #[serde(default)]
    pub captures: Option<RawCaptures>,

    #[serde(default)]
    pub begin: Option<String>,

    #[serde(default, rename = "beginCaptures")]
    pub begin_captures: Option<RawCaptures>,

    #[serde(default)]
    pub end: Option<String>,

    #[serde(default, rename = "endCaptures")]
    pub end_captures: Option<RawCaptures>,

    // `while` is a Rust keyword.
    #[serde(default, rename = "while")]
    pub while_: Option<String>,

    #[serde(default, rename = "whileCaptures")]
    pub while_captures: Option<RawCaptures>,

    #[serde(default)]
    pub patterns: Option<Vec<RawRule>>,

    /// A rule may carry its own local repository (scoped named rules).
    #[serde(default)]
    pub repository: Option<HashMap<String, RawRule>>,

    #[serde(default, rename = "applyEndPatternLast")]
    pub apply_end_pattern_last: Option<bool>,
}

/// `captures` / `beginCaptures` / … — a map from capture-group-number (as a
/// string key) to the rule applied to that group (usually just `{ name }`).
/// vscode indexes these by number, with gaps allowed; `rule.rs` flattens this
/// into a `Vec<Option<CaptureRule>>` indexed by group number.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(transparent)]
pub struct RawCaptures(pub HashMap<String, RawRule>);

impl RawGrammar {
    /// Parse a grammar JSON string.
    pub fn from_json(s: &str) -> Result<RawGrammar, serde_json::Error> {
        serde_json::from_str(s)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_minimal_grammar() {
        let g = RawGrammar::from_json(
            r##"{
                "scopeName": "source.demo",
                "patterns": [{ "include": "#keywords" }, { "match": "\\d+", "name": "constant.numeric" }],
                "repository": {
                    "keywords": {
                        "patterns": [{ "match": "\\b(if|else)\\b", "name": "keyword.control" }]
                    },
                    "strings": {
                        "begin": "\"", "end": "\"",
                        "name": "string.quoted.double",
                        "patterns": [{ "match": "\\\\.", "name": "constant.character.escape" }]
                    }
                }
            }"##,
        )
        .expect("parse");

        assert_eq!(g.scope_name, "source.demo");
        assert_eq!(g.patterns.len(), 2);
        assert_eq!(g.patterns[0].include.as_deref(), Some("#keywords"));
        assert_eq!(g.patterns[1].match_.as_deref(), Some(r"\d+"));
        assert!(g.repository.contains_key("keywords"));
        let strings = &g.repository["strings"];
        assert_eq!(strings.begin.as_deref(), Some("\""));
        assert_eq!(strings.end.as_deref(), Some("\""));
    }

    #[test]
    fn parses_captures_and_while_keyword() {
        let r: RawRule = serde_json::from_str(
            r#"{
                "begin": "^(>)",
                "beginCaptures": { "1": { "name": "punctuation.definition.quote" } },
                "while": "^(>)",
                "whileCaptures": { "1": { "name": "punctuation.definition.quote" } },
                "name": "markup.quote"
            }"#,
        )
        .expect("parse");
        assert_eq!(r.begin.as_deref(), Some("^(>)"));
        assert_eq!(r.while_.as_deref(), Some("^(>)"));
        assert!(r.begin_captures.is_some());
        assert_eq!(
            r.begin_captures.unwrap().0["1"].name.as_deref(),
            Some("punctuation.definition.quote")
        );
    }
}
