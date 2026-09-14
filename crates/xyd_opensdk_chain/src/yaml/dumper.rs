//! Port of `js-yaml`'s `dump()` for the JSON value subset, at js-yaml's defaults:
//! `indent: 2`, `lineWidth: 80`, `flowLevel: -1`, `quotingType: "'"`,
//! `forceQuotes: false`, `noCompatMode: false`, `noArrayIndent: false`,
//! `sortKeys: false`, `condenseFlow: false`.
//!
//! JSON values are trees of `null | bool | number | string | array | object`, so the
//! parts of js-yaml that deal with anchors/duplicate references, explicit tags,
//! `Uint8Array`/`Date` instances and `undefined` are unreachable and are not ported.
//!
//! Function names mirror the JS (`write_node` ↔ `writeNode`, …) so the two can be
//! diffed side by side.

use serde_json::Value;

use super::implicit::resolves_implicitly;
use crate::jsnum::number_to_string;

const INDENT: usize = 2;
const LINE_WIDTH: i64 = 80;

/// `yaml.dump(value)` — always ends with a newline, like js-yaml.
pub fn dump(value: &Value) -> String {
    format!("{}\n", write_node(0, value, true, true, false, false))
}

const DEPRECATED_BOOLEANS: [&str; 16] = [
    "y", "Y", "yes", "Yes", "YES", "on", "On", "ON", "n", "N", "no", "No", "NO", "off", "Off",
    "OFF",
];

/// `DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/`
fn is_base60(s: &str) -> bool {
    let c: Vec<char> = s.chars().collect();
    let mut i = 0usize;
    if matches!(c.first(), Some('-') | Some('+')) {
        i = 1;
    }
    let run = |c: &[char], i: &mut usize| -> usize {
        let start = *i;
        while *i < c.len() && (c[*i].is_ascii_digit() || c[*i] == '_') {
            *i += 1;
        }
        *i - start
    };
    if run(&c, &mut i) == 0 {
        return false;
    }
    let mut groups = 0;
    while i < c.len() && c[i] == ':' {
        i += 1;
        if run(&c, &mut i) == 0 {
            return false;
        }
        groups += 1;
    }
    if groups == 0 {
        return false;
    }
    if i < c.len() && c[i] == '.' {
        i += 1;
        run(&c, &mut i);
    }
    i == c.len()
}

// ── character classes (js-yaml dumper.js) ──────────────────────────────────────

fn is_printable(c: char) -> bool {
    let n = c as u32;
    (0x20..=0x7E).contains(&n)
        || ((0xA1..=0xD7FF).contains(&n) && n != 0x2028 && n != 0x2029)
        || ((0xE000..=0xFFFD).contains(&n) && n != 0xFEFF)
        || (0x10000..=0x10FFFF).contains(&n)
}

fn is_whitespace(c: char) -> bool {
    c == ' ' || c == '\t'
}

fn is_ns_char_or_whitespace(c: char) -> bool {
    is_printable(c) && c != '\u{feff}' && c != '\r' && c != '\n'
}

/// `isPlainSafe(c, prev, inblock)` — `prev` is `None` for the first character.
fn is_plain_safe(c: char, prev: Option<char>, inblock: bool) -> bool {
    let c_ns_or_ws = is_ns_char_or_whitespace(c);
    let c_ns = c_ns_or_ws && !is_whitespace(c);
    let prev_is_ns = prev.is_some_and(|p| is_ns_char_or_whitespace(p) && !is_whitespace(p));
    let prev_is_colon = prev == Some(':');

    let base = if inblock {
        c_ns_or_ws
    } else {
        c_ns_or_ws && !matches!(c, ',' | '[' | ']' | '{' | '}')
    };

    (base && c != '#' && !(prev_is_colon && !c_ns))
        || (prev_is_ns && c == '#')
        || (prev_is_colon && c_ns)
}

fn is_plain_safe_first(c: char) -> bool {
    is_printable(c)
        && c != '\u{feff}'
        && !is_whitespace(c)
        && !matches!(
            c,
            '-' | '?'
                | ':'
                | ','
                | '['
                | ']'
                | '{'
                | '}'
                | '#'
                | '&'
                | '*'
                | '!'
                | '|'
                | '='
                | '>'
                | '\''
                | '"'
                | '%'
                | '@'
                | '`'
        )
}

fn is_plain_safe_last(c: char) -> bool {
    !is_whitespace(c) && c != ':'
}

fn need_indent_indicator(s: &str) -> bool {
    // /^\n* /
    s.trim_start_matches('\n').starts_with(' ')
}

// ── scalar style ───────────────────────────────────────────────────────────────

