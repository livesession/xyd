//! Tiny Go-source string helpers — port of golit.ts. A `GoVal` renders its
//! first line inline and indents nested lines to `indent`. Byte-exact with the
//! JS emitter (tabs, `\n\n` decl separators, JSON-escaped string literals).

/// A value renderer: `fn(indent) -> string`.
pub type GoVal = Box<dyn Fn(usize) -> String>;

const TAB: &str = "\t";

fn pad(n: usize) -> String {
    TAB.repeat(n)
}

/// A pre-rendered scalar (identifier, number, bool, expression).
pub fn lit(s: impl Into<String>) -> GoVal {
    let s = s.into();
    Box::new(move |_| s.clone())
}

/// A Go double-quoted string literal (JSON escaping is valid Go here).
pub fn go_str(s: &str) -> GoVal {
    let lit_s = serde_json::to_string(s).expect("string serializes");
    Box::new(move |_| lit_s.clone())
}

pub fn go_bool(b: bool) -> GoVal {
    let s = b.to_string();
    Box::new(move |_| s.clone())
}

/// A struct literal: `Type{ Field: value, ... }` (prefix `&` when pointer).
pub fn go_struct(type_name: &str, fields: Vec<(String, GoVal)>, pointer: bool) -> GoVal {
    let head = format!("{}{}{{", if pointer { "&" } else { "" }, type_name);
    Box::new(move |indent: usize| {
        if fields.is_empty() {
            return format!("{head}}}");
        }
        let mut out = format!("{head}\n");
        for (k, v) in &fields {
            out.push_str(&format!("{}{}: {},\n", pad(indent + 1), k, v(indent + 1)));
        }
        out.push_str(&format!("{}}}", pad(indent)));
        out
    })
}

/// A slice literal: `[]Elem{ a, b, ... }`.
pub fn go_slice(elem_type: &str, elems: Vec<GoVal>) -> GoVal {
    let elem_type = elem_type.to_string();
    Box::new(move |indent: usize| {
        if elems.is_empty() {
            return format!("[]{elem_type}{{}}");
        }
        let mut out = format!("[]{elem_type}{{\n");
        for e in &elems {
            out.push_str(&format!("{}{},\n", pad(indent + 1), e(indent + 1)));
        }
        out.push_str(&format!("{}}}", pad(indent)));
        out
    })
}

/// Tracks the import paths a file needs.
#[derive(Default)]
pub struct Imports {
    paths: std::collections::BTreeSet<String>,
}

impl Imports {
    pub fn new() -> Self {
        Imports::default()
    }

    pub fn add(&mut self, import_paths: &[&str]) {
        for p in import_paths {
            self.paths.insert((*p).to_string());
        }
    }

    pub fn size(&self) -> usize {
        self.paths.len()
    }

    pub fn render(&self) -> String {
        if self.paths.is_empty() {
            return String::new();
        }
        // First path segment contains a '.' → external; else stdlib. Both
        // groups sorted (BTreeSet already yields sorted order == JS .sort()).
        let is_ext = |p: &str| p.split('/').next().unwrap_or("").contains('.');
        let std: Vec<&String> = self.paths.iter().filter(|p| !is_ext(p)).collect();
        let ext: Vec<&String> = self.paths.iter().filter(|p| is_ext(p)).collect();
        let groups: Vec<&Vec<&String>> =
            [&std, &ext].into_iter().filter(|g| !g.is_empty()).collect();
        let block = groups
            .iter()
            .map(|g| {
                g.iter()
                    .map(|p| format!("{}{}", TAB, serde_json::to_string(p).unwrap()))
                    .collect::<Vec<_>>()
                    .join("\n")
            })
            .collect::<Vec<_>>()
            .join("\n\n");
        format!("import (\n{block}\n)")
    }
}

/// Assemble a complete Go file: package clause + imports + declarations.
pub fn go_file(pkg: &str, imports: &Imports, decls: &[String]) -> String {
    let mut parts: Vec<String> = vec![format!("package {pkg}")];
    if imports.size() > 0 {
        parts.push(imports.render());
    }
    parts.extend(decls.iter().cloned());
    format!("{}\n", parts.join("\n\n"))
}
