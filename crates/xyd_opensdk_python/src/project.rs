//! Pure per-file renderers for `pyproject.toml`, `models.py` and `_client.py`,
//! plus option resolution — ported from `project.ts` (the type-reference /
//! docs-only renderers are out of the generated-file-map scope).

use serde_json::Value;

use crate::naming::{pascal_case, py_module_name, screaming_snake_case, snake_case};
use crate::pytype::{optionalize, py_type, PyUses};
use crate::val::{arr, bool_field, pystr, str_field};

/// The resolved package name, credential env var, and base URL (mirrors
/// `resolvePythonOptions`: `baseURL ?? servers[0] ?? ''`).
pub struct ResolvedOptions {
    pub pkg: String,
    pub env_var: String,
    pub base_url: String,
}

pub fn resolve_options(spec: &Value) -> ResolvedOptions {
    let title = spec
        .get("info")
        .and_then(|i| str_field(i, "title"))
        .unwrap_or("");
    let pkg = py_module_name(title);
    let env_var = spec
        .get("security")
        .and_then(Value::as_array)
        .and_then(|secs| secs.iter().find_map(|s| str_field(s, "envVar")))
        .map(str::to_string)
        .unwrap_or_else(|| format!("{}_API_KEY", screaming_snake_case(&pkg)));
    let base_url = spec
        .get("servers")
        .and_then(Value::as_array)
        .and_then(|s| s.first())
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    ResolvedOptions {
        pkg,
        env_var,
        base_url,
    }
}

// ---- pyproject.toml ------------------------------------------------------

fn non_empty(v: Option<&str>) -> Option<&str> {
    v.filter(|s| !s.is_empty())
}

pub fn pyproject(pkg: &str, spec: &Value) -> String {
    let info = spec.get("info").cloned().unwrap_or(Value::Null);
    let mut lines: Vec<String> = vec![
        "[build-system]".into(),
        "requires = [\"setuptools>=61\"]".into(),
        "build-backend = \"setuptools.build_meta\"".into(),
        String::new(),
        "[project]".into(),
        format!("name = {}", pystr(&pkg.replace('_', "-"))),
        format!(
            "version = {}",
            pystr(non_empty(str_field(&info, "version")).unwrap_or("0.0.0"))
        ),
    ];
    if let Some(desc) = non_empty(str_field(&info, "description")) {
        lines.push(format!("description = {}", pystr(desc)));
    }
    lines.push("requires-python = \">=3.9\"".into());
    if let Some(name) = info
        .get("contact")
        .and_then(|c| non_empty(str_field(c, "name")))
    {
        lines.push(format!("authors = [{{ name = {} }}]", pystr(name)));
    }
    if let Some(id) = info
        .get("license")
        .and_then(|l| non_empty(str_field(l, "identifier")))
    {
        lines.push(format!("license = {{ text = {} }}", pystr(id)));
    }
    let mut urls: Vec<String> = Vec::new();
    if let Some(h) = non_empty(str_field(&info, "homepage")) {
        urls.push(format!("Homepage = {}", pystr(h)));
    }
    if let Some(r) = non_empty(str_field(&info, "repository")) {
        urls.push(format!("Repository = {}", pystr(r)));
    }
    if !urls.is_empty() {
        lines.push(String::new());
        lines.push("[project.urls]".into());
        lines.extend(urls);
    }
    lines.push(String::new());
    lines.push("[tool.setuptools.packages.find]".into());
    lines.push(format!("include = [{}]", pystr(pkg)));
    format!("{}\n", lines.join("\n"))
}

// ---- models.py -----------------------------------------------------------

struct ModelsCtx {
    uses: PyUses,
    needs_field: bool,
}

