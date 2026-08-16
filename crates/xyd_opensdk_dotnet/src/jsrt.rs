//! JS-runtime + C# naming helpers — port of naming.ts + the String()/
//! JSON.stringify coercions the dotnet emitter relies on.

use std::collections::HashSet;

/// naming.ts `splitWords`: camelCase + ACRONYM boundaries, split on ANY
/// non-alphanumeric, lowercased.
pub fn split_words(input: &str) -> Vec<String> {
    let chars: Vec<char> = input.chars().collect();
    // replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    let mut p1 = String::with_capacity(input.len() + 8);
    for (i, &c) in chars.iter().enumerate() {
        p1.push(c);
        if let Some(&n) = chars.get(i + 1) {
            if (c.is_ascii_lowercase() || c.is_ascii_digit()) && n.is_ascii_uppercase() {
                p1.push(' ');
            }
        }
    }
    // replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    let c2: Vec<char> = p1.chars().collect();
    let mut p2 = String::with_capacity(p1.len() + 8);
    for (i, &c) in c2.iter().enumerate() {
        p2.push(c);
        if c.is_ascii_uppercase() {
            if let (Some(&n1), Some(&n2)) = (c2.get(i + 1), c2.get(i + 2)) {
                if n1.is_ascii_uppercase() && n2.is_ascii_lowercase() {
                    p2.push(' ');
                }
            }
        }
    }
    p2.split(|c: char| !c.is_ascii_alphanumeric())
        .map(|w| w.trim().to_lowercase())
        .filter(|w| !w.is_empty())
        .collect()
}

fn capitalize(word: &str) -> String {
    let mut cs = word.chars();
    match cs.next() {
        Some(f) => f.to_uppercase().collect::<String>() + cs.as_str(),
        None => String::new(),
    }
}

/// Prefix `_` when an identifier would start with a digit.
fn safe_ident(s: &str) -> String {
    if s.chars()
        .next()
        .map(|c| c.is_ascii_digit())
        .unwrap_or(false)
    {
        format!("_{s}")
    } else {
        s.to_string()
    }
}

/// PascalCase C# identifier.
pub fn pascal_case(input: &str) -> String {
    safe_ident(
        &split_words(input)
            .iter()
            .map(|w| capitalize(w))
            .collect::<String>(),
    )
}

/// lowerCamelCase C# identifier (method arg / local); `@`-escapes keywords.
pub fn camel_case(input: &str) -> String {
    let words = split_words(input);
    if words.is_empty() {
        return "arg".to_string();
    }
    let head = &words[0];
    let rest: String = words[1..].iter().map(|w| capitalize(w)).collect();
    let name = safe_ident(&format!("{head}{rest}"));
    if CS_KEYWORDS.contains(&name.as_str()) {
        format!("@{name}")
    } else {
        name
    }
}

/// `allocIdent`: `base`, then `baseValue`, `baseValue2`, … on collision.
fn alloc_ident(base: &str, used: &mut HashSet<String>) -> String {
    let mut name = base.to_string();
    if used.contains(&name) {
        name = format!("{base}Value");
        let mut i = 2u32;
        while used.contains(&name) {
            name = format!("{base}Value{i}");
            i += 1;
        }
    }
    used.insert(name.clone());
    name
}

/// `structPropertyNames`: wire-name → C# property identifier, reserving the
/// enclosing type name and resolving PascalCase collisions.
pub fn struct_property_names(
    pascal_type_name: &str,
    field_names: &[String],
) -> Vec<(String, String)> {
    let mut used: HashSet<String> = HashSet::new();
    used.insert(pascal_type_name.to_string());
    let mut out = Vec::new();
    for fn_ in field_names {
        let base = {
            let p = pascal_case(fn_);
            if p.is_empty() {
                "Value".to_string()
            } else {
                p
            }
        };
        out.push((fn_.clone(), alloc_ident(&base, &mut used)));
    }
    out
}

/// `methodName`: PascalCase of the action verb (or "Invoke").
pub fn method_name(action: &str) -> String {
    let p = pascal_case(action);
    if p.is_empty() {
        "Invoke".to_string()
    } else {
        p
    }
}

/// JS `String(value)` for scalar values.
pub fn js_string(v: &serde_json::Value) -> String {
    match v {
        serde_json::Value::Null => "null".to_string(),
        serde_json::Value::Bool(b) => b.to_string(),
        serde_json::Value::String(s) => s.clone(),
        serde_json::Value::Number(n) => n.to_string(),
        other => other.to_string(),
    }
}

/// JS `JSON.stringify(s)` for a string — the C# string-literal form the emitter
/// uses everywhere (quotes + escapes). Matches serde_json's string encoding,
/// which is byte-identical to JSON.stringify for strings.
pub fn json_string(s: &str) -> String {
    serde_json::Value::String(s.to_string()).to_string()
}

const CS_KEYWORDS: &[&str] = &[
    "abstract",
    "as",
    "base",
    "bool",
    "break",
    "byte",
    "case",
    "catch",
    "char",
    "checked",
    "class",
    "const",
    "continue",
    "decimal",
    "default",
    "delegate",
    "do",
    "double",
    "else",
    "enum",
    "event",
    "explicit",
    "extern",
    "false",
    "finally",
    "fixed",
    "float",
    "for",
    "foreach",
    "goto",
    "if",
    "implicit",
    "in",
    "int",
    "interface",
    "internal",
    "is",
    "lock",
    "long",
    "namespace",
    "new",
    "null",
    "object",
    "operator",
    "out",
    "override",
    "params",
    "private",
    "protected",
    "public",
    "readonly",
    "ref",
    "return",
    "sbyte",
    "sealed",
    "short",
    "sizeof",
    "stackalloc",
    "static",
    "string",
    "struct",
    "switch",
    "this",
    "throw",
    "true",
    "try",
    "typeof",
    "uint",
    "ulong",
    "unchecked",
    "unsafe",
    "ushort",
    "using",
    "virtual",
    "void",
    "volatile",
    "while",
];
