//! project.ts — the per-file JavaCtx (resolveJavaOptions) + pom.xml. Emitter
//! options default to empty (the back-compat `opensdkJava(spec)` path).

use serde_json::Value;

use crate::behavior::resolve_behavior;
use crate::ir::{str_field, Types};
use crate::jsrt::java_package_name;

pub struct JavaCtx {
    pub pkg: String,
    pub base_package: String,
    pub full_package: String,
    pub src_dir: String,
    pub types: Types,
    pub base_url: String,
    pub env_var: Option<String>,
    /// The resolved `ResolvedSdkBehavior` block (defaults ⊕ `spec.sdk`); drives
    /// the vendored runtime's retry/timeout/error/user-agent policy.
    pub behavior: Value,
    /// The normalized auth scheme kind (bearer | apiKey-header | ...), or None.
    pub auth_kind: Option<String>,
    /// The header/query name for apiKey auth, or None.
    pub auth_name: Option<String>,
    /// The SDK identifier baked into the User-Agent, e.g. "petstore-java/1.2.0".
    pub user_agent: String,
}

pub fn resolve_java_options(spec: &Value, types: Types) -> JavaCtx {
    let title = str_field(spec.get("info").unwrap_or(&Value::Null), "title").unwrap_or("");
    let pkg = java_package_name(title);
    let base_package = "com.example".to_string();
    let full_package = format!("{base_package}.{pkg}");
    let src_dir = format!(
        "src/main/java/{}/",
        full_package.split('.').collect::<Vec<_>>().join("/")
    );

    let base_url = spec
        .get("servers")
        .and_then(|s| s.as_array())
        .and_then(|a| a.first())
        .and_then(|s| s.as_str())
        .unwrap_or("")
        .to_string();
    let env_var = spec
        .get("security")
        .and_then(|s| s.as_array())
        .and_then(|arr| arr.iter().find(|s| s.get("envVar").is_some()))
        .and_then(|s| str_field(s, "envVar"))
        .map(|s| s.to_string());

    let security = spec
        .get("security")
        .and_then(|s| s.as_array())
        .and_then(|a| a.first());
    let auth_kind = security
        .and_then(|s| str_field(s, "kind"))
        .map(|s| s.to_string());
    let auth_name = security
        .and_then(|s| str_field(s, "name"))
        .map(|s| s.to_string());

    let behavior = resolve_behavior(spec);
    let version = str_field(spec.get("info").unwrap_or(&Value::Null), "version")
        .filter(|v| !v.is_empty())
        .unwrap_or("0.0.0");
    let template = behavior
        .get("userAgent")
        .and_then(|u| u.get("sdkIdentifierTemplate"))
        .and_then(|t| t.as_str())
        .unwrap_or("{package}-{language}/{version}");
    let user_agent = template
        .replace("{package}", &pkg)
        .replace("{language}", "java")
        .replace("{version}", version);

    JavaCtx {
        pkg,
        base_package,
        full_package,
        src_dir,
        types,
        base_url,
        env_var,
        behavior,
        auth_kind,
        auth_name,
        user_agent,
    }
}

fn xml_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

/// pom.xml — the (dependency-free) build manifest.
pub fn pom_xml(ctx: &JavaCtx, spec: &Value) -> String {
    let info = spec.get("info").cloned().unwrap_or(Value::Null);
    let title = str_field(&info, "title").unwrap_or("");
    let version = str_field(&info, "version")
        .filter(|v| !v.is_empty())
        .unwrap_or("0.0.0");

    let mut meta: Vec<String> = vec![format!("  <name>{}</name>", xml_escape(title))];
    if let Some(h) = str_field(&info, "homepage") {
        meta.push(format!("  <url>{}</url>", xml_escape(h)));
    }
    if let Some(lic) = info.get("license").and_then(|l| str_field(l, "identifier")) {
        meta.push("  <licenses>".to_string());
        meta.push(format!(
            "    <license><name>{}</name></license>",
            xml_escape(lic)
        ));
        meta.push("  </licenses>".to_string());
    }
    if let Some(cn) = info.get("contact").and_then(|c| str_field(c, "name")) {
        meta.push("  <developers>".to_string());
        meta.push(format!(
            "    <developer><name>{}</name></developer>",
            xml_escape(cn)
        ));
        meta.push("  </developers>".to_string());
    }
    if let Some(r) = str_field(&info, "repository") {
        meta.push("  <scm>".to_string());
        meta.push(format!("    <url>{}</url>", xml_escape(r)));
        meta.push("  </scm>".to_string());
    }

    format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>{base}</groupId>
  <artifactId>{pkg}-java</artifactId>
  <version>{version}</version>
  <packaging>jar</packaging>
{meta}

  <properties>
    <maven.compiler.release>11</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>
</project>
"#,
        base = ctx.base_package,
        pkg = ctx.pkg,
        version = version,
        meta = meta.join("\n"),
    )
}