pub fn models_py(spec: &Value) -> String {
    let mut ctx = ModelsCtx {
        uses: PyUses::new(),
        needs_field: false,
    };
    let types = arr(spec, "types");
    let is_alias_kind = |k: &str| k == "alias" || k == "union";
    // Ordering: structs/enums (lazy annotations => any order) first, then the
    // alias/union group topologically sorted (alias RHS is evaluated eagerly).
    let structs_enums: Vec<&Value> = types
        .iter()
        .filter(|t| !is_alias_kind(str_field(t, "kind").unwrap_or("")))
        .collect();
    let alias_types: Vec<&Value> = types
        .iter()
        .filter(|t| is_alias_kind(str_field(t, "kind").unwrap_or("")))
        .collect();
    let aliases = order_aliases(&alias_types);

    let mut decls: Vec<String> = Vec::new();
    for t in structs_enums.into_iter().chain(aliases.into_iter()) {
        let decl = named_type(t, &mut ctx);
        if !decl.is_empty() {
            decls.push(decl);
        }
    }

    let mut lines: Vec<String> = vec![
        "from __future__ import annotations".into(),
        String::new(),
        format!(
            "from dataclasses import dataclass{}",
            if ctx.needs_field { ", field" } else { "" }
        ),
        "from enum import Enum".into(),
    ];
    if let Some(tl) = ctx.uses.typing_import() {
        lines.push(tl);
    }
    format!("{}\n\n\n{}\n", lines.join("\n"), decls.join("\n\n\n"))
}

/// All named-type references inside a TypeRef tree (for alias dependency
/// ordering), collected in first-seen order.
fn type_ref_names(r: Option<&Value>, out: &mut Vec<String>) {
    let r = match r {
        Some(r) => r,
        None => return,
    };
    if str_field(r, "kind") == Some("ref") {
        if let Some(name) = str_field(r, "name") {
            if !name.is_empty() && !out.iter().any(|x| x == name) {
                out.push(name.to_string());
            }
        }
    }
    type_ref_names(r.get("items"), out);
    type_ref_names(r.get("values"), out);
}

/// Topologically order the alias/union group so an alias whose RHS references
/// another alias is emitted after it (DFS post-order, cycles fall back to input
/// order — matching orderAliases' `visiting` guard).
fn order_aliases<'a>(aliases: &[&'a Value]) -> Vec<&'a Value> {
    use std::collections::{HashMap, HashSet};
    let mut by_name: HashMap<String, usize> = HashMap::new();
    for (i, a) in aliases.iter().enumerate() {
        by_name.insert(str_field(a, "name").unwrap_or("").to_string(), i);
    }
    let mut ordered: Vec<&Value> = Vec::new();
    let mut done: HashSet<usize> = HashSet::new();
    let mut visiting: HashSet<usize> = HashSet::new();

    fn visit<'a>(
        idx: usize,
        aliases: &[&'a Value],
        by_name: &std::collections::HashMap<String, usize>,
        ordered: &mut Vec<&'a Value>,
        done: &mut std::collections::HashSet<usize>,
        visiting: &mut std::collections::HashSet<usize>,
    ) {
        if done.contains(&idx) || visiting.contains(&idx) {
            return;
        }
        visiting.insert(idx);
        let a = aliases[idx];
        let mut refs: Vec<String> = Vec::new();
        if str_field(a, "kind") == Some("alias") {
            type_ref_names(a.get("of"), &mut refs);
        }
        for r in &refs {
            if let Some(&dep) = by_name.get(r) {
                if dep != idx {
                    visit(dep, aliases, by_name, ordered, done, visiting);
                }
            }
        }
        visiting.remove(&idx);
        done.insert(idx);
        ordered.push(a);
    }

    for i in 0..aliases.len() {
        visit(i, aliases, &by_name, &mut ordered, &mut done, &mut visiting);
    }
    ordered
}

fn named_type(t: &Value, ctx: &mut ModelsCtx) -> String {
    let name = pascal_case(str_field(t, "name").unwrap_or(""));
    match str_field(t, "kind").unwrap_or("") {
        "enum" => enum_type(t),
        "alias" => format!("{name} = {}", py_type(t.get("of"), &mut ctx.uses)),
        "union" => {
            ctx.uses.use_name("Any");
            format!("{name} = Any")
        }
        _ => struct_type(t, ctx),
    }
}

fn struct_type(t: &Value, ctx: &mut ModelsCtx) -> String {
    let name = pascal_case(str_field(t, "name").unwrap_or(""));
    let fields = arr(t, "fields");
    if fields.is_empty() {
        return format!("@dataclass\nclass {name}:\n    pass");
    }
    // Required fields first (no default), then optional (Optional[...] = None).
    let required = fields
        .iter()
        .filter(|f| bool_field(f, "required") == Some(true));
    let optional = fields
        .iter()
        .filter(|f| bool_field(f, "required") != Some(true));
    let lines: Vec<String> = required
        .chain(optional)
        .map(|f| struct_field_line(f, ctx))
        .collect();
    format!("@dataclass\nclass {name}:\n{}", lines.join("\n"))
}

