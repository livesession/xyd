//! Port of `runtime.ts` `renderErrorFile` + `renderTransportFile` — the vendored
//! Rust runtime (`src/error.rs` + `src/transport.rs`). Each is a fixed reqwest/
//! tokio source kept as an `include_str!` template with `__XYD_*__` seams
//! substituted here: error.rs interpolates the ErrorKind variants + status arms;
//! transport.rs interpolates the sdk-behavior constants block and the auth
//! statement. Every constant comes from `behavior::resolve_behavior(spec)` so the
//! runtime encodes the declared policy (validated byte-exact against the goldens).

use serde_json::Value;

use crate::behavior::resolve_behavior;
use crate::naming::pascal_case;
use crate::rswriter::rs_string;

/// The fixed error-type source with two seams.
const ERROR_TEMPLATE: &str = include_str!("error_template.rs.txt");
/// The fixed transport source with two seams.
const TRANSPORT_TEMPLATE: &str = include_str!("transport_template.rs.txt");

fn rs_bool(value: bool) -> &'static str {
    if value {
        "true"
    } else {
        "false"
    }
}

/// A Rust `f64` literal: integers render as `2.0` so they parse as floats
/// (mirrors runtime.ts `rsFloat`).
fn rs_float(value: f64) -> String {
    if value.fract() == 0.0 {
        format!("{}.0", value as i64)
    } else {
        format!("{value}")
    }
}

fn get_str<'a>(v: &'a Value, path: &[&str]) -> &'a str {
    let mut cur = v;
    for k in path {
        cur = match cur.get(k) {
            Some(x) => x,
            None => return "",
        };
    }
    cur.as_str().unwrap_or("")
}

fn get_i64(v: &Value, path: &[&str]) -> i64 {
    let mut cur = v;
    for k in path {
        cur = match cur.get(k) {
            Some(x) => x,
            None => return 0,
        };
    }
    cur.as_i64()
        .or_else(|| cur.as_f64().map(|f| f as i64))
        .unwrap_or(0)
}

fn get_f64(v: &Value, path: &[&str]) -> f64 {
    let mut cur = v;
    for k in path {
        cur = match cur.get(k) {
            Some(x) => x,
            None => return 0.0,
        };
    }
    cur.as_f64().unwrap_or(0.0)
}

fn get_bool(v: &Value, path: &[&str]) -> bool {
    let mut cur = v;
    for k in path {
        cur = match cur.get(k) {
            Some(x) => x,
            None => return false,
        };
    }
    cur.as_bool().unwrap_or(false)
}

/// The status->kind entries, numeric and status-sorted (mirrors `sortedStatusMap`).
fn sorted_status_map(behavior: &Value) -> Vec<(i64, String)> {
    let mut mapped: Vec<(i64, String)> = Vec::new();
    if let Some(scm) = behavior
        .get("errors")
        .and_then(|e| e.get("statusCodeMap"))
        .and_then(Value::as_object)
    {
        for (status, kind) in scm {
            if let (Ok(code), Some(k)) = (status.parse::<i64>(), kind.as_str()) {
                mapped.push((code, k.to_string()));
            }
        }
    }
    mapped.sort_by_key(|(status, _)| *status);
    mapped
}

/// The unique ErrorKind names (status order, then server/client), PascalCased.
fn error_kinds(behavior: &Value) -> Vec<String> {
    let mut kinds: Vec<String> = Vec::new();
    let mut push = |kind: &str| {
        let name = pascal_case(kind);
        if !kinds.contains(&name) {
            kinds.push(name);
        }
    };
    for (_status, kind) in sorted_status_map(behavior) {
        push(&kind);
    }
    push(get_str(behavior, &["errors", "serverErrorKind"]));
    push(get_str(behavior, &["errors", "clientErrorKind"]));
    kinds
}

/// Emit `src/error.rs` body: the Error enum + ErrorKind + status->kind mapping.
pub fn render_error_file(spec: &Value) -> String {
    let behavior = resolve_behavior(spec);
    let kinds = error_kinds(&behavior);
    let server_kind = pascal_case(get_str(&behavior, &["errors", "serverErrorKind"]));
    let client_kind = pascal_case(get_str(&behavior, &["errors", "clientErrorKind"]));

    let kinds_block = kinds
        .iter()
        .map(|k| format!("    {k},"))
        .collect::<Vec<_>>()
        .join("\n");

    let mut arms: Vec<String> = sorted_status_map(&behavior)
        .iter()
        .map(|(status, kind)| format!("        {status} => ErrorKind::{},", pascal_case(kind)))
        .collect();
    arms.push(format!(
        "        status if status >= 500 => ErrorKind::{server_kind},"
    ));
    arms.push(format!("        _ => ErrorKind::{client_kind},"));

    ERROR_TEMPLATE
        .replace("__XYD_ERROR_KINDS__", &kinds_block)
        .replace("__XYD_STATUS_ARMS__", &arms.join("\n"))
}

