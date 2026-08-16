//! Port of `runtime.ts` `runtimeFiles` — the vendored Go runtime (net/http
//! client, requestconfig, apijson, param, and the on-demand apiform/pagination
//! packages). The bulk of each file is fixed Go source kept as `include_str!`
//! templates (`*.go.txt`, validated byte-exact against the JS emitter's
//! goldens) so `cargo fmt` can never touch the emitted Go bytes; the handful of
//! `__XYD_*__` seams (module path, base URL, user-agent, auth statement, and the
//! form/idempotency capability blocks) are substituted here. Behavior constants
//! come from `behavior::resolve_behavior` so the runtime encodes the declared
//! policy.
//!
//! Files are vendored on demand: `apiform` only when a method has a
//! multipart/form body, `pagination` only when a method returns a page, and the
//! idempotency-key helper only when a method auto-injects a key — a JSON-only,
//! non-paginated spec gets no dead runtime code.

use serde_json::{Map, Value};

use crate::naming::json_string;
use crate::plan::plan_operation;
use crate::service::method_injects_idempotency;

// Fixed runtime source (no interpolation) — verbatim from the goldens.
const PARAM_GO: &str = include_str!("param.go.txt");
const APIJSON_GO: &str = include_str!("apijson.go.txt");
const APIFORM_GO: &str = include_str!("apiform.go.txt");
const ERRORS_GO: &str = include_str!("errors.go.txt");
// Templated runtime source with __XYD_*__ seams.
const OPTION_GO: &str = include_str!("option.go.txt");
const PAGINATION_GO: &str = include_str!("pagination.go.txt");
const REQUESTCONFIG_GO: &str = include_str!("requestconfig.go.txt");
const CONFIG_GO: &str = include_str!("config.go.txt");

/// The `case "multipart" | "form"` branch prepended to marshalBody when some
/// request body is form-encoded (`__XYD_RC_FORM_BRANCH__`).
const FORM_BRANCH: &str = "\tswitch cfg.Encoding {\n\tcase \"multipart\":\n\t\treturn apiform.MarshalMultipart(cfg.Body)\n\tcase \"form\":\n\t\tbody, err = apiform.MarshalForm(cfg.Body)\n\t\treturn body, \"application/x-www-form-urlencoded\", err\n\t}\n";

/// The dependency-free UUIDv4 helper appended to requestconfig.go when some
/// method auto-injects an idempotency key (`__XYD_RC_IDEMPOTENCY__`).
const IDEMPOTENCY_HELPER: &str = "\n\n// NewIdempotencyKey returns a fresh UUIDv4 (crypto/rand, dependency-free) for\n// idempotency-key injection: generated methods set it once per logical call,\n// so every retry replays the SAME key (sdk.idempotency).\nfunc NewIdempotencyKey() string {\n\tvar b [16]byte\n\tif _, err := cryptorand.Read(b[:]); err != nil {\n\t\t// crypto/rand failing is effectively unreachable; fall back to a\n\t\t// time-based key rather than panicking inside a request path.\n\t\treturn fmt.Sprintf(\"fallback-%d\", time.Now().UnixNano())\n\t}\n\tb[6] = (b[6] & 0x0f) | 0x40 // version 4\n\tb[8] = (b[8] & 0x3f) | 0x80 // RFC 4122 variant\n\treturn fmt.Sprintf(\"%x-%x-%x-%x-%x\", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])\n}";

/// Every method in the spec, flattened across the resource tree.
fn walk_methods(spec: &Value) -> Vec<&Value> {
    fn rec<'a>(res: &'a Value, out: &mut Vec<&'a Value>) {
        if let Some(methods) = res.get("methods").and_then(|m| m.as_array()) {
            out.extend(methods.iter());
        }
        if let Some(subs) = res.get("resources").and_then(|r| r.as_array()) {
            for sub in subs {
                rec(sub, out);
            }
        }
    }
    let mut out = Vec::new();
    if let Some(resources) = spec.get("resources").and_then(|r| r.as_array()) {
        for r in resources {
            rec(r, &mut out);
        }
    }
    out
}

