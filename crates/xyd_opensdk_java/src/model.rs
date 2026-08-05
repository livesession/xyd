//! model.ts — one .java per named type: struct POJO, enum, mapped-union holder.

use serde_json::Value;

use crate::ir::{arr_field, bool_field, str_field};
use crate::javatype::{const_literal, is_const_field, java_decode, java_type, union_mapping};
use crate::javawriter::{java_doc, java_file};
use crate::jsrt::{camel_case, json_str, pascal_case, screaming_snake_case};
use crate::project::JavaCtx;

pub struct GenFile {
    pub path: String,
    pub content: String,
}

pub fn render_type_files(types: &[Value], ctx: &JavaCtx) -> Vec<GenFile> {
    let mut files = Vec::new();
    for ty in types {
        match str_field(ty, "kind") {
            Some("struct") => files.push(struct_file(ty, ctx)),
            Some("enum") => files.push(enum_file(ty, ctx)),
            Some("union") if union_mapping(ty).is_some() => files.push(union_file(ty, ctx)),
            _ => {}
        }
    }
    files
}

fn union_file(ty: &Value, ctx: &JavaCtx) -> GenFile {
    let name = pascal_case(str_field(ty, "name").unwrap_or(""));
    let (property, mapping) = union_mapping(ty).unwrap();
    let mut entries = mapping;
    entries.sort_by(|a, b| a.0.cmp(&b.0));
    let cases = entries
        .iter()
        .map(|(value, variant)| {
            format!(
                "    if ({}.equals(discriminator)) {{\n      return {}.fromJson(json);\n    }}",
                json_str(value),
                pascal_case(variant)
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    let default_doc = format!(
        "Decode helper for the {name} union, selecting the concrete variant by its {} discriminator.",
        json_str(&property)
    );
    let doc = java_doc(
        Some(str_field(ty, "description").unwrap_or(&default_doc)),
        "",
    );
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    let body = format!(
        "{head}public final class {name} {{\n\
         \x20 private {name}() {{\n  }}\n\n\
         \x20 /**\n\
         \x20  * Decode JSON into the concrete {name} variant selected by the {prop}\n\
         \x20  * discriminator. An unknown or absent discriminator keeps the raw parsed value.\n\
         \x20  */\n\
         \x20 public static Object fromJson(Object json) {{\n\
         \x20   if (!(json instanceof Map)) {{\n      return json;\n    }}\n\
         \x20   Object discriminator = ((Map<?, ?>) json).get({prop});\n\
         {cases}\n\
         \x20   return json;\n\
         \x20 }}\n}}",
        prop = json_str(&property),
    );
    GenFile {
        path: format!("{}{name}.java", ctx.src_dir),
        content: java_file(&ctx.full_package, &["java.util.Map".to_string()], &body),
    }
}

fn struct_file(ty: &Value, ctx: &JavaCtx) -> GenFile {
    let name = pascal_case(str_field(ty, "name").unwrap_or(""));
    let fields = arr_field(ty, "fields");
    let field_types: Vec<String> = fields
        .iter()
        .map(|f| java_type(f.get("type"), &ctx.types))
        .collect();

    let mut imports = vec![
        "java.util.LinkedHashMap".to_string(),
        "java.util.Map".to_string(),
    ];
    if field_types.iter().any(|t| t.contains("List<")) {
        imports.push("java.util.List".to_string());
    }

    let doc = java_doc(str_field(ty, "description"), "");
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };

    let fname = |f: &Value| camel_case(str_field(f, "name").unwrap_or(""));

    let body = if fields.is_empty() {
        let parts = [empty_from_json(&name), empty_to_json_map()].join("\n\n");
        format!("{head}public final class {name} implements Json.JsonSerializable {{\n{parts}\n}}")
    } else {
        let field_decls = fields
            .iter()
            .enumerate()
            .map(|(i, f)| format!("  private {} {};", field_types[i], fname(f)))
            .collect::<Vec<_>>()
            .join("\n");
        let accessors = fields
            .iter()
            .enumerate()
            .map(|(i, f)| {
                format!(
                    "  public {} {}() {{\n    return {};\n  }}",
                    field_types[i],
                    fname(f),
                    fname(f)
                )
            })
            .collect::<Vec<_>>()
            .join("\n\n");
        let parts = [
            field_decls,
            accessors,
            struct_from_json(&name, &fields, ctx),
            struct_to_json_map(&fields),
        ]
        .join("\n\n");
        format!("{head}public final class {name} implements Json.JsonSerializable {{\n{parts}\n}}")
    };

    GenFile {
        path: format!("{}{name}.java", ctx.src_dir),
        content: java_file(&ctx.full_package, &imports, &body),
    }
}

fn struct_from_json(name: &str, fields: &[&Value], ctx: &JavaCtx) -> String {
    let assigns = fields
        .iter()
        .map(|f| {
            let fn_ = camel_case(str_field(f, "name").unwrap_or(""));
            let key = json_str(str_field(f, "name").unwrap_or(""));
            format!(
                "    out.{fn_} = {};",
                java_decode(f.get("type"), &format!("map.get({key})"), &ctx.types, 0)
            )
        })
        .collect::<Vec<_>>()
        .join("\n");
    format!(
        "  public static {name} fromJson(Object json) {{\n\
         \x20   if (json == null) {{\n      return null;\n    }}\n\
         \x20   @SuppressWarnings(\"unchecked\")\n\
         \x20   Map<String, Object> map = (Map<String, Object>) json;\n\
         \x20   {name} out = new {name}();\n\
         {assigns}\n\
         \x20   return out;\n\
         \x20 }}"
    )
}

fn struct_to_json_map(fields: &[&Value]) -> String {
    let puts = fields
        .iter()
        .map(|f| {
            let member = camel_case(str_field(f, "name").unwrap_or(""));
            let key = json_str(str_field(f, "name").unwrap_or(""));
            if is_const_field(f) {
                let cval = f
                    .get("type")
                    .and_then(|t| t.get("const"))
                    .cloned()
                    .unwrap_or(Value::Null);
                format!(
                    "    map.put({key}, {member} != null ? {member} : {});",
                    const_literal(&cval)
                )
            } else if bool_field(f, "required") {
                format!("    map.put({key}, {member});")
            } else {
                format!("    if ({member} != null) {{\n      map.put({key}, {member});\n    }}")
            }
        })
        .collect::<Vec<_>>()
        .join("\n");
    format!(
        "  @Override\n\
         \x20 public Map<String, Object> toJsonMap() {{\n\
         \x20   Map<String, Object> map = new LinkedHashMap<>();\n\
         {puts}\n\
         \x20   return map;\n\
         \x20 }}"
    )
}

fn empty_from_json(name: &str) -> String {
    format!("  public static {name} fromJson(Object json) {{\n    return json == null ? null : new {name}();\n  }}")
}

fn empty_to_json_map() -> String {
    "  @Override\n  public Map<String, Object> toJsonMap() {\n    return new LinkedHashMap<>();\n  }".to_string()
}

fn enum_file(ty: &Value, ctx: &JavaCtx) -> GenFile {
    let name = pascal_case(str_field(ty, "name").unwrap_or(""));
    let is_int = str_field(ty, "base") == Some("integer");
    let value_type = if is_int { "long" } else { "String" };
    let values = arr_field(ty, "values");

    let doc = java_doc(str_field(ty, "description"), "");
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };

    let members = if values.is_empty() {
        "  ;".to_string()
    } else {
        format!(
            "{};",
            values
                .iter()
                .map(|v| format!(
                    "  {}({})",
                    enum_member(v),
                    enum_literal(v.get("value").unwrap_or(&Value::Null), is_int)
                ))
                .collect::<Vec<_>>()
                .join(",\n")
        )
    };

    let equals_expr = if is_int {
        "item.value == value"
    } else {
        "item.value.equals(value)"
    };
    let coerce = if is_int {
        "Json.asLong(json)"
    } else {
        "Json.asString(json)"
    };

    let body = format!(
        "{head}public enum {name} implements Json.JsonEnum {{\n\
         {members}\n\n\
         \x20 private final {value_type} value;\n\n\
         \x20 {name}({value_type} value) {{\n    this.value = value;\n  }}\n\n\
         \x20 public {value_type} value() {{\n    return value;\n  }}\n\n\
         \x20 @Override\n  public Object jsonValue() {{\n    return value;\n  }}\n\n\
         \x20 public static {name} fromValue({value_type} value) {{\n\
         \x20   for ({name} item : values()) {{\n\
         \x20     if ({equals_expr}) {{\n        return item;\n      }}\n    }}\n\
         \x20   throw new IllegalArgumentException(\"unknown {name} value: \" + value);\n\
         \x20 }}\n\n\
         \x20 public static {name} fromJson(Object json) {{\n\
         \x20   return json == null ? null : fromValue({coerce});\n\
         \x20 }}\n}}"
    );

    GenFile {
        path: format!("{}{name}.java", ctx.src_dir),
        content: java_file(&ctx.full_package, &[], &body),
    }
}

fn enum_member(value: &Value) -> String {
    let src = value
        .get("name")
        .and_then(|n| n.as_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| match value.get("value") {
            Some(Value::String(s)) => s.clone(),
            Some(v) => v.to_string(),
            None => "null".to_string(),
        });
    let m = screaming_snake_case(&src);
    if m.is_empty() {
        "VALUE".to_string()
    } else {
        m
    }
}

fn enum_literal(value: &Value, is_int: bool) -> String {
    if is_int {
        match value {
            Value::String(s) => s.clone(),
            v => v.to_string(),
        }
    } else {
        let s = match value {
            Value::String(s) => s.clone(),
            Value::Null => "null".to_string(),
            v => v.to_string(),
        };
        json_str(&s)
    }
}
