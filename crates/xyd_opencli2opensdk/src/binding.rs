//! Shape inference for CLI arguments/options → typed params + x-cli encodings.
//! The option heuristic mirrors `option_flag_type` in
//! xyd_opencli2rust/src/model.rs (the established OpenCLI convention: an
//! option's first ARGUMENT name is its type hint — e.g. `--port` declares
//! `arguments: [{ "name": "number" }]`).

use serde_json::Value;

use crate::model::TypeRef;
use crate::nominal::TypeRegistry;

pub struct OptShape {
    pub type_ref: TypeRef,
    pub encoding: &'static str,
    pub repeat: bool,
}

pub struct ArgShape {
    pub type_ref: TypeRef,
    pub encoding: &'static str,
    pub variadic: bool,
    pub required: bool,
}

/// Render the literal argv token for an option name: single-char canonical
/// names get one dash, everything else two (verbatim spelling — `--logLevel`).
pub fn flag_token(name: &str) -> String {
    if name.chars().count() == 1 {
        format!("-{name}")
    } else {
        format!("--{name}")
    }
}

fn accepted_values(v: &Value) -> Option<Vec<Value>> {
    let vals = v.get("acceptedValues")?.as_array()?;
    if vals.is_empty() {
        None
    } else {
        Some(vals.clone())
    }
}

/// Arity allows more than one value (absent maximum = unbounded).
fn arity_is_multi(v: &Value) -> bool {
    match v.get("arity") {
        Some(arity) if arity.is_object() => arity
            .get("maximum")
            .and_then(|m| m.as_u64())
            .map(|m| m != 1)
            .unwrap_or(true),
        _ => false,
    }
}

fn arity_minimum(v: &Value) -> u64 {
    v.get("arity")
        .and_then(|a| a.get("minimum"))
        .and_then(|m| m.as_u64())
        .unwrap_or(0)
}

/// Element type + encoding for an option's value argument.
fn option_element(
    arg0: &Value,
    context: &[String],
    registry: &mut TypeRegistry,
) -> (TypeRef, &'static str) {
    if let Some(vals) = accepted_values(arg0) {
        return (registry.register_enum(context, &vals), "string");
    }
    match arg0.get("name").and_then(|n| n.as_str()) {
        Some("integer") => (TypeRef::scalar("integer"), "integer"),
        Some("number") => (TypeRef::scalar("number"), "number"),
        Some("boolean") => (TypeRef::scalar("boolean"), "boolean"),
        Some("json") => (TypeRef::any(), "json"),
        _ => (TypeRef::scalar("string"), "string"),
    }
}

/// Infer the param type + binding encoding for a CLI option.
pub fn option_shape(opt: &Value, context: &[String], registry: &mut TypeRegistry) -> OptShape {
    let args = opt.get("arguments").and_then(|a| a.as_array());
    let arg0 = match args {
        Some(a) if !a.is_empty() => &a[0],
        _ => {
            // Value-less option: a boolean flag.
            return OptShape {
                type_ref: TypeRef::scalar("boolean"),
                encoding: "boolean",
                repeat: false,
            };
        }
    };
    let (element, encoding) = option_element(arg0, context, registry);
    if arity_is_multi(arg0) {
        OptShape {
            type_ref: TypeRef::array(element),
            encoding,
            repeat: true,
        }
    } else {
        OptShape {
            type_ref: element,
            encoding,
            repeat: false,
        }
    }
}

/// Infer the param type + binding encoding for a positional argument.
/// Positionals carry real names (not type hints), so they are strings —
/// possibly enum-constrained or variadic.
pub fn argument_shape(arg: &Value, context: &[String], registry: &mut TypeRegistry) -> ArgShape {
    let required =
        arg.get("required").and_then(|r| r.as_bool()) == Some(true) || arity_minimum(arg) >= 1;
    let element = match accepted_values(arg) {
        Some(vals) => registry.register_enum(context, &vals),
        None => TypeRef::scalar("string"),
    };
    if arity_is_multi(arg) {
        ArgShape {
            type_ref: TypeRef::array(element),
            encoding: "string",
            variadic: true,
            required,
        }
    } else {
        ArgShape {
            type_ref: element,
            encoding: "string",
            variadic: false,
            required,
        }
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
    fn flag_tokens() {
        assert_eq!(flag_token("verbose"), "--verbose");
        assert_eq!(flag_token("logLevel"), "--logLevel");
        assert_eq!(flag_token("v"), "-v");
    }

    #[test]
    fn option_inference_table() {
        let mut reg = TypeRegistry::new();
        let cases = [
            (json!({}), "boolean", "boolean"),
            (json!({"arguments": []}), "boolean", "boolean"),
            (
                json!({"arguments": [{"name": "number"}]}),
                "number",
                "number",
            ),
            (
                json!({"arguments": [{"name": "integer"}]}),
                "integer",
                "integer",
            ),
            (
                json!({"arguments": [{"name": "boolean"}]}),
                "boolean",
                "boolean",
            ),
            (
                json!({"arguments": [{"name": "string"}]}),
                "string",
                "string",
            ),
            (
                json!({"arguments": [{"name": "whatever"}]}),
                "string",
                "string",
            ),
        ];
        for (opt, scalar, encoding) in cases {
            let shape = option_shape(&opt, &ctx(&["c", "o"]), &mut reg);
            assert_eq!(shape.type_ref.scalar.as_deref(), Some(scalar));
            assert_eq!(shape.encoding, encoding);
            assert!(!shape.repeat);
        }
        let json_opt = json!({"arguments": [{"name": "json"}]});
        let shape = option_shape(&json_opt, &ctx(&["c", "o"]), &mut reg);
        assert_eq!(shape.type_ref.kind, "any");
        assert_eq!(shape.encoding, "json");
    }

    #[test]
    fn option_arity_becomes_repeat_array() {
        let mut reg = TypeRegistry::new();
        let opt = json!({"arguments": [{"name": "string", "arity": {"minimum": 1}}]});
        let shape = option_shape(&opt, &ctx(&["c", "tag"]), &mut reg);
        assert!(shape.repeat);
        assert_eq!(shape.type_ref.kind, "array");
        assert_eq!(
            shape.type_ref.items.as_ref().unwrap().scalar.as_deref(),
            Some("string")
        );
        // maximum == 1 is NOT multi
        let single =
            json!({"arguments": [{"name": "string", "arity": {"minimum": 1, "maximum": 1}}]});
        assert!(!option_shape(&single, &ctx(&["c", "o"]), &mut reg).repeat);
    }

    #[test]
    fn argument_required_from_arity_minimum() {
        let mut reg = TypeRegistry::new();
        let arg = json!({"name": "file", "arity": {"minimum": 1}});
        let shape = argument_shape(&arg, &ctx(&["c", "file"]), &mut reg);
        assert!(shape.required);
        assert!(shape.variadic);
        let plain = json!({"name": "file"});
        let shape = argument_shape(&plain, &ctx(&["c", "file"]), &mut reg);
        assert!(!shape.required);
        assert!(!shape.variadic);
    }

    #[test]
    fn accepted_values_mint_enum_refs() {
        let mut reg = TypeRegistry::new();
        let arg = json!({"name": "shell", "acceptedValues": ["zsh", "fish"]});
        let shape = argument_shape(&arg, &ctx(&["completion", "shell"]), &mut reg);
        assert_eq!(shape.type_ref.kind, "ref");
        assert_eq!(shape.type_ref.name.as_deref(), Some("CompletionShell"));
    }
}
