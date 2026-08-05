//! Minimal typed accessors over `serde_json::Value` for reading the OpenSDK IR,
//! plus the JS-`JSON.stringify` string-literal helper the Python emitters reuse.

use serde_json::Value;

/// A string field of an object, or None when absent / not a string.
pub fn str_field<'a>(v: &'a Value, key: &str) -> Option<&'a str> {
    v.get(key).and_then(Value::as_str)
}

/// A bool field of an object, or None when absent / not a bool.
pub fn bool_field(v: &Value, key: &str) -> Option<bool> {
    v.get(key).and_then(Value::as_bool)
}

/// An array field as a slice (empty when absent or not an array).
pub fn arr<'a>(v: &'a Value, key: &str) -> &'a [Value] {
    v.get(key)
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .unwrap_or(&[])
}

/// Render a Python string literal exactly like JS `JSON.stringify(s)`:
/// serde_json's string serialization escapes `"`, `\\` and control chars the
/// same way and leaves `/`, non-ASCII, `{`, `}` untouched — so for the
/// identifiers, paths and descriptions the IR carries it is byte-identical.
pub fn pystr(s: &str) -> String {
    Value::String(s.to_string()).to_string()
}
