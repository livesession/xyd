//! Ports of `utils.ts` helpers + the JS runtime functions the converter leans
//! on (`encodeURIComponent`, `new URL()` pathname joining, github-slugger).

use xyd_uniform::ReferenceType;

/// `httpMethodToUniformMethod`.
pub fn http_method_to_reference_type(method: &str) -> Option<ReferenceType> {
    Some(match method {
        "get" => ReferenceType::RestHttpGet,
        "put" => ReferenceType::RestHttpPut,
        "patch" => ReferenceType::RestHttpPatch,
        "post" => ReferenceType::RestHttpPost,
        "delete" => ReferenceType::RestHttpDelete,
        "options" => ReferenceType::RestHttpOptions,
        "head" => ReferenceType::RestHttpHead,
        "trace" => ReferenceType::RestHttpTrace,
        _ => return None,
    })
}

/// `cleanPath` — strip `{}` from path parameters.
pub fn clean_path(http_path: &str) -> String {
    http_path.replace(['{', '}'], "")
}

/// JS `encodeURIComponent`: everything percent-encoded except
/// A-Z a-z 0-9 - _ . ! ~ * ' ( ).
pub fn encode_uri_component(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for b in s.bytes() {
        match b {
            b'A'..=b'Z'
            | b'a'..=b'z'
            | b'0'..=b'9'
            | b'-'
            | b'_'
            | b'.'
            | b'!'
            | b'~'
            | b'*'
            | b'\''
            | b'('
            | b')' => out.push(b as char),
            _ => out.push_str(&format!("%{b:02X}")),
        }
    }
    out
}

/// The TS fullPath construction:
/// `const u = new URL(server); u.pathname = path.join(u.pathname, endpointPath);
///  decodeURIComponent(u.toString())`.
/// Minimal http(s) URL splitting — enough for real server URLs; returns None on
/// unparseable input (the TS would throw; callers guard with try-like flow).
pub fn join_url_pathname(server: &str, endpoint_path: &str) -> Option<String> {
    let scheme_end = server.find("://")?;
    let rest = &server[scheme_end + 3..];
    let (authority, base_path) = match rest.find('/') {
        Some(i) => (&rest[..i], &rest[i..]),
        None => (rest, ""),
    };
    if authority.is_empty() {
        return None;
    }
    // node path.join semantics on the two path segments.
    let joined = join_paths(base_path, endpoint_path);
    Some(format!(
        "{}://{}{}",
        &server[..scheme_end],
        authority,
        joined
    ))
}

fn join_paths(a: &str, b: &str) -> String {
    let a = if a.is_empty() { "/" } else { a };
    let mut out = String::from(a.trim_end_matches('/'));
    let b = b.trim_start_matches('/');
    out.push('/');
    out.push_str(b);
    if out.is_empty() {
        out.push('/');
    }
    out
}

/// github-slugger's `slug()` (the subset real summaries hit): lowercase,
/// spaces → dashes, strip characters outside [\w-] (unicode letters kept).
pub fn slug(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for ch in s.to_lowercase().chars() {
        if ch == ' ' {
            out.push('-');
        } else if ch.is_alphanumeric() || ch == '-' || ch == '_' {
            out.push(ch);
        }
        // other punctuation: dropped (github-slugger removes it)
    }
    out
}

/// JS `Object.keys` ordering: canonical array-index-like keys ascending FIRST,
/// then the remaining keys in insertion order (drives response-code and
/// enum-key ordering in the oracle).
pub fn js_object_keys<'a>(map: &'a serde_json::Map<String, serde_json::Value>) -> Vec<&'a String> {
    let mut numeric: Vec<(&String, u32)> = Vec::new();
    let mut rest: Vec<&String> = Vec::new();
    for k in map.keys() {
        match as_array_index(k) {
            Some(n) => numeric.push((k, n)),
            None => rest.push(k),
        }
    }
    numeric.sort_by_key(|(_, n)| *n);
    numeric.into_iter().map(|(k, _)| k).chain(rest).collect()
}

fn as_array_index(k: &str) -> Option<u32> {
    if k.is_empty() || (k.len() > 1 && k.starts_with('0')) {
        return None;
    }
    k.parse::<u32>().ok().filter(|n| *n < u32::MAX)
}
