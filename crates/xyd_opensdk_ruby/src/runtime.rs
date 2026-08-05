//! Port of `runtime.ts` `renderTransportFile` — the vendored Ruby transport
//! (`lib/<pkg>/transport.rb`). The bulk is a fixed net/http transport kept as an
//! `include_str!` template (`transport_template.rb.txt`) with six interpolation
//! seams substituted here: module name, the sdk-behavior constants block, the
//! error-class hierarchy, the auth statement, the timeout initializer, and the
//! optional runtime-version suffix. Every behavior constant comes from
//! `behavior::resolve_behavior(spec)` so the runtime encodes the declared policy.

use serde_json::Value;

use crate::behavior::resolve_behavior;
use crate::writer::rb_string;

/// The fixed transport source with `__XYD_*__` seams (validated byte-exact
/// against the JS emitter's goldens).
const TEMPLATE: &str = include_str!("transport_template.rb.txt");

fn rb_bool(value: bool) -> &'static str {
    if value {
        "true"
    } else {
        "false"
    }
}

/// A Ruby float literal: integers render as `60.0` so seconds read as seconds.
fn rb_float(value: f64) -> String {
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

/// The Ruby exception class name for a policy error kind (`API` is the base).
fn error_class_name(kind: &str) -> String {
    if kind == "API" {
        return "APIError".to_string();
    }
    if kind.ends_with("Error") {
        kind.to_string()
    } else {
        format!("{kind}Error")
    }
}

/// The per-kind exception classes + the status -> class dispatch table.
fn error_classes_block(behavior: &Value) -> String {
    // (status, kind) pairs, numerically sorted (several statuses may share a kind).
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

    // class -> kind, in first-seen order (kind taken from the first occurrence).
    let mut order: Vec<(String, String)> = Vec::new();
    let mut seen: std::collections::HashSet<String> = std::collections::HashSet::new();
    for (_status, kind) in &mapped {
        let cls = error_class_name(kind);
        if cls == "APIError" {
            continue;
        }
        if seen.insert(cls.clone()) {
            order.push((cls, kind.clone()));
        }
    }
    let server_kind = get_str(behavior, &["errors", "serverErrorKind"]);
    let client_kind = get_str(behavior, &["errors", "clientErrorKind"]);
    let server_class = error_class_name(server_kind);
    let client_class = error_class_name(client_kind);
    if server_class != "APIError" && seen.insert(server_class.clone()) {
        order.push((server_class.clone(), server_kind.to_string()));
    }
    if client_class != "APIError" && seen.insert(client_class.clone()) {
        order.push((client_class.clone(), client_kind.to_string()));
    }

    let mut blocks: Vec<String> = order
        .iter()
        .map(|(cls, kind)| {
            format!(
                "  class {cls} < APIError\n    def self.kind\n      {}\n    end\n  end",
                rb_string(kind)
            )
        })
        .collect();

    let table = if mapped.is_empty() {
        "  STATUS_TO_ERROR = {}.freeze".to_string()
    } else {
        let entries: Vec<String> = mapped
            .iter()
            .map(|(status, kind)| format!("    {status} => {},", error_class_name(kind)))
            .collect();
        format!(
            "  STATUS_TO_ERROR = {{\n{}\n  }}.freeze",
            entries.join("\n")
        )
    };

    let dispatch = [
        "  # The policy-mapped exception: exact status map first, then the 5xx",
        "  # catch-all, then the client catch-all.",
        "  def self.error_for_status(status_code, headers, body)",
        "    klass = STATUS_TO_ERROR[status_code]",
        &format!("    klass = (status_code >= 500 ? {server_class} : {client_class}) if klass.nil?"),
        "    klass.new(status_code: status_code, headers: headers, body: body, message: APIError.error_message(body))",
        "  end",
    ]
    .join("\n");

    blocks.push(table);
    blocks.push(dispatch);
    blocks.join("\n\n")
}

/// The auth statement applied to a request, from the first security scheme.
fn auth_block(spec: &Value) -> String {
    let Some(scheme) = spec
        .get("security")
        .and_then(Value::as_array)
        .and_then(|a| a.first())
    else {
        return String::new();
    };
    let name = scheme.get("name").and_then(Value::as_str).unwrap_or("");
    let stmt = match scheme.get("kind").and_then(Value::as_str) {
        Some("apiKey-header") => format!("request_headers[{}] = @api_key", rb_string(name)),
        Some("apiKey-query") => {
            format!(
                "query = (query || {{}}).merge({} => @api_key)",
                rb_string(name)
            )
        }
        Some("apiKey-cookie") => format!(
            "request_headers[\"Cookie\"] = {} + @api_key",
            rb_string(&format!("{name}="))
        ),
        _ => "request_headers[\"Authorization\"] = \"Bearer #{@api_key}\"".to_string(),
    };
    format!("      if @api_key && !@api_key.to_s.empty?\n        {stmt}\n      end\n")
}

/// The `module`-level behavior constants block (no leading/trailing newline).
fn constants_block(spec: &Value, behavior: &Value, pkg: &str, base_url: &str) -> String {
    let version = spec
        .get("info")
        .and_then(|i| i.get("version"))
        .and_then(Value::as_str)
        .filter(|v| !v.is_empty())
        .unwrap_or("0.0.0");
    let user_agent = get_str(behavior, &["userAgent", "sdkIdentifierTemplate"])
        .replace("{package}", pkg)
        .replace("{language}", "ruby")
        .replace("{version}", version);

    let ai_agents = behavior
        .get("userAgent")
        .and_then(|u| u.get("aiAgentEnvVars"))
        .and_then(Value::as_object)
        .map(|m| {
            m.iter()
                .map(|(env, slug)| {
                    format!(
                        "{} => {}",
                        rb_string(env),
                        rb_string(slug.as_str().unwrap_or(""))
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

    let max_retries = get_f64(behavior, &["retry", "maxRetries"]) as i64;

    let lines = [
        format!("  DEFAULT_BASE_URL = {}", rb_string(base_url)),
        format!("  USER_AGENT = {}", rb_string(&user_agent)),
        format!("  AI_AGENT_ENV_VARS = {{ {ai_agents} }}.freeze"),
        format!("  MAX_RETRIES = {max_retries}"),
        format!("  RETRYABLE_STATUS_CODES = [{codes}].freeze"),
        format!(
            "  RETRY_CONNECTION_ERRORS = {}",
            rb_bool(get_bool(behavior, &["retry", "retryConnectionErrors"]))
        ),
        format!(
            "  HONOR_RETRY_AFTER_HEADER = {}",
            rb_bool(get_bool(behavior, &["retry", "honorRetryAfterHeader"]))
        ),
        format!(
            "  BACKOFF_INITIAL_DELAY = {}",
            rb_float(get_f64(behavior, &["retry", "backoff", "initialDelayMs"]) / 1000.0)
        ),
        format!(
            "  BACKOFF_MAX_DELAY = {}",
            rb_float(get_f64(behavior, &["retry", "backoff", "maxDelayMs"]) / 1000.0)
        ),
        format!(
            "  BACKOFF_MULTIPLIER = {}",
            rb_float(get_f64(behavior, &["retry", "backoff", "multiplier"]))
        ),
        format!(
            "  BACKOFF_JITTER = {}",
            rb_float(get_f64(behavior, &["retry", "backoff", "jitter"]))
        ),
        format!(
            "  REQUEST_ID_HEADER = {}",
            rb_string(get_str(behavior, &["telemetry", "requestIdHeader"]))
        ),
        format!(
            "  IDEMPOTENCY_HEADER = {}",
            rb_string(get_str(behavior, &["idempotency", "headerName"]))
        ),
    ];
    lines.join("\n")
}

/// Render the vendored transport file body (no ownership header — the caller's
/// `with_header` prepends it, matching the framework orchestrator).
pub fn render_transport_file(spec: &Value, module_name: &str, pkg: &str, base_url: &str) -> String {
    let behavior = resolve_behavior(spec);

    let timeout_ms = get_f64(&behavior, &["timeout", "defaultTimeoutMs"]);
    let timeout_init = if timeout_ms > 0.0 {
        format!("timeout.nil? ? {} : timeout", rb_float(timeout_ms / 1000.0))
    } else {
        "timeout".to_string()
    };
    let runtime_version = if get_bool(&behavior, &["userAgent", "includeRuntimeVersion"]) {
        "\n      ua = ua + \" ruby/\" + RUBY_VERSION"
    } else {
        ""
    };

    TEMPLATE
        .replace(
            "__XYD_CONSTANTS__",
            &constants_block(spec, &behavior, pkg, base_url),
        )
        .replace("__XYD_ERRORS__", &error_classes_block(&behavior))
        .replace("__XYD_AUTH__", &auth_block(spec))
        .replace("__XYD_TIMEOUT_INIT__", &timeout_init)
        .replace("__XYD_RUNTIME_VERSION__", runtime_version)
        .replace("__XYD_MODULE__", module_name)
}
