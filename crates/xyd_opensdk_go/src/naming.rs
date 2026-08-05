//! Go naming — exact port of packages/xyd-opensdk-go/src/naming.ts.

const INITIALISMS: &[&str] = &[
    "acl", "api", "ascii", "cpu", "css", "dns", "eof", "guid", "html", "http", "https", "id", "ip",
    "json", "lhs", "os", "qps", "ram", "rhs", "rpc", "sdk", "sla", "smtp", "sql", "ssh", "tcp",
    "tls", "ttl", "udp", "ui", "uid", "uuid", "uri", "url", "utf8", "vm", "xml", "xmpp",
];

const UNCOUNTABLE: &[&str] = &["data", "media", "series"];

const GO_KEYWORDS: &[&str] = &[
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

fn is_initialism(w: &str) -> bool {
    INITIALISMS.contains(&w)
}

/// splitWords: camelCase + ACRONYM boundaries, split on ANY non-alphanumeric,
/// lowercased.
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

fn capitalize_word(word: &str) -> String {
    if is_initialism(word) {
        return word.to_uppercase();
    }
    let mut cs = word.chars();
    match cs.next() {
        Some(f) => f.to_uppercase().collect::<String>() + cs.as_str(),
        None => String::new(),
    }
}

pub fn pascal_case(input: &str) -> String {
    split_words(input)
        .iter()
        .map(|w| capitalize_word(w))
        .collect()
}

pub fn singularize(word: &str) -> String {
    if word.chars().count() < 3 || UNCOUNTABLE.contains(&word) {
        return word.to_string();
    }
    if word.ends_with("ies") && word.chars().count() > 4 {
        return format!("{}y", &word[..word.len() - 3]);
    }
    // (?:sses|xes|ches|shes|uses)$ and len > 4 → drop 2
    for suf in ["sses", "xes", "ches", "shes", "uses"] {
        if word.ends_with(suf) && word.chars().count() > 4 {
            return word[..word.len() - 2].to_string();
        }
    }
    // keep ss/us/is
    for suf in ["ss", "us", "is"] {
        if word.ends_with(suf) {
            return word.to_string();
        }
    }
    if let Some(stripped) = word.strip_suffix('s') {
        return stripped.to_string();
    }
    word.to_string()
}

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
            let word = if i == last { singularize(w) } else { w.clone() };
            capitalize_word(&word)
        })
        .collect()
}

pub fn go_var(input: &str) -> String {
    let words = split_words(input);
    if words.is_empty() {
        return "arg".to_string();
    }
    let first = &words[0];
    let head = if is_initialism(first) {
        first.clone()
    } else {
        let mut cs = first.chars();
        match cs.next() {
            Some(f) => f.to_lowercase().collect::<String>() + cs.as_str(),
            None => String::new(),
        }
    };
    let mut name = head
        + &words[1..]
            .iter()
            .map(|w| capitalize_word(w))
            .collect::<String>();
    if GO_KEYWORDS.contains(&name.as_str()) {
        name = format!("{name}_");
    }
    name
}

pub fn go_package_name(input: &str) -> String {
    let joined: String = split_words(input).join("");
    let clean: String = joined
        .chars()
        .filter(|c| c.is_ascii_lowercase() || c.is_ascii_digit())
        .collect();
    if clean.is_empty() {
        "client".to_string()
    } else {
        clean
    }
}

/// Part of the faithful naming API (used by the deferred publish/runtime path).
#[allow(dead_code)]
pub fn screaming_snake_case(input: &str) -> String {
    split_words(input)
        .join("_")
        .to_uppercase()
        .chars()
        .filter(|c| c.is_ascii_uppercase() || c.is_ascii_digit() || *c == '_')
        .collect()
}

pub fn slug(input: &str) -> String {
    split_words(input)
        .join("-")
        .chars()
        .filter(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || *c == '-')
        .collect()
}

pub fn go_method_name(action: &str) -> String {
    match action {
        "create" => "New".to_string(),
        "retrieve" => "Get".to_string(),
        _ => pascal_case(action),
    }
}

/// JS `JSON.stringify(s)` for a string — Go string literals use the same
/// escaping for the cases here (quotes, backslashes, control chars).
pub fn json_string(s: &str) -> String {
    serde_json::to_string(s).unwrap()
}
