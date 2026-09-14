//! js-yaml's implicit-type `resolve` predicates, ported verbatim.
//!
//! The dumper calls these (`testImplicitResolving`) to decide whether a plain scalar
//! would be re-typed on the way back in — which is what forces `'1.0'`, `'true'` and
//! `'null'` to be quoted. DEFAULT_SCHEMA's implicit list, in order:
//! `null, bool, int, float, timestamp, merge`.

/// `testImplicitResolving(state, str)`.
pub fn resolves_implicitly(s: &str) -> bool {
    is_null(s) || is_bool(s) || is_int(s) || is_float(s) || is_timestamp(s) || s == "<<"
}

/// `type/null.js` — note the empty string is NOT matched (js-yaml handles it in the loader).
fn is_null(s: &str) -> bool {
    s == "~" || s == "null" || s == "Null" || s == "NULL"
}

/// `type/bool.js`
fn is_bool(s: &str) -> bool {
    matches!(s, "true" | "True" | "TRUE" | "false" | "False" | "FALSE")
}

/// `type/int.js` `resolveYamlInteger`.
fn is_int(s: &str) -> bool {
    let data: Vec<char> = s.chars().collect();
    let max = data.len();
    if max == 0 {
        return false;
    }
    let mut index = 0usize;
    let mut has_digits = false;
    let mut ch = data[index];

    if ch == '-' || ch == '+' {
        index += 1;
        if index >= max {
            return false; // JS: data[index] is undefined; every later compare fails
        }
        ch = data[index];
    }

    if ch == '0' {
        if index + 1 == max {
            return true;
        }
        index += 1;
        ch = data[index];

        let radix = match ch {
            'b' => Some(2u32),
            'x' => Some(16),
            'o' => Some(8),
            _ => None,
        };
        if let Some(radix) = radix {
            index += 1;
            let mut last = ch;
            while index < max {
                last = data[index];
                index += 1;
                if last == '_' {
                    continue;
                }
                let ok = match radix {
                    2 => last == '0' || last == '1',
                    8 => ('0'..='7').contains(&last),
                    _ => last.is_ascii_hexdigit(),
                };
                if !ok {
                    return false;
                }
                has_digits = true;
            }
            return has_digits && last != '_';
        }
    }

    if ch == '_' {
        return false;
    }

    let mut last = ch;
    while index < max {
        last = data[index];
        index += 1;
        if last == '_' {
            continue;
        }
        if !last.is_ascii_digit() {
            return false;
        }
        has_digits = true;
    }

    has_digits && last != '_'
}

/// `type/float.js` `YAML_FLOAT_PATTERN`, hand-rolled (no regex dependency).
///
/// ```text
/// ^(?:[-+]?(?:[0-9][0-9_]*)(?:\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?
///   |\.[0-9_]+(?:[eE][-+]?[0-9]+)?
///   |[-+]?\.(?:inf|Inf|INF)
///   |\.(?:nan|NaN|NAN))$
/// ```
fn is_float(s: &str) -> bool {
    if s.is_empty() || s.ends_with('_') {
        return false;
    }
    let c: Vec<char> = s.chars().collect();
    let mut i = 0usize;

    // `[-+]?\.(?:inf|Inf|INF)` and `\.(?:nan|NaN|NAN)`
    let unsigned = s.strip_prefix(['-', '+']).unwrap_or(s);
    if matches!(unsigned, ".inf" | ".Inf" | ".INF") {
        return true;
    }
    if matches!(s, ".nan" | ".NaN" | ".NAN") {
        return true;
    }

    let signed = matches!(c.first(), Some('-') | Some('+'));
    if signed {
        i = 1;
    }

    let digits_us = |c: &[char], i: &mut usize| -> usize {
        let start = *i;
        while *i < c.len() && (c[*i].is_ascii_digit() || c[*i] == '_') {
            *i += 1;
        }
        *i - start
    };

    if i < c.len() && c[i] == '.' && !signed {
        // `\.[0-9_]+(?:[eE][-+]?[0-9]+)?`
        i += 1;
        if digits_us(&c, &mut i) == 0 {
            return false;
        }
    } else {
        // `[-+]?(?:[0-9][0-9_]*)(?:\.[0-9_]*)?(?:[eE]...)?`
        if i >= c.len() || !c[i].is_ascii_digit() {
            return false;
        }
        digits_us(&c, &mut i);
        if i < c.len() && c[i] == '.' {
            i += 1;
            digits_us(&c, &mut i);
        }
    }

    if i < c.len() && (c[i] == 'e' || c[i] == 'E') {
        i += 1;
        if i < c.len() && (c[i] == '-' || c[i] == '+') {
            i += 1;
        }
        let start = i;
        while i < c.len() && c[i].is_ascii_digit() {
            i += 1;
        }
        if i == start {
            return false;
        }
    }

    i == c.len()
}