/// The applyAuth function body (the part between the braces) from the first
/// security scheme; empty when the spec declares no credential.
fn apply_auth_body(spec: &Value) -> String {
    let Some(scheme) = spec
        .get("security")
        .and_then(|s| s.as_array())
        .and_then(|a| a.first())
    else {
        return String::new();
    };
    let name = scheme.get("name").and_then(|n| n.as_str()).unwrap_or("");
    let block = match scheme.get("kind").and_then(|k| k.as_str()) {
        Some("bearer") => "\treq.Header.Set(\"Authorization\", \"Bearer \"+cfg.APIKey)".to_string(),
        Some("apiKey-header") => format!("\treq.Header.Set({}, cfg.APIKey)", json_string(name)),
        Some("apiKey-query") => format!(
            "\tquery := req.URL.Query()\n\tquery.Set({}, cfg.APIKey)\n\treq.URL.RawQuery = query.Encode()",
            json_string(name)
        ),
        Some("apiKey-cookie") => format!(
            "\treq.AddCookie(&http.Cookie{{Name: {}, Value: cfg.APIKey}})",
            json_string(name)
        ),
        _ => return String::new(),
    };
    format!("\n\tif cfg.APIKey == \"\" {{\n\t\treturn\n\t}}\n{block}\n")
}

/// The runtime file map (path → header-less content). The caller (`lib.rs`)
/// prepends the ownership header to each `.go` file.
pub fn runtime_files(
    spec: &Value,
    module_path: &str,
    base_url: &str,
    pkg: &str,
    types: &Map<String, Value>,
    behavior: &Value,
) -> Vec<(String, String)> {
    let methods = walk_methods(spec);
    let plans: Vec<_> = methods.iter().map(|m| plan_operation(m, types)).collect();
    let has_form = plans
        .iter()
        .any(|p| matches!(p.encoding.as_deref(), Some("multipart") | Some("form")));
    let has_pagination = plans.iter().any(|p| p.page_name.is_some());
    let needs_idempotency = methods
        .iter()
        .any(|m| method_injects_idempotency(m, behavior));

    let version = spec
        .get("info")
        .and_then(|i| i.get("version"))
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let user_agent = format!("{pkg}-go/{version}");

    // config.go — per-spec constants (base URL, user-agent, auth).
    let config = CONFIG_GO
        .replace("__XYD_BASE_URL__", &json_string(base_url))
        .replace("__XYD_USER_AGENT__", &json_string(&user_agent))
        .replace("__XYD_APPLY_AUTH_BODY__", &apply_auth_body(spec));

    // requestconfig.go — module path + form + idempotency capability seams.
    let requestconfig = REQUESTCONFIG_GO
        .replace(
            "__XYD_RC_CRYPTORAND__",
            if needs_idempotency {
                "\tcryptorand \"crypto/rand\"\n"
            } else {
                ""
            },
        )
        .replace(
            "__XYD_RC_FMT__",
            if needs_idempotency { "\t\"fmt\"\n" } else { "" },
        )
        .replace(
            "__XYD_RC_APIFORM__",
            &if has_form {
                format!("\t\"{module_path}/packages/apiform\"\n")
            } else {
                String::new()
            },
        )
        .replace(
            "__XYD_RC_FORM_BRANCH__",
            if has_form { FORM_BRANCH } else { "" },
        )
        .replace(
            "__XYD_RC_IDEMPOTENCY__",
            if needs_idempotency {
                IDEMPOTENCY_HELPER
            } else {
                ""
            },
        )
        .replace("__XYD_MODULE__", module_path);

    let mut files: Vec<(String, String)> = vec![
        ("packages/param/param.go".to_string(), PARAM_GO.to_string()),
        (
            "packages/apijson/apijson.go".to_string(),
            APIJSON_GO.to_string(),
        ),
        (
            "option/option.go".to_string(),
            OPTION_GO.replace("__XYD_MODULE__", module_path),
        ),
        (
            "internal/requestconfig/requestconfig.go".to_string(),
            requestconfig,
        ),
        (
            "internal/requestconfig/errors.go".to_string(),
            ERRORS_GO.to_string(),
        ),
        ("internal/requestconfig/config.go".to_string(), config),
    ];
    if has_form {
        files.push((
            "packages/apiform/apiform.go".to_string(),
            APIFORM_GO.to_string(),
        ));
    }
    if has_pagination {
        files.push((
            "packages/pagination/pagination.go".to_string(),
            PAGINATION_GO.replace("__XYD_MODULE__", module_path),
        ));
    }
    files
}
