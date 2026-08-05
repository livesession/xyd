//! Port of `stringify-object@3.3.0` (the exact version the fetch client pulls
//! in), including the placeholder-token `inlineCharacterLimit` collapsing and
//! the `transform` hook. Only the subset the fetch client exercises is
//! faithful: JSON values (object/array/string/number/bool/null) with single
//! quotes; circular refs, Dates, symbols and regexps are out of scope (the
//! fetch options object never contains them).

use serde_json::Value;

const T_NEWLINE: &str = "@@__STRINGIFY_OBJECT_NEW_LINE__@@";
const T_NEWLINE_OR_SPACE: &str = "@@__STRINGIFY_OBJECT_NEW_LINE_OR_SPACE__@@";
const T_PAD: &str = "@@__STRINGIFY_OBJECT_PAD__@@";
const T_INDENT: &str = "@@__STRINGIFY_OBJECT_INDENT__@@";

/// The `transform` hook: `(property, originalResult) -> result`. `property` is
/// an object key or an array index rendered as a decimal string; the return is
/// the (possibly wrapped) value string.
pub type Transform<'a> = dyn Fn(&str, String) -> String + 'a;

/// Options mirroring the `stringify-object` call the fetch client makes.
pub struct Options<'a> {
    pub indent: &'a str,
    pub inline_character_limit: Option<usize>,
    pub transform: Option<&'a Transform<'a>>,
}

/// Entry point mirroring `stringifyObject(val, opts)`.
pub fn stringify_object(val: &Value, opts: &Options) -> String {
    stringify(val, opts, "")
}

fn tokens(opts: &Options, pad: &str) -> (String, String, String, String) {
    if opts.inline_character_limit.is_none() {
        (
            "\n".to_string(),
            "\n".to_string(),
            pad.to_string(),
            format!("{pad}{}", opts.indent),
        )
    } else {
        (
            T_NEWLINE.to_string(),
            T_NEWLINE_OR_SPACE.to_string(),
            T_PAD.to_string(),
            T_INDENT.to_string(),
        )
    }
}

fn expand_whitespace(s: String, opts: &Options, pad: &str) -> String {
    let Some(limit) = opts.inline_character_limit else {
        return s;
    };
    let one_lined = s
        .replace(T_NEWLINE, "")
        .replace(T_NEWLINE_OR_SPACE, " ")
        .replace(T_PAD, "")
        .replace(T_INDENT, "");
    // JS `String.length` is UTF-16 code units.
    if one_lined.encode_utf16().count() <= limit {
        return one_lined;
    }
    s.replace(T_NEWLINE, "\n")
        .replace(T_NEWLINE_OR_SPACE, "\n")
        .replace(T_PAD, pad)
        .replace(T_INDENT, &format!("{pad}{}", opts.indent))
}

fn is_classic_identifier(key: &str) -> bool {
    // /^[a-z$_][a-z$_0-9]*$/i
    let mut chars = key.chars();
    match chars.next() {
        Some(c) if c.is_ascii_alphabetic() || c == '$' || c == '_' => {}
        _ => return false,
    }
    chars.all(|c| c.is_ascii_alphanumeric() || c == '$' || c == '_')
}

fn quote_string(raw: &str) -> String {
    // `String(val).replace(/[\r\n]/g, x => x === '\n' ? '\\n' : '\\r')`
    let mut s = String::with_capacity(raw.len() + 2);
    for c in raw.chars() {
        match c {
            '\n' => s.push_str("\\n"),
            '\r' => s.push_str("\\r"),
            _ => s.push(c),
        }
    }
    // singleQuotes default: `val.replace(/\\?'/g, "\\'")`
    let bytes: Vec<char> = s.chars().collect();
    let mut out = String::with_capacity(bytes.len() + 2);
    out.push('\'');
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == '\\' && i + 1 < bytes.len() && bytes[i + 1] == '\'' {
            out.push_str("\\'");
            i += 2;
        } else if bytes[i] == '\'' {
            out.push_str("\\'");
            i += 1;
        } else {
            out.push(bytes[i]);
            i += 1;
        }
    }
    out.push('\'');
    out
}

fn stringify(val: &Value, opts: &Options, pad: &str) -> String {
    match val {
        Value::Null => "null".to_string(),
        Value::Bool(b) => b.to_string(),
        Value::Number(n) => super::jsutil::js_number_string(n),
        Value::String(s) => quote_string(s),
        Value::Array(arr) => {
            if arr.is_empty() {
                return "[]".to_string();
            }
            let (nl, nls, tpad, tindent) = tokens(opts, pad);
            let child_pad = format!("{pad}{}", opts.indent);
            let mut body = String::new();
            for (i, el) in arr.iter().enumerate() {
                let eol = if i == arr.len() - 1 {
                    nl.clone()
                } else {
                    format!(",{nls}")
                };
                let mut value = stringify(el, opts, &child_pad);
                if let Some(tf) = opts.transform {
                    value = tf(&i.to_string(), value);
                }
                body.push_str(&format!("{tindent}{value}{eol}"));
            }
            let ret = format!("[{nl}{body}{tpad}]");
            expand_whitespace(ret, opts, pad)
        }
        Value::Object(map) => {
            if map.is_empty() {
                return "{}".to_string();
            }
            let (nl, nls, tpad, tindent) = tokens(opts, pad);
            let child_pad = format!("{pad}{}", opts.indent);
            let mut body = String::new();
            let len = map.len();
            for (i, (key, v)) in map.iter().enumerate() {
                let eol = if i == len - 1 {
                    nl.clone()
                } else {
                    format!(",{nls}")
                };
                let key_repr = if is_classic_identifier(key) {
                    key.clone()
                } else {
                    quote_string(key)
                };
                let mut value = stringify(v, opts, &child_pad);
                if let Some(tf) = opts.transform {
                    value = tf(key, value);
                }
                body.push_str(&format!("{tindent}{key_repr}: {value}{eol}"));
            }
            let ret = format!("{{{nl}{body}{tpad}}}");
            expand_whitespace(ret, opts, pad)
        }
    }
}