/// The auth application inside the retry loop, from the first security scheme
/// (bearer by default). Mirrors runtime.ts `authStatements`.
fn auth_statements(spec: &Value) -> String {
    let scheme = spec
        .get("security")
        .and_then(Value::as_array)
        .and_then(|a| a.first());
    let name = scheme
        .and_then(|s| s.get("name"))
        .and_then(Value::as_str)
        .unwrap_or("");
    let stmt = match scheme.and_then(|s| s.get("kind")).and_then(Value::as_str) {
        Some("apiKey-header") => format!("rb = rb.header({}, api_key.as_str());", rs_string(name)),
        Some("apiKey-query") => {
            format!("rb = rb.query(&[({}, api_key.as_str())]);", rs_string(name))
        }
        Some("apiKey-cookie") => format!(
            "rb = rb.header(\"Cookie\", format!(\"{{}}={{}}\", {}, api_key));",
            rs_string(name)
        ),
        _ => "rb = rb.bearer_auth(api_key);".to_string(),
    };
    format!(
        "            if let Some(api_key) = &self.transport.api_key {{\n                if !api_key.is_empty() {{\n                    {stmt}\n                }}\n            }}"
    )
}

/// The module-level behavior constants block (no leading/trailing newline).
fn constants_block(spec: &Value, behavior: &Value, crate_: &str, base_url: &str) -> String {
    let version = spec
        .get("info")
        .and_then(|i| i.get("version"))
        .and_then(Value::as_str)
        .filter(|v| !v.is_empty())
        .unwrap_or("0.0.0");
    let user_agent = get_str(behavior, &["userAgent", "sdkIdentifierTemplate"])
        .replace("{package}", crate_)
        .replace("{language}", "rust")
        .replace("{version}", version);

    let ai_agents = behavior
        .get("userAgent")
        .and_then(|u| u.get("aiAgentEnvVars"))
        .and_then(Value::as_object)
        .map(|m| {
            m.iter()
                .map(|(env, slug)| {
                    format!(
                        "({}, {})",
                        rs_string(env),
                        rs_string(slug.as_str().unwrap_or(""))
                    )
                })
                .collect::<Vec<_>>()
                .join(", ")
        })
        .unwrap_or_default();

    let codes = behavior
        .get("retry")
        .and_then(|r| r.get("retryableStatusCodes"))
        .and_then(Value::as_array)
        .map(|a| {
            a.iter()
                .filter_map(Value::as_i64)
                .map(|n| n.to_string())
                .collect::<Vec<_>>()
                .join(", ")
        })
        .unwrap_or_default();

    let lines = [
        format!(
            "pub const DEFAULT_BASE_URL: &str = {};",
            rs_string(base_url)
        ),
        format!("pub const USER_AGENT: &str = {};", rs_string(&user_agent)),
        format!(
            "pub const DEFAULT_TIMEOUT_MS: u64 = {};",
            get_i64(behavior, &["timeout", "defaultTimeoutMs"])
        ),
        format!(
            "pub const MAX_RETRIES: u32 = {};",
            get_i64(behavior, &["retry", "maxRetries"])
        ),
        format!("pub const RETRYABLE_STATUS: &[u16] = &[{codes}];"),
        format!(
            "pub const RETRY_CONNECTION_ERRORS: bool = {};",
            rs_bool(get_bool(behavior, &["retry", "retryConnectionErrors"]))
        ),
        format!(
            "pub const HONOR_RETRY_AFTER: bool = {};",
            rs_bool(get_bool(behavior, &["retry", "honorRetryAfterHeader"]))
        ),
        format!(
            "pub const BACKOFF_INITIAL_MS: u64 = {};",
            get_i64(behavior, &["retry", "backoff", "initialDelayMs"])
        ),
        format!(
            "pub const BACKOFF_MAX_MS: u64 = {};",
            get_i64(behavior, &["retry", "backoff", "maxDelayMs"])
        ),
        format!(
            "pub const BACKOFF_MULTIPLIER: f64 = {};",
            rs_float(get_f64(behavior, &["retry", "backoff", "multiplier"]))
        ),
        format!(
            "pub const BACKOFF_JITTER: f64 = {};",
            rs_float(get_f64(behavior, &["retry", "backoff", "jitter"]))
        ),
        format!(
            "pub const REQUEST_ID_HEADER: &str = {};",
            rs_string(get_str(behavior, &["telemetry", "requestIdHeader"]))
        ),
        format!(
            "pub const IDEMPOTENCY_HEADER: &str = {};",
            rs_string(get_str(behavior, &["idempotency", "headerName"]))
        ),
        format!("const AI_AGENT_ENV_VARS: &[(&str, &str)] = &[{ai_agents}];"),
    ];
    lines.join("\n")
}

/// Emit `src/transport.rs` body: the async reqwest transport, request builder and
/// Page (no ownership header — the caller's `with_header` prepends it).
pub fn render_transport_file(spec: &Value, crate_: &str, base_url: &str) -> String {
    let behavior = resolve_behavior(spec);
    TRANSPORT_TEMPLATE
        .replace(
            "__XYD_CONSTANTS__",
            &constants_block(spec, &behavior, crate_, base_url),
        )
        .replace("__XYD_AUTH__", &auth_statements(spec))
}