#[derive(PartialEq, Clone, Copy)]
enum Style {
    Plain,
    Single,
    Literal,
    Folded,
    Double,
}

/// `chooseScalarStyle`. `quotingType` is always single and `forceQuotes` always false
/// here, so the `QUOTING_TYPE_DOUBLE` branches collapse to `Style::Single`.
fn choose_scalar_style(s: &str, single_line_only: bool, line_width: i64, inblock: bool) -> Style {
    let chars: Vec<char> = s.chars().collect();
    let mut plain = is_plain_safe_first(chars[0]) && is_plain_safe_last(chars[chars.len() - 1]);
    let mut has_line_break = false;
    let mut has_foldable_line = false;
    let should_track_width = line_width != -1;
    let mut previous_line_break: i64 = -1;
    let mut prev: Option<char> = None;
    let mut i: i64;

    if single_line_only {
        for &c in &chars {
            if !is_printable(c) {
                return Style::Double;
            }
            plain = plain && is_plain_safe(c, prev, inblock);
            prev = Some(c);
        }
    } else {
        for (idx, &c) in chars.iter().enumerate() {
            i = idx as i64;
            if c == '\n' {
                has_line_break = true;
                if should_track_width {
                    has_foldable_line = has_foldable_line
                        || (i - previous_line_break - 1 > line_width
                            && chars.get((previous_line_break + 1) as usize) != Some(&' '));
                    previous_line_break = i;
                }
            } else if !is_printable(c) {
                return Style::Double;
            }
            plain = plain && is_plain_safe(c, prev, inblock);
            prev = Some(c);
        }
        i = chars.len() as i64; // the JS loop leaves `i === string.length`
        has_foldable_line = has_foldable_line
            || (should_track_width
                && i - previous_line_break - 1 > line_width
                && chars.get((previous_line_break + 1) as usize) != Some(&' '));
    }

    if !has_line_break && !has_foldable_line {
        if plain && !resolves_implicitly(s) {
            return Style::Plain;
        }
        return Style::Single;
    }
    // `indentPerLevel > 9` is unreachable at INDENT == 2.
    if has_foldable_line {
        Style::Folded
    } else {
        Style::Literal
    }
}

/// `writeScalar`.
fn write_scalar(s: &str, level: usize, iskey: bool, inblock: bool) -> String {
    if s.is_empty() {
        return "''".to_string();
    }
    if DEPRECATED_BOOLEANS.contains(&s) || is_base60(s) {
        return format!("'{s}'");
    }

    let indent = INDENT * level.max(1);
    // `Math.max(Math.min(lineWidth, 40), lineWidth - indent)` — the width shrinks with
    // depth down to a floor of 40.
    let line_width = LINE_WIDTH.min(40).max(LINE_WIDTH - indent as i64);

    // `singleLineOnly = iskey || (flowLevel > -1 && ...)`; flowLevel is -1.
    match choose_scalar_style(s, iskey, line_width, inblock) {
        Style::Plain => s.to_string(),
        Style::Single => format!("'{}'", s.replace('\'', "''")),
        Style::Literal => format!(
            "|{}{}",
            block_header(s),
            drop_ending_newline(&indent_string(s, indent))
        ),
        Style::Folded => format!(
            ">{}{}",
            block_header(s),
            drop_ending_newline(&indent_string(&fold_string(s, line_width), indent))
        ),
        Style::Double => format!("\"{}\"", escape_string(s)),
    }
}

fn block_header(s: &str) -> String {
    let indicator = if need_indent_indicator(s) {
        INDENT.to_string()
    } else {
        String::new()
    };
    let chars: Vec<char> = s.chars().collect();
    let clip = chars.last() == Some(&'\n');
    let keep = clip && (chars.len() >= 2 && chars[chars.len() - 2] == '\n' || s == "\n");
    let chomp = if keep {
        "+"
    } else if clip {
        ""
    } else {
        "-"
    };
    format!("{indicator}{chomp}\n")
}

fn drop_ending_newline(s: &str) -> String {
    s.strip_suffix('\n').unwrap_or(s).to_string()
}

/// `indentString`.
fn indent_string(s: &str, spaces: usize) -> String {
    let ind = " ".repeat(spaces);
    let mut result = String::new();
    let mut rest = s;
    while !rest.is_empty() {
        let (line, next) = match rest.find('\n') {
            Some(p) => (&rest[..p + 1], &rest[p + 1..]),
            None => (rest, ""),
        };
        if !line.is_empty() && line != "\n" {
            result.push_str(&ind);
        }
        result.push_str(line);
        rest = next;
    }
    result
}

