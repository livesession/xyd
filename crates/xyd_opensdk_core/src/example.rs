//! Language-neutral example values for the docs USAGE path.
//!
//! `generateTests` plans NEUTRAL values (`0`, `"x"`) because a test only needs
//! the right shape. A docs snippet is read by humans, so it plans REALISTIC ones
//! — `"2024-01-01T00:00:00Z"` rather than `"x"`. That is the `realistic` flag in
//! each emitter's example planner.
//!
//! Only the format→sample table lives here. It is a pure `&str -> String` with
//! no IR coupling, and it was byte-identical in the three crates that had it
//! (java, ruby, rust), so one definition removes a channel where a `uuid` sample
//! could drift between languages and produce visibly inconsistent docs.
//!
//! `realistic_literal` is deliberately NOT here: it returns each crate's own
//! `ExampleValue`, so sharing it would mean unifying that type across seven
//! emitters — the same rewrite-not-hoist trap that keeps the planners per-crate.

/// A realistic sample string for a JSON Schema `format`.
///
/// Unknown formats fall back to `hint` (the property name or `"string"`), which
/// is what makes an unformatted field render as something readable rather than
/// a placeholder.
pub fn realistic_string(fmt: &str, hint: Option<&str>) -> String {
    match fmt {
        "date-time" => "2024-01-01T00:00:00Z",
        "date" => "2024-01-01",
        "email" => "user@example.com",
        "uri" | "url" => "https://example.com",
        "uuid" => "123e4567-e89b-12d3-a456-426614174000",
        "hostname" => "example.com",
        "ipv4" => "192.0.2.1",
        _ => return hint.unwrap_or("string").to_string(),
    }
    .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn known_formats_get_their_sample() {
        assert_eq!(realistic_string("date-time", None), "2024-01-01T00:00:00Z");
        assert_eq!(realistic_string("date", None), "2024-01-01");
        assert_eq!(realistic_string("email", None), "user@example.com");
        assert_eq!(realistic_string("uri", None), "https://example.com");
        // `url` is an alias of `uri`.
        assert_eq!(realistic_string("url", None), "https://example.com");
        assert_eq!(
            realistic_string("uuid", None),
            "123e4567-e89b-12d3-a456-426614174000"
        );
        assert_eq!(realistic_string("hostname", None), "example.com");
        assert_eq!(realistic_string("ipv4", None), "192.0.2.1");
    }

    #[test]
    fn an_unknown_format_falls_back_to_the_hint() {
        assert_eq!(realistic_string("", Some("name")), "name");
        assert_eq!(realistic_string("binary", Some("file")), "file");
        // No hint at all → the generic placeholder.
        assert_eq!(realistic_string("nope", None), "string");
    }
}
