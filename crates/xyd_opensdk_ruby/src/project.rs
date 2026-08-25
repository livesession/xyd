//! Port of project.ts — the `.gemspec` + `lib/<pkg>.rb` entry point.

use serde_json::Value;

use crate::naming::snake_case;
use crate::writer::rb_string;

pub fn render_gemspec(spec: &Value, pkg: &str) -> String {
    render_gemspec_with(spec, pkg, "API")
}

/// CLI-mode gemspec: identical fields, but the summary names the CLI. The
/// file list (`lib/**/*.rb` + the gemspec itself) is already CLI-relevant-only
/// — no test extras or development dependencies are declared in either mode.
pub fn render_gemspec_cli(spec: &Value, pkg: &str) -> String {
    render_gemspec_with(spec, pkg, "CLI")
}

fn render_gemspec_with(spec: &Value, pkg: &str, what: &str) -> String {
    let info = spec.get("info");
    let title = info
        .and_then(|i| i.get("title"))
        .and_then(|t| t.as_str())
        .unwrap_or("");
    let summary = format!("Ruby client for the {title} {what}");
    let description = info
        .and_then(|i| i.get("description"))
        .and_then(|d| d.as_str())
        .map(|d| d.trim())
        .filter(|d| !d.is_empty())
        .unwrap_or(&summary)
        .to_string();
    let author = info
        .and_then(|i| i.get("contact"))
        .and_then(|c| c.get("name"))
        .and_then(|n| n.as_str())
        .filter(|n| !n.is_empty())
        .unwrap_or("opensdk");
    let license = info
        .and_then(|i| i.get("license"))
        .and_then(|l| l.get("identifier"))
        .and_then(|n| n.as_str())
        .filter(|n| !n.is_empty())
        .unwrap_or("MIT");
    let version = info
        .and_then(|i| i.get("version"))
        .and_then(|v| v.as_str())
        .filter(|v| !v.is_empty())
        .unwrap_or("0.0.0");

    let mut lines = vec![
        "# frozen_string_literal: true".to_string(),
        String::new(),
        "Gem::Specification.new do |spec|".to_string(),
        format!("  spec.name = {}", rb_string(pkg)),
        format!("  spec.version = {}", rb_string(version)),
        format!("  spec.summary = {}", rb_string(&summary)),
        format!("  spec.description = {}", rb_string(&description)),
        format!("  spec.authors = [{}]", rb_string(author)),
        format!("  spec.license = {}", rb_string(license)),
    ];
    if let Some(hp) = info
        .and_then(|i| i.get("homepage"))
        .and_then(|h| h.as_str())
        .filter(|h| !h.is_empty())
    {
        lines.push(format!("  spec.homepage = {}", rb_string(hp)));
    }
    if let Some(repo) = info
        .and_then(|i| i.get("repository"))
        .and_then(|r| r.as_str())
        .filter(|r| !r.is_empty())
    {
        lines.push(format!(
            "  spec.metadata = {{ \"source_code_uri\" => {} }}",
            rb_string(repo)
        ));
    }
    lines.push("  spec.required_ruby_version = \">= 2.6.0\"".to_string());
    lines.push("  spec.files = Dir[\"lib/**/*.rb\", \"*.gemspec\"]".to_string());
    lines.push("  spec.require_paths = [\"lib\"]".to_string());
    lines.push("end".to_string());
    format!("{}\n", lines.join("\n"))
}

pub fn render_entrypoint(spec: &Value, pkg: &str) -> String {
    let mut requires = vec![
        "require \"json\"".to_string(),
        "require \"net/http\"".to_string(),
        "require \"securerandom\"".to_string(),
        "require \"time\"".to_string(),
        "require \"uri\"".to_string(),
        String::new(),
        format!(
            "require_relative {}",
            rb_string(&format!("{pkg}/transport"))
        ),
        format!("require_relative {}", rb_string(&format!("{pkg}/models"))),
    ];
    if let Some(resources) = spec.get("resources").and_then(|r| r.as_array()) {
        for r in resources {
            let sn = snake_case(r.get("name").and_then(|n| n.as_str()).unwrap_or(""));
            requires.push(format!(
                "require_relative {}",
                rb_string(&format!("{pkg}/resources/{sn}"))
            ));
        }
    }
    requires.push(format!(
        "require_relative {}",
        rb_string(&format!("{pkg}/client"))
    ));
    format!("{}\n", requires.join("\n"))
}