/// One dataclass field; when the Python name differs from the wire name the raw
/// name is kept in `field(metadata={"wire": ...})` for wire-correct encode/decode.
fn struct_field_line(f: &Value, ctx: &mut ModelsCtx) -> String {
    let raw = str_field(f, "name").unwrap_or("");
    let py = snake_case(raw);
    let ty = py_type(f.get("type"), &mut ctx.uses);
    let wire = if py == raw {
        None
    } else {
        Some(format!("metadata={{\"wire\": {}}}", pystr(raw)))
    };
    if bool_field(f, "required") == Some(true) {
        match wire {
            None => format!("    {py}: {ty}"),
            Some(w) => {
                ctx.needs_field = true;
                format!("    {py}: {ty} = field({w})")
            }
        }
    } else {
        let opt = optionalize(&ty, &mut ctx.uses);
        match wire {
            None => format!("    {py}: {opt} = None"),
            Some(w) => {
                ctx.needs_field = true;
                format!("    {py}: {opt} = field(default=None, {w})")
            }
        }
    }
}

fn enum_type(t: &Value) -> String {
    let name = pascal_case(str_field(t, "name").unwrap_or(""));
    let base = if str_field(t, "base") == Some("integer") {
        "int"
    } else {
        "str"
    };
    let values = arr(t, "values");
    if values.is_empty() {
        return format!("class {name}({base}, Enum):\n    pass");
    }
    let members: Vec<String> = values
        .iter()
        .map(|v| {
            // member = screamingSnake(String(v.name ?? v.value)) || 'VALUE'
            let src = v
                .get("name")
                .and_then(Value::as_str)
                .map(str::to_string)
                .unwrap_or_else(|| js_string(v.get("value")));
            let member_raw = screaming_snake_case(&src);
            let member = if member_raw.is_empty() {
                "VALUE".to_string()
            } else {
                member_raw
            };
            // lit uses v.value always: int base -> String(v.value); else JSON.stringify.
            let lit = if base == "int" {
                js_string(v.get("value"))
            } else {
                pystr(&js_string(v.get("value")))
            };
            format!("    {member} = {lit}")
        })
        .collect();
    format!("class {name}({base}, Enum):\n{}", members.join("\n"))
}

/// JS `String(value)` for a JSON scalar (enum values are string or integer).
fn js_string(v: Option<&Value>) -> String {
    match v {
        Some(Value::String(s)) => s.clone(),
        Some(Value::Number(n)) => n.to_string(),
        Some(Value::Bool(b)) => b.to_string(),
        Some(Value::Null) | None => "null".to_string(),
        Some(other) => other.to_string(),
    }
}

// ---- _client.py ----------------------------------------------------------

pub fn client_py(spec: &Value, env_var: &str) -> String {
    let resources = arr(spec, "resources");
    let imports = resources
        .iter()
        .map(|r| {
            format!(
                "{}Resource",
                pascal_case(str_field(r, "name").unwrap_or(""))
            )
        })
        .collect::<Vec<_>>()
        .join(", ");
    let attr_lines: Vec<String> = resources
        .iter()
        .map(|r| {
            let n = str_field(r, "name").unwrap_or("");
            format!(
                "        self.{} = {}Resource(self._transport)",
                snake_case(n),
                pascal_case(n)
            )
        })
        .collect();

    let mut out = String::new();
    out.push_str("from __future__ import annotations\n");
    out.push('\n');
    out.push_str("import os\n");
    out.push_str("from typing import Optional\n");
    out.push('\n');
    out.push_str("from ._transport import Transport\n");
    out.push_str(&format!("from .resources import {imports}\n"));
    out.push('\n');
    out.push('\n');
    out.push_str("class Client:\n");
    out.push_str("    def __init__(\n");
    out.push_str("        self,\n");
    out.push_str("        api_key: Optional[str] = None,\n");
    out.push_str("        base_url: Optional[str] = None,\n");
    out.push_str("        timeout: Optional[float] = None,\n");
    out.push_str("    ) -> None:\n");
    out.push_str(&format!(
        "        key = api_key if api_key is not None else os.environ.get({})\n",
        pystr(env_var)
    ));
    out.push_str(
        "        self._transport = Transport(base_url=base_url, api_key=key, timeout=timeout)\n",
    );
    out.push_str(&attr_lines.join("\n"));
    out.push('\n');
    out
}
