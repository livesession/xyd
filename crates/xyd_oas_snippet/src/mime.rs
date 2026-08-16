//! Port of oas's `matchesMimeType` (substring matching via `indexOf > -1`).

fn matches(types: &[&str], media_type: &str) -> bool {
    types.iter().any(|t| media_type.contains(t))
}

pub fn is_form_url_encoded(media_type: &str) -> bool {
    matches(&["application/x-www-form-urlencoded"], media_type)
}

pub fn is_json(content_type: &str) -> bool {
    matches(
        &[
            "application/json",
            "application/x-json",
            "text/json",
            "text/x-json",
            "+json",
        ],
        content_type,
    )
}

pub fn is_multipart(content_type: &str) -> bool {
    matches(
        &[
            "multipart/mixed",
            "multipart/related",
            "multipart/form-data",
            "multipart/alternative",
        ],
        content_type,
    )
}

/// httpsnippet's `isMimeTypeJSON` (a slightly different list — used only by the
/// curl client's payload heuristic).
pub fn is_mime_type_json(mime_type: &str) -> bool {
    matches(
        &[
            "application/json",
            "application/x-json",
            "text/json",
            "text/x-json",
            "+json",
        ],
        mime_type,
    )
}
