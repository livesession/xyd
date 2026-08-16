//! Naming helpers — port of naming.ts.

/// Split an identifier (camel/snake/kebab/space) into lowercase words.
pub fn split_words(input: &str) -> Vec<String> {
    // replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    let chars: Vec<char> = input.chars().collect();
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
    p2.split(|c: char| c.is_whitespace() || matches!(c, '_' | '-' | '.' | '/'))
        .map(|w| w.trim().to_lowercase())
        .filter(|w| !w.is_empty())
        .collect()
}

fn upper_first(w: &str) -> String {
    let mut cs = w.chars();
    match cs.next() {
        Some(f) => f.to_uppercase().collect::<String>() + cs.as_str(),
        None => String::new(),
    }
}

/// PascalCase, e.g. "chat-completions" -> "ChatCompletions".
pub fn pascal_case(input: &str) -> String {
    split_words(input).iter().map(|w| upper_first(w)).collect()
}

const GO_KEYWORDS: [&str; 25] = [
    "break",
    "case",
    "chan",
    "const",
    "continue",
    "default",
    "defer",
    "else",
    "fallthrough",
    "for",
    "func",
    "go",
    "goto",
    "if",
    "import",
    "interface",
    "map",
    "package",
    "range",
    "return",
    "select",
    "struct",
    "switch",
    "type",
    "var",
];

/// lowerCamelCase Go var name with initialism cleanup + keyword guard.
pub fn go_var(input: &str) -> String {
    let pascal = pascal_case(input);
    if pascal.is_empty() {
        return "arg".to_string();
    }
    let mut name = {
        let mut cs = pascal.chars();
        let first = cs.next().unwrap();
        first.to_lowercase().collect::<String>() + cs.as_str()
    };
    // .replace(/Id\b/g, 'ID').replace(/Url\b/g, 'URL').replace(/Api\b/g, 'API')
    name = replace_word_boundary(&name, "Id", "ID");
    name = replace_word_boundary(&name, "Url", "URL");
    name = replace_word_boundary(&name, "Api", "API");
    if GO_KEYWORDS.contains(&name.as_str()) {
        name = format!("{name}_");
    }
    name
}

/// JS `str.replace(/<pat>\b/g, repl)` — `\b` is a word boundary (the char after
/// the match must be a non-word char `[^A-Za-z0-9_]` or end-of-string).
fn replace_word_boundary(s: &str, pat: &str, repl: &str) -> String {
    let bytes: Vec<char> = s.chars().collect();
    let pat_chars: Vec<char> = pat.chars().collect();
    let mut out = String::with_capacity(s.len());
    let mut i = 0;
    while i < bytes.len() {
        if i + pat_chars.len() <= bytes.len() && bytes[i..i + pat_chars.len()] == pat_chars[..] {
            let after = bytes.get(i + pat_chars.len());
            let is_boundary = match after {
                None => true,
                Some(c) => !(c.is_ascii_alphanumeric() || *c == '_'),
            };
            if is_boundary {
                out.push_str(repl);
                i += pat_chars.len();
                continue;
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    out
}

/// Slug for a binary / module name.
pub fn slug(input: &str) -> String {
    split_words(input)
        .join("-")
        .chars()
        .filter(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || *c == '-')
        .collect()
}

/// SCREAMING_SNAKE_CASE env-var prefix.
pub fn screaming_snake_case(input: &str) -> String {
    split_words(input)
        .join("_")
        .to_uppercase()
        .chars()
        .filter(|c| c.is_ascii_uppercase() || c.is_ascii_digit() || *c == '_')
        .collect()
}
