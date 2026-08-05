//! The string-emitting Go writer — port of gowriter.ts (Imports + goFile/goDoc/
//! goStruct/goField).

const TAB: &str = "\t";

/// Tracks import paths (insertion-ordered), with optional aliases.
#[derive(Default)]
pub struct Imports {
    // (path, alias) in insertion order; first-write wins (Map.has guard).
    paths: Vec<(String, Option<String>)>,
}

impl Imports {
    pub fn new() -> Self {
        Self::default()
    }

    /// Add an import path (optionally aliased). Returns the qualifier to use.
    pub fn add(&mut self, path: &str, alias: Option<&str>) -> String {
        if let Some((_, existing)) = self.paths.iter().find(|(p, _)| p == path) {
            // returns alias ?? existing ?? lastSegment(path)
            return alias
                .map(|a| a.to_string())
                .or_else(|| existing.clone())
                .unwrap_or_else(|| last_segment(path));
        }
        self.paths
            .push((path.to_string(), alias.map(|a| a.to_string())));
        alias
            .map(|a| a.to_string())
            .unwrap_or_else(|| last_segment(path))
    }

    pub fn size(&self) -> usize {
        self.paths.len()
    }

    pub fn render(&self) -> String {
        if self.paths.is_empty() {
            return String::new();
        }
        let is_ext = |p: &str| p.split('/').next().unwrap_or("").contains('.');
        let line = |(p, alias): &(String, Option<String>)| -> String {
            format!(
                "{TAB}{}{}",
                alias.as_ref().map(|a| format!("{a} ")).unwrap_or_default(),
                crate::naming::json_string(p)
            )
        };
        let mut std: Vec<&(String, Option<String>)> =
            self.paths.iter().filter(|(p, _)| !is_ext(p)).collect();
        let mut ext: Vec<&(String, Option<String>)> =
            self.paths.iter().filter(|(p, _)| is_ext(p)).collect();
        std.sort_by(|a, b| a.0.cmp(&b.0));
        ext.sort_by(|a, b| a.0.cmp(&b.0));
        let std_lines: Vec<String> = std.iter().map(|e| line(e)).collect();
        let ext_lines: Vec<String> = ext.iter().map(|e| line(e)).collect();
        let groups: Vec<String> = [std_lines, ext_lines]
            .into_iter()
            .filter(|g| !g.is_empty())
            .map(|g| g.join("\n"))
            .collect();
        format!("import (\n{}\n)", groups.join("\n\n"))
    }
}

fn last_segment(path: &str) -> String {
    path.rsplit('/').next().unwrap_or(path).to_string()
}

pub fn go_file(pkg: &str, imports: &Imports, decls: &[String]) -> String {
    let mut parts: Vec<String> = vec![format!("package {pkg}")];
    if imports.size() > 0 {
        parts.push(imports.render());
    }
    for d in decls {
        if !d.is_empty() {
            parts.push(d.clone());
        }
    }
    format!("{}\n", parts.join("\n\n"))
}

pub fn go_doc(text: Option<&str>, symbol: Option<&str>) -> String {
    let raw = text.unwrap_or("").trim();
    if raw.is_empty() && symbol.is_none() {
        return String::new();
    }
    let body = if raw.is_empty() {
        format!("{} ...", symbol.unwrap())
    } else {
        raw.to_string()
    };
    body.split('\n')
        .map(|l| {
            if l.trim().is_empty() {
                "//".to_string()
            } else {
                format!("// {}", l.trim())
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

pub fn go_struct(name: &str, fields: &[String], doc: &str) -> String {
    let head = if doc.is_empty() {
        String::new()
    } else {
        format!("{doc}\n")
    };
    if fields.is_empty() {
        return format!("{head}type {name} struct{{}}");
    }
    let body = fields
        .iter()
        .map(|f| format!("{TAB}{f}"))
        .collect::<Vec<_>>()
        .join("\n");
    format!("{head}type {name} struct {{\n{body}\n}}")
}

pub fn go_field(name: &str, ty: &str, tag: Option<&str>) -> String {
    match tag {
        Some(t) => format!("{name} {ty} `{t}`"),
        None => format!("{name} {ty}"),
    }
}
