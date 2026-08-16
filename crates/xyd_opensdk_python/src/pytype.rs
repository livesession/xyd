//! IR `TypeRef` -> Python type expression, ported from `pytype.ts`.

use serde_json::Value;

use crate::naming::pascal_case;
use crate::val::str_field;

/// Records which `typing` names a rendered file uses so the generated import
/// line stays minimal (mirrors PyUses; the emit order is fixed).
#[derive(Default)]
pub struct PyUses {
    any: bool,
    binary_io: bool,
    optional: bool,
    union: bool,
}

impl PyUses {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn use_name(&mut self, name: &str) {
        match name {
            "Any" => self.any = true,
            "BinaryIO" => self.binary_io = true,
            "Optional" => self.optional = true,
            "Union" => self.union = true,
            _ => {}
        }
    }

    /// The `from typing import ...` line, or None when nothing is used.
    pub fn typing_import(&self) -> Option<String> {
        let mut names: Vec<&str> = Vec::new();
        if self.any {
            names.push("Any");
        }
        if self.binary_io {
            names.push("BinaryIO");
        }
        if self.optional {
            names.push("Optional");
        }
        if self.union {
            names.push("Union");
        }
        if names.is_empty() {
            None
        } else {
            Some(format!("from typing import {}", names.join(", ")))
        }
    }
}

/// Map an IR TypeRef to a Python type expression (PEP 585 builtin generics).
pub fn py_type(ref_: Option<&Value>, uses: &mut PyUses) -> String {
    let r = match ref_ {
        Some(r) => r,
        None => return any_type(uses),
    };
    let base = py_base(r, uses);
    if r.get("nullable").and_then(Value::as_bool) == Some(true) {
        optionalize(&base, uses)
    } else {
        base
    }
}

fn py_base(r: &Value, uses: &mut PyUses) -> String {
    match str_field(r, "kind").unwrap_or("") {
        "scalar" => py_scalar(str_field(r, "scalar"), str_field(r, "format"), uses),
        "ref" => match str_field(r, "name") {
            Some(name) if !name.is_empty() => pascal_case(name),
            _ => any_type(uses),
        },
        "array" => format!("list[{}]", py_type(r.get("items"), uses)),
        "map" => format!("dict[str, {}]", py_type(r.get("values"), uses)),
        _ => any_type(uses),
    }
}

fn py_scalar(scalar: Option<&str>, format: Option<&str>, uses: &mut PyUses) -> String {
    match scalar {
        Some("string") => {
            if format == Some("binary") {
                // Upload fields accept raw bytes or an open file-like object.
                uses.use_name("Union");
                uses.use_name("BinaryIO");
                "Union[bytes, BinaryIO]".to_string()
            } else {
                "str".to_string()
            }
        }
        Some("integer") => "int".to_string(),
        Some("number") => "float".to_string(),
        Some("boolean") => "bool".to_string(),
        _ => any_type(uses),
    }
}

fn any_type(uses: &mut PyUses) -> String {
    uses.use_name("Any");
    "Any".to_string()
}

/// Wrap a type in Optional[...] unless it already is.
pub fn optionalize(t: &str, uses: &mut PyUses) -> String {
    if t.starts_with("Optional[") {
        return t.to_string();
    }
    uses.use_name("Optional");
    format!("Optional[{t}]")
}

/// Type expressions `decode()` can't refine — methods return the raw JSON as-is.
pub fn is_passthrough_type(t: &str) -> bool {
    matches!(t, "Any" | "str" | "int" | "float" | "bool")
}