/// `type/timestamp.js` — `YAML_DATE_REGEXP` / `YAML_TIMESTAMP_REGEXP`.
fn is_timestamp(s: &str) -> bool {
    is_yaml_date(s) || is_yaml_datetime(s)
}

/// `^(\d{4})-(\d{2})-(\d{2})$`
fn is_yaml_date(s: &str) -> bool {
    let b = s.as_bytes();
    b.len() == 10
        && b[..4].iter().all(u8::is_ascii_digit)
        && b[4] == b'-'
        && b[5..7].iter().all(u8::is_ascii_digit)
        && b[7] == b'-'
        && b[8..10].iter().all(u8::is_ascii_digit)
}

/// `^(\d{4})-(\d\d?)-(\d\d?)(?:[Tt]|[ \t]+)(\d\d?):(\d\d):(\d\d)(?:\.(\d*))?(?:[ \t]*(Z|([-+])(\d\d?)(?::(\d\d))?))?$`
fn is_yaml_datetime(s: &str) -> bool {
    let c: Vec<char> = s.chars().collect();
    let mut i = 0usize;
    let digits = |c: &[char], i: &mut usize, min: usize, max: usize| -> bool {
        let start = *i;
        while *i < c.len() && *i - start < max && c[*i].is_ascii_digit() {
            *i += 1;
        }
        *i - start >= min
    };
    let lit = |c: &[char], i: &mut usize, ch: char| -> bool {
        if *i < c.len() && c[*i] == ch {
            *i += 1;
            true
        } else {
            false
        }
    };

    if !digits(&c, &mut i, 4, 4) || !lit(&c, &mut i, '-') {
        return false;
    }
    if !digits(&c, &mut i, 1, 2) || !lit(&c, &mut i, '-') {
        return false;
    }
    if !digits(&c, &mut i, 1, 2) {
        return false;
    }
    // (?:[Tt]|[ \t]+)
    if i < c.len() && (c[i] == 'T' || c[i] == 't') {
        i += 1;
    } else {
        let start = i;
        while i < c.len() && (c[i] == ' ' || c[i] == '\t') {
            i += 1;
        }
        if i == start {
            return false;
        }
    }
    if !digits(&c, &mut i, 1, 2) || !lit(&c, &mut i, ':') {
        return false;
    }
    if !digits(&c, &mut i, 2, 2) || !lit(&c, &mut i, ':') {
        return false;
    }
    if !digits(&c, &mut i, 2, 2) {
        return false;
    }
    if lit(&c, &mut i, '.') {
        digits(&c, &mut i, 0, usize::MAX);
    }
    // (?:[ \t]*(Z|([-+])(\d\d?)(?::(\d\d))?))?
    let save = i;
    while i < c.len() && (c[i] == ' ' || c[i] == '\t') {
        i += 1;
    }
    if i < c.len() {
        if c[i] == 'Z' {
            i += 1;
        } else if c[i] == '-' || c[i] == '+' {
            i += 1;
            if !digits(&c, &mut i, 1, 2) {
                return false;
            }
            if lit(&c, &mut i, ':') && !digits(&c, &mut i, 2, 2) {
                return false;
            }
        } else {
            i = save;
        }
    } else {
        i = save;
    }

    i == c.len()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matches_js_yaml_resolvers() {
        for s in [
            "~",
            "null",
            "Null",
            "NULL",
            "true",
            "False",
            "0",
            "-0",
            "17",
            "0x1A",
            "0o17",
            "0b101",
            "1_000",
            "1.0",
            ".5",
            "-1.5e-9",
            ".inf",
            "-.inf",
            ".nan",
            "2020-01-02",
            "2020-01-02T03:04:05Z",
            "2020-1-2 03:04:05.123 -07:00",
            "<<",
        ] {
            assert!(
                resolves_implicitly(s),
                "expected {s:?} to resolve implicitly"
            );
        }
        for s in [
            "",
            "yes",
            "on",
            "off",
            "n",
            "hello",
            "1.0.0",
            "3.0.3",
            "2020-01-02x",
            "1_",
            "_1",
            "0x",
            "0b2",
            "0o8",
            "café",
            "- leading",
            "#hash",
            "a: b",
            "it's here",
            "2020-01-002",
        ] {
            assert!(
                !resolves_implicitly(s),
                "expected {s:?} NOT to resolve implicitly"
            );
        }
    }
}
