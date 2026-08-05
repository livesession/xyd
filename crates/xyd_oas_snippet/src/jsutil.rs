//! Small JS-semantics helpers shared by the HAR builder and the httpsnippet
//! clients: `String(value)` coercion, the httpsnippet `escapeString` family,
//! `encodeURIComponent`, and RFC3986 / `qs` percent-encoding. Each mirrors the
//! exact JS behavior of the upstream packages so snippet output stays
//! byte-identical.

use serde_json::Value;

/// JS `String(value)` for the JSON values that flow through the HAR builder.
/// Numbers render without a trailing `.0` for integers; arrays join with `,`;
/// objects become `[object Object]` (matches `String({})`).
pub fn js_string(v: &Value) -> String {
    match v {
        Value::Null => "null".to_string(),
        Value::Bool(b) => b.to_string(),
        Value::Number(n) => js_number_string(n),
        Value::String(s) => s.clone(),
        Value::Array(a) => a
            .iter()
            .map(|el| match el {
                // JS String([null]) === "" for null/undefined array members.
                Value::Null => String::new(),
                other => js_string(other),
            })
            .collect::<Vec<_>>()
            .join(","),
        Value::Object(_) => "[object Object]".to_string(),
    }
}

/// JS `String(number)`. Integers print without a decimal point; finite floats
/// use the shortest round-trip form (Rust's `{}` for f64 matches JS for the
/// values a spec sampler produces).
pub fn js_number_string(n: &serde_json::Number) -> String {
    if let Some(i) = n.as_i64() {
        return i.to_string();
    }
    if let Some(u) = n.as_u64() {
        return u.to_string();
    }
    if let Some(f) = n.as_f64() {
        if f.fract() == 0.0 && f.is_finite() && f.abs() < 1e21 {
            return format!("{}", f as i64);
        }
        return format!("{f}");
    }
    n.to_string()
}

/// httpsnippet `escapeString(rawValue, { delimiter, escapeChar: "\\",
/// escapeNewlines: true })`.
pub fn escape_string(raw: &str, delimiter: char, escape_newlines: bool) -> String {
    let escape_char = '\\';
    let mut out = String::with_capacity(raw.len());
    for c in raw.chars() {
        match c {
            '\u{08}' => out.push_str("\\b"),
            '\t' => out.push_str("\\t"),
            '\n' => {
                if escape_newlines {
                    out.push_str("\\n");
                } else {
                    out.push('\n');
                }
            }
            '\u{0C}' => out.push_str("\\f"),
            '\r' => {
                if escape_newlines {
                    out.push_str("\\r");
                } else {
                    out.push('\r');
                }
            }
            c if c == escape_char => out.push_str("\\\\"),
            c if c == delimiter => {
                out.push(escape_char);
                out.push(delimiter);
            }
            // `c < " "`: remaining C0 controls → JSON `\u00xx` escape.
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            // `c > "~"`: `JSON.stringify(c).slice(1, -1)` keeps the char literal
            // for every code point JSON does not escape (all of them here).
            c => out.push(c),
        }
    }
    out
}

/// `escapeForDoubleQuotes` — escape a value for a `"…"` string literal.
pub fn escape_double(raw: &str) -> String {
    escape_string(raw, '"', true)
}

/// JS `encodeURIComponent`: percent-encode UTF-8, keeping the JS "unreserved"
/// set `A-Za-z0-9 - _ . ! ~ * ' ( )`.
pub fn encode_uri_component(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for b in s.bytes() {
        let keep = b.is_ascii_alphanumeric()
            || matches!(
                b,
                b'-' | b'_' | b'.' | b'!' | b'~' | b'*' | b'\'' | b'(' | b')'
            );
        if keep {
            out.push(b as char);
        } else {
            out.push_str(&format!("%{b:02X}"));
        }
    }
    out
}

/// `qs`'s default RFC3986 encoder: percent-encode UTF-8, keeping only the
/// RFC3986 unreserved set `A-Za-z0-9 - _ . ~`.
pub fn qs_encode(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for b in s.bytes() {
        let keep = b.is_ascii_alphanumeric() || matches!(b, b'-' | b'_' | b'.' | b'~');
        if keep {
            out.push(b as char);
        } else {
            out.push_str(&format!("%{b:02X}"));
        }
    }
    out
}

/// oas-to-har `isURIEncoded`: `decodeURIComponent(value) !== value` (false on a
/// malformed sequence).
pub fn is_uri_encoded(value: &str) -> bool {
    match decode_uri_component(value) {
        Some(decoded) => decoded != value,
        None => false,
    }
}

/// A `decodeURIComponent` good enough for `isURIEncoded`: decode `%XX` UTF-8
/// sequences, returning `None` on malformed input (matching a thrown
/// `URIError`).
fn decode_uri_component(value: &str) -> Option<String> {
    let bytes = value.as_bytes();
    let mut out: Vec<u8> = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        let b = bytes[i];
        if b == b'%' {
            if i + 2 >= bytes.len() {
                return None;
            }
            let hi = hex_val(bytes[i + 1])?;
            let lo = hex_val(bytes[i + 2])?;
            out.push((hi << 4) | lo);
            i += 3;
        } else {
            out.push(b);
            i += 1;
        }
    }
    String::from_utf8(out).ok()
}

fn hex_val(b: u8) -> Option<u8> {
    match b {
        b'0'..=b'9' => Some(b - b'0'),
        b'a'..=b'f' => Some(b - b'a' + 10),
        b'A'..=b'F' => Some(b - b'A' + 10),
        _ => None,
    }
}

/// RFC3986 unreserved test used by the style serializer (`/^[a-z0-9\-._~]+$/i`
/// on a single char).
pub fn is_rfc3986_unreserved(c: char) -> bool {
    c.is_ascii_alphanumeric() || matches!(c, '-' | '.' | '_' | '~')
}

/// RFC3986 reserved test used by the style serializer
/// (`":/?#[]@!$&'()*+,;=".indexOf(char) > -1`).
pub fn is_rfc3986_reserved(c: char) -> bool {
    ":/?#[]@!$&'()*+,;=".contains(c)
}

/// oas-to-har `encodeDisallowedCharacters` for the boolean-`escape` path used
/// by the style serializer (`escape: true`, so never the "unsafe" mode).
pub fn encode_disallowed_characters(
    raw: &str,
    return_if_encoded: bool,
    is_allowed_reserved: bool,
) -> String {
    if return_if_encoded && is_uri_encoded(raw) {
        return raw.to_string();
    }
    if raw.is_empty() {
        return raw.to_string();
    }
    let mut out = String::with_capacity(raw.len());
    for c in raw.chars() {
        // Unreserved always passes; reserved passes only under allowReserved
        // (the `escape: "unsafe"` branch never applies in xyd's usage).
        if is_rfc3986_unreserved(c) || (is_rfc3986_reserved(c) && is_allowed_reserved) {
            out.push(c);
        } else {
            let mut buf = [0u8; 4];
            for b in c.encode_utf8(&mut buf).bytes() {
                out.push_str(&format!("%{b:02X}"));
            }
        }
    }
    out
}
