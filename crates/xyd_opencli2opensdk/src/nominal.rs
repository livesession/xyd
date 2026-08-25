//! The type registry: the always-present `CommandResult` struct plus named
//! enum types minted from `acceptedValues` (structurally deduped so identical
//! value-sets share one NamedType, mirroring the HTTP converter's SymbolTable
//! dedup discipline).

use std::collections::{HashMap, HashSet};

use serde_json::Value;

use crate::jsrt::{pascal_case, stable_stringify, unique_name};
use crate::model::{EnumValue, Field, NamedType, TypeRef};

pub const COMMAND_RESULT: &str = "CommandResult";

pub struct TypeRegistry {
    types: Vec<NamedType>,
    /// stable_stringify(values) -> registered enum type name
    by_value_set: HashMap<String, String>,
    used_names: HashSet<String>,
}

impl TypeRegistry {
    pub fn new() -> Self {
        let mut used_names = HashSet::new();
        used_names.insert(COMMAND_RESULT.to_string());
        TypeRegistry {
            types: vec![command_result_type()],
            by_value_set: HashMap::new(),
            used_names,
        }
    }

    /// A `ref CommandResult` TypeRef (every method's primaryResponse).
    pub fn command_result_ref() -> TypeRef {
        TypeRef::reference(COMMAND_RESULT.to_string())
    }

    /// Register (or reuse) an enum type for an acceptedValues list. `context`
    /// is the command path plus the argument/option name; the enum is named
    /// `pascal_case(context)` with numeric suffixing on collision.
    pub fn register_enum(&mut self, context: &[String], values: &[Value]) -> TypeRef {
        let key = stable_stringify(&Value::Array(values.to_vec()));
        if let Some(existing) = self.by_value_set.get(&key) {
            return TypeRef::reference(existing.clone());
        }
        let base = pascal_case(&context.join(" "));
        let base = if base.is_empty() {
            "Enum".to_string()
        } else {
            base
        };
        let name = unique_name(&base, &mut self.used_names);
        self.types.push(NamedType {
            name: name.clone(),
            kind: "enum".to_string(),
            base: Some("string".to_string()),
            values: Some(
                values
                    .iter()
                    .map(|v| EnumValue { value: v.clone() })
                    .collect(),
            ),
            fields: None,
            description: None,
        });
        self.by_value_set.insert(key, name.clone());
        TypeRef::reference(name)
    }

    pub fn emit(self) -> Vec<NamedType> {
        self.types
    }
}

fn command_result_type() -> NamedType {
    let field = |name: &str, scalar: &str| Field {
        name: name.to_string(),
        field_type: TypeRef::scalar(scalar),
        required: true,
        description: None,
    };
    NamedType {
        name: COMMAND_RESULT.to_string(),
        kind: "struct".to_string(),
        base: None,
        values: None,
        fields: Some(vec![
            field("stdout", "string"),
            field("stderr", "string"),
            field("exitCode", "integer"),
        ]),
        description: Some(
            "The result of one CLI invocation. json() parses stdout as JSON.".to_string(),
        ),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn ctx(parts: &[&str]) -> Vec<String> {
        parts.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn command_result_is_always_first() {
        let reg = TypeRegistry::new();
        let types = reg.emit();
        assert_eq!(types[0].name, COMMAND_RESULT);
        assert_eq!(types[0].kind, "struct");
    }

    #[test]
    fn structural_dedup_reuses_one_type() {
        let mut reg = TypeRegistry::new();
        let vals = vec![json!("a"), json!("b")];
        let r1 = reg.register_enum(&ctx(&["one", "shell"]), &vals);
        let r2 = reg.register_enum(&ctx(&["two", "shell"]), &vals);
        assert_eq!(r1.name.as_deref(), Some("OneShell"));
        assert_eq!(r2.name.as_deref(), Some("OneShell")); // reused
        assert_eq!(reg.emit().len(), 2); // CommandResult + one enum
    }

    #[test]
    fn collision_gets_numeric_suffix() {
        let mut reg = TypeRegistry::new();
        let r1 = reg.register_enum(&ctx(&["shell"]), &[json!("a")]);
        let r2 = reg.register_enum(&ctx(&["shell"]), &[json!("b")]);
        assert_eq!(r1.name.as_deref(), Some("Shell"));
        assert_eq!(r2.name.as_deref(), Some("Shell2"));
    }

    #[test]
    fn user_command_result_name_is_suffixed() {
        let mut reg = TypeRegistry::new();
        let r = reg.register_enum(&ctx(&["command", "result"]), &[json!("x")]);
        assert_eq!(r.name.as_deref(), Some("CommandResult2"));
    }
}