/// `foldString`: `/(\n+)([^\n]*)/g` over the string after the first line.
fn fold_string(s: &str, width: i64) -> String {
    let first_lf = s.find('\n').unwrap_or(s.len());
    let mut result = fold_line(&s[..first_lf], width);
    let mut prev_more_indented = s.starts_with('\n') || s.starts_with(' ');

    let mut pos = first_lf;
    let bytes = s.as_bytes();
    while pos < s.len() {
        // (\n+)
        let nl_start = pos;
        while pos < s.len() && bytes[pos] == b'\n' {
            pos += 1;
        }
        if pos == nl_start {
            break;
        }
        let prefix = &s[nl_start..pos];
        // ([^\n]*)
        let line_start = pos;
        while pos < s.len() && bytes[pos] != b'\n' {
            pos += 1;
        }
        let line = &s[line_start..pos];

        let more_indented = line.starts_with(' ');
        result.push_str(prefix);
        if !prev_more_indented && !more_indented && !line.is_empty() {
            result.push('\n');
        }
        result.push_str(&fold_line(line, width));
        prev_more_indented = more_indented;
    }
    result
}

/// `foldLine` — greedy break at `/ [^ ]/`.
fn fold_line(line: &str, width: i64) -> String {
    if line.is_empty() || line.starts_with(' ') {
        return line.to_string();
    }
    let c: Vec<char> = line.chars().collect();
    let len = c.len() as i64;
    let mut start: i64 = 0;
    let mut curr: i64 = 0;
    let mut result = String::new();

    let slice = |a: i64, b: i64| -> String { c[a as usize..b as usize].iter().collect::<String>() };

    // `breakRe = / [^ ]/g` — match index is the position of the space.
    let mut idx: i64 = 0;
    while idx + 1 < len {
        if c[idx as usize] == ' ' && c[(idx + 1) as usize] != ' ' {
            let next = idx;
            if next - start > width {
                let end = if curr > start { curr } else { next };
                result.push('\n');
                result.push_str(&slice(start, end));
                start = end + 1;
            }
            curr = next;
            idx += 2; // lastIndex advances past the two matched chars
        } else {
            idx += 1;
        }
    }

    result.push('\n');
    if len - start > width && curr > start {
        result.push_str(&slice(start, curr));
        result.push('\n');
        result.push_str(&slice(curr + 1, len));
    } else {
        result.push_str(&slice(start, len));
    }
    result.chars().skip(1).collect()
}

/// `escapeString` + `ESCAPE_SEQUENCES`.
fn escape_string(s: &str) -> String {
    let mut out = String::new();
    for c in s.chars() {
        let seq = match c as u32 {
            0x00 => Some("\\0"),
            0x07 => Some("\\a"),
            0x08 => Some("\\b"),
            0x09 => Some("\\t"),
            0x0A => Some("\\n"),
            0x0B => Some("\\v"),
            0x0C => Some("\\f"),
            0x0D => Some("\\r"),
            0x1B => Some("\\e"),
            0x22 => Some("\\\""),
            0x5C => Some("\\\\"),
            0x85 => Some("\\N"),
            0xA0 => Some("\\_"),
            0x2028 => Some("\\L"),
            0x2029 => Some("\\P"),
            _ => None,
        };
        match seq {
            Some(s) => out.push_str(s),
            None if is_printable(c) => out.push(c),
            None => out.push_str(&encode_hex(c as u32)),
        }
    }
    out
}

fn encode_hex(n: u32) -> String {
    let hex = format!("{n:x}");
    let (prefix, length) = if n <= 0xFF {
        ("x", 2)
    } else if n <= 0xFFFF {
        ("u", 4)
    } else {
        ("U", 8)
    };
    format!("\\{}{}{}", prefix, "0".repeat(length - hex.len()), hex)
}

// ── node writing ───────────────────────────────────────────────────────────────

/// `writeNode`. Returns the node's rendered form (`state.dump`).
fn write_node(
    level: usize,
    object: &Value,
    block: bool,
    compact: bool,
    iskey: bool,
    _isblockseq: bool,
) -> String {
    let inblock = block;
    // `block = (flowLevel < 0 || flowLevel > level)` with flowLevel == -1 → unchanged.
    match object {
        Value::Null => "null".to_string(),
        Value::Bool(b) => if *b { "true" } else { "false" }.to_string(),
        Value::Number(n) => represent_number(n),
        Value::String(s) => write_scalar(s, level, iskey, inblock),
        Value::Object(map) => {
            if block && !map.is_empty() {
                write_block_mapping(level, object, compact)
            } else {
                write_flow_mapping(level, object)
            }
        }
        Value::Array(items) => {
            if block && !items.is_empty() {
                write_block_sequence(level, items, compact)
            } else {
                write_flow_sequence(level, items)
            }
        }
    }
}

