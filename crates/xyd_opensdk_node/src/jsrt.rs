//! Naming + JS/TS-literal helpers, ported 1:1 from `src/naming.ts` and the
//! shared model helpers (`jsDoc`, `propKey`). Byte-faithful to the TS output.

/// JS `JSON.stringify` of a string: double-quoted with the standard escapes.
/// Matches V8 for the inputs this emitter produces (identifiers, wire names,
/// descriptions). Handles the escape set JSON mandates.
pub fn json_string(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 2);
    out.push('"');
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            '\u{08}' => out.push_str("\\b"),
            '\u{0c}' => out.push_str("\\f"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

/// Split an identifier (camel/snake/kebab/space/dot) into lowercase words.
/// Ports the two-regex boundary insertion + non-alphanumeric split of `splitWords`.
pub fn split_words(input: &str) -> Vec<String> {
    // Insert a space between `([a-z0-9])([A-Z])` then `([A-Z]+)([A-Z][a-z])`.
    let step1 = insert_boundaries(input);
    step1
        .split(|c: char| !c.is_ascii_alphanumeric())
        .map(|w| w.trim().to_lowercase())
        .filter(|w| !w.is_empty())
        .collect()
}

fn insert_boundaries(input: &str) -> String {
    let chars: Vec<char> = input.chars().collect();
    let n = chars.len();
    let mut out = String::with_capacity(n * 2);
    for i in 0..n {
        let c = chars[i];
        // Rule 1: lower/digit -> Upper  =>  insert space before Upper.
        if i > 0 {
            let prev = chars[i - 1];
            let rule1 =
                (prev.is_ascii_lowercase() || prev.is_ascii_digit()) && c.is_ascii_uppercase();
            // Rule 2: UPPER followed by Upper+lower  =>  space before the last Upper.
            let rule2 = prev.is_ascii_uppercase()
                && c.is_ascii_uppercase()
                && i + 1 < n
                && chars[i + 1].is_ascii_lowercase();
            if rule1 || rule2 {
                out.push(' ');
            }
        }
        out.push(c);
    }
    out
}

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

fn capitalize(word: &str) -> String {
    let mut chars = word.chars();
    match chars.next() {
        Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
        None => String::new(),
    }
}

/// PascalCase, e.g. "pet-list" -> "PetList".
pub fn pascal_case(input: &str) -> String {
    safe_ident(
        &split_words(input)
            .iter()
            .map(|w| capitalize(w))
            .collect::<String>(),
    )
}

const JS_RESERVED: &[&str] = &[
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "do",
    "else",
    "enum",
    "export",
    "extends",
    "false",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "in",
    "instanceof",
    "new",
    "null",
    "return",
    "super",
    "switch",
    "this",
    "throw",
    "true",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with",
    "yield",
];

/// lowerCamelCase (JS identifier / method / arg), e.g. "pet_id" -> "petId".
pub fn camel_case(input: &str) -> String {
    let words = split_words(input);
    if words.is_empty() {
        return "arg".to_string();
    }
    let mut name = words[0].clone();
    for w in &words[1..] {
        name.push_str(&capitalize(w));
    }
    let name = safe_ident(&name);
    if JS_RESERVED.contains(&name.as_str()) {
        format!("{name}_")
    } else {
        name
    }
}

const UNCOUNTABLE: &[&str] = &["data", "media", "series"];

/// Singularize one lowercase english word (openai-node resource shape).
pub fn singularize(word: &str) -> String {
    if word.len() < 3 || UNCOUNTABLE.contains(&word) {
        return word.to_string();
    }
    if word.ends_with("ies") && word.len() > 4 {
        return format!("{}y", &word[..word.len() - 3]);
    }
    if word.len() > 4
        && (word.ends_with("sses")
            || word.ends_with("xes")
            || word.ends_with("ches")
            || word.ends_with("shes")
            || word.ends_with("uses"))
    {
        return word[..word.len() - 2].to_string();
    }
    if word.ends_with("ss") || word.ends_with("us") || word.ends_with("is") {
        return word.to_string();
    }
    if let Some(stripped) = word.strip_suffix('s') {
        return stripped.to_string();
    }
    word.to_string()
}

/// PascalCase with the TRAILING word singularized ("pets" -> "Pet").
pub fn singular_pascal_case(input: &str) -> String {
    let words = split_words(input);
    if words.is_empty() {
        return String::new();
    }
    let last = words.len() - 1;
    words
        .iter()
        .enumerate()
        .map(|(i, w)| {
            if i == last {
                capitalize(&singularize(w))
            } else {
                capitalize(w)
            }
        })
        .collect()
}

/// kebab-case slug (resource file name).
pub fn slug(input: &str) -> String {
    let joined = split_words(input).join("-");
    joined
        .chars()
        .filter(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || *c == '-')
        .collect()
}

/// SCREAMING_SNAKE_CASE (env-var stems).
pub fn screaming_snake_case(input: &str) -> String {
    let joined = split_words(input).join("_").to_uppercase();
    safe_ident(
        &joined
            .chars()
            .filter(|c| c.is_ascii_uppercase() || c.is_ascii_digit() || *c == '_')
            .collect::<String>(),
    )
}

/// An npm-safe package name: kebab-case alphanumerics.
pub fn npm_package_name(input: &str) -> String {
    let joined = split_words(input).join("-");
    let s: String = joined
        .chars()
        .filter(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || *c == '-')
        .collect();
    if s.is_empty() {
        "client".to_string()
    } else {
        s
    }
}

/// Map an IR method action to an idiomatic TS method name (camelCase).
pub fn node_method_name(action: &str) -> String {
    camel_case(action)
}

fn is_bare_ident(name: &str) -> bool {
    let mut chars = name.chars();
    match chars.next() {
        Some(c) if c.is_ascii_alphabetic() || c == '_' || c == '$' => {}
        _ => return false,
    }
    chars.all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '$')
}

/// A property key: a bare identifier when safe, else a quoted string literal.
pub fn prop_key(name: &str) -> String {
    if is_bare_ident(name) {
        name.to_string()
    } else {
        json_string(name)
    }
}

/// A JSDoc block from free text, or "" when empty. Single line -> `/** text */\n`.
pub fn js_doc(text: Option<&str>) -> String {
    let raw = text.unwrap_or("").trim();
    if raw.is_empty() {
        return String::new();
    }
    let lines: Vec<&str> = raw.split('\n').collect();
    if lines.len() == 1 {
        format!("/** {} */\n", lines[0].trim())
    } else {
        let body: Vec<String> = lines
            .iter()
            .map(|l| trim_end(&format!(" * {}", l.trim())))
            .collect();
        format!("/**\n{}\n */\n", body.join("\n"))
    }
}

fn trim_end(s: &str) -> String {
    s.trim_end().to_string()
}