/// js-yaml picks `!!int` for any integral non-`-0` number (`representYamlInteger` =
/// `toString(10)`) and `!!float` otherwise (`-0` → `-0.0`; scientific forms without a
/// dot gain one: `1e-7` → `1.e-7`).
fn represent_number(n: &serde_json::Number) -> String {
    if let Some(i) = n.as_i64() {
        return i.to_string();
    }
    if let Some(u) = n.as_u64() {
        return u.to_string();
    }
    let f = n.as_f64().unwrap_or(f64::NAN);
    if !f.is_finite() {
        return if f.is_nan() {
            ".nan".to_string()
        } else if f > 0.0 {
            ".inf".to_string()
        } else {
            "-.inf".to_string()
        };
    }
    let is_negative_zero = f == 0.0 && f.is_sign_negative();
    if f.fract() == 0.0 && !is_negative_zero {
        return number_to_string(f); // integral → !!int
    }
    if is_negative_zero {
        return "-0.0".to_string();
    }
    let res = number_to_string(f);
    if scientific_without_dot(&res) {
        res.replacen('e', ".e", 1)
    } else {
        res
    }
}

/// `SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/`
fn scientific_without_dot(s: &str) -> bool {
    let rest = s.strip_prefix(['-', '+']).unwrap_or(s);
    let digits = rest.chars().take_while(char::is_ascii_digit).count();
    digits > 0 && rest[digits..].starts_with('e')
}

fn generate_next_line(level: usize) -> String {
    format!("\n{}", " ".repeat(INDENT * level))
}

fn write_flow_sequence(level: usize, items: &[Value]) -> String {
    let parts: Vec<String> = items
        .iter()
        .map(|v| write_node(level, v, false, false, false, false))
        .collect();
    format!("[{}]", parts.join(", "))
}

fn write_block_sequence(level: usize, items: &[Value], compact: bool) -> String {
    let mut result = String::new();
    for v in items {
        let dump = write_node(level + 1, v, true, true, false, true);
        if !compact || !result.is_empty() {
            result.push_str(&generate_next_line(level));
        }
        if dump.starts_with('\n') {
            result.push('-');
        } else {
            result.push_str("- ");
        }
        result.push_str(&dump);
    }
    if result.is_empty() {
        "[]".to_string()
    } else {
        result
    }
}

fn write_flow_mapping(level: usize, object: &Value) -> String {
    let map = object
        .as_object()
        .expect("write_flow_mapping on a non-object");
    let parts: Vec<String> = map
        .iter()
        .map(|(k, v)| {
            format!(
                "{}: {}",
                write_node(level, &Value::String(k.clone()), false, false, false, false),
                write_node(level, v, false, false, false, false)
            )
        })
        .collect();
    format!("{{{}}}", parts.join(", "))
}

fn write_block_mapping(level: usize, object: &Value, compact: bool) -> String {
    let map = object
        .as_object()
        .expect("write_block_mapping on a non-object");
    let mut result = String::new();
    for (k, v) in map {
        let mut pair = String::new();
        if !compact || !result.is_empty() {
            pair.push_str(&generate_next_line(level));
        }
        let key_dump = write_node(
            level + 1,
            &Value::String(k.clone()),
            true,
            true,
            true,
            false,
        );
        // `explicitPair` also fires for tagged keys, which JSON strings never are.
        let explicit_pair = key_dump.chars().count() > 1024;
        if explicit_pair {
            if key_dump.starts_with('\n') {
                pair.push('?');
            } else {
                pair.push_str("? ");
            }
        }
        pair.push_str(&key_dump);
        if explicit_pair {
            pair.push_str(&generate_next_line(level));
        }
        let value_dump = write_node(level + 1, v, true, explicit_pair, false, false);
        if value_dump.starts_with('\n') {
            pair.push(':');
        } else {
            pair.push_str(": ");
        }
        pair.push_str(&value_dump);
        result.push_str(&pair);
    }
    if result.is_empty() {
        "{}".to_string()
    } else {
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn scalar_styles() {
        let v: Value = serde_json::from_str(
            r##"{"plain":"hello","colon":"a: b","hash":"#h","dash":"- x","empty":"","numlike":"1.0","yes":"yes","apos":"it's here"}"##,
        )
        .unwrap();
        assert_eq!(
            dump(&v),
            "plain: hello\ncolon: 'a: b'\nhash: '#h'\ndash: '- x'\nempty: ''\nnumlike: '1.0'\n'yes': 'yes'\napos: it's here\n"
        );
    }

    #[test]
    fn empty_containers_are_flow() {
        let v: Value = serde_json::from_str(r#"{"m":{},"s":[]}"#).unwrap();
        assert_eq!(dump(&v), "m: {}\ns: []\n");
    }
}
