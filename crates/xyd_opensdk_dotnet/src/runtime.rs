//! Port of `runtime.ts` `renderTransportFile` + `pagination.ts`
//! `renderPaginationFile`. The bulk of `Transport.cs` is a fixed
//! `System.Net.Http` + `System.Text.Json` pipeline kept as an `include_str!`
//! template (`transport_template.cs.txt`) with eight interpolation seams
//! substituted here: namespace, the policy error-class hierarchy + status
//! dispatch, the sdk-behavior constants block, the auth URL/header blocks, the
//! optional runtime-version line, and the timeout initializer. Every behavior
//! constant comes from `behavior::resolve_behavior(spec)` so the .NET runtime
//! encodes the SAME declared policy as the Go/Ruby runtimes.

use serde_json::Value;

use crate::behavior::resolve_behavior;
use crate::jsrt::{json_string, pascal_case};

const TRANSPORT_TEMPLATE: &str = include_str!("transport_template.cs.txt");
const PAGINATION_TEMPLATE: &str = include_str!("pagination.cs.txt");

pub struct DotnetRuntimeCtx<'a> {
    pub sdk: &'a str,
    pub namespace: &'a str,
    pub base_url: &'a str,
}

// ---- C# literal helpers ----------------------------------------------------

fn cs_bool(value: bool) -> &'static str {
    if value {
        "true"
    } else {
        "false"
    }
}

/// A C# double literal — integers render as `2.0` so the type is unambiguous.
fn cs_double(value: f64) -> String {
    if value.fract() == 0.0 {
        format!("{}.0", value as i64)
    } else {
        format!("{value}")
    }
}

/// A C# integer literal from a JSON number (mirrors JS `${n}` for an int).
fn cs_int(value: &Value) -> String {
    if let Some(i) = value.as_i64() {
        i.to_string()
    } else {
        (value.as_f64().unwrap_or(0.0) as i64).to_string()
    }
}

fn get<'a>(v: &'a Value, path: &[&str]) -> Option<&'a Value> {
    let mut cur = v;
    for k in path {
        cur = cur.get(k)?;
    }
    Some(cur)
}

fn get_str<'a>(v: &'a Value, path: &[&str]) -> &'a str {
    get(v, path).and_then(Value::as_str).unwrap_or("")
}

fn get_bool(v: &Value, path: &[&str]) -> bool {
    get(v, path).and_then(Value::as_bool).unwrap_or(false)
}

fn get_f64(v: &Value, path: &[&str]) -> f64 {
    get(v, path).and_then(Value::as_f64).unwrap_or(0.0)
}

// ---- error-kind classes (sdk.errors) --------------------------------------

/// The C# exception class for a policy error kind: `NotFound` -> `NotFoundException`;
/// the canonical client kind `API` IS the `ApiException` base.
fn error_class_name(kind: &str) -> String {
    if kind == "API" {
        "ApiException".to_string()
    } else {
        format!("{}Exception", pascal_case(kind))
    }
}

/// The per-kind exception subclasses (sorted by class name, base excluded).
fn error_class_decls(behavior: &Value) -> String {
    // class -> kind, first-seen wins (mirrors the JS Map insertion + de-dup).
    let mut by_class: Vec<(String, String)> = Vec::new();
    let mut add = |kind: &str| {
        let cls = error_class_name(kind);
        if cls != "ApiException" && !by_class.iter().any(|(c, _)| c == &cls) {
            by_class.push((cls, kind.to_string()));
        }
    };
    if let Some(map) = get(behavior, &["errors", "statusCodeMap"]).and_then(Value::as_object) {
        for kind in map.values() {
            if let Some(k) = kind.as_str() {
                add(k);
            }
        }
    }
    add(get_str(behavior, &["errors", "serverErrorKind"]));
    add(get_str(behavior, &["errors", "clientErrorKind"]));

    by_class.sort_by(|(a, _), (b, _)| a.cmp(b));
    by_class
        .iter()
        .map(|(cls, kind)| {
            [
                format!("/// <summary>The typed exception for the {kind} error kind.</summary>"),
                format!("public sealed class {cls} : ApiException"),
                "{".to_string(),
                format!("    public {cls}(int statusCode, string? responseBody, string? requestId, string message)"),
                "        : base(statusCode, responseBody, requestId, message)".to_string(),
                "    {".to_string(),
                "    }".to_string(),
                String::new(),
                "    /// <inheritdoc/>".to_string(),
                format!("    public override string Kind => {};", json_string(kind)),
                "}".to_string(),
            ]
            .join("\n")
        })
        .collect::<Vec<_>>()
        .join("\n\n")
}

/// The status -> exception dispatch (switch expression body).
fn error_dispatch(behavior: &Value) -> String {
    let mut mapped: Vec<(i64, String)> = Vec::new();
    if let Some(map) = get(behavior, &["errors", "statusCodeMap"]).and_then(Value::as_object) {
        for (status, kind) in map {
            if let (Ok(code), Some(k)) = (status.parse::<i64>(), kind.as_str()) {
                mapped.push((code, k.to_string()));
            }
        }
    }
    mapped.sort_by_key(|(status, _)| *status);
    let args = "status, body, requestId, message";
    let cases: Vec<String> = mapped
        .iter()
        .map(|(status, kind)| {
            format!(
                "            {status} => new {}({args}),",
                error_class_name(kind)
            )
        })
        .collect();
    let server_class = error_class_name(get_str(behavior, &["errors", "serverErrorKind"]));
    let client_class = error_class_name(get_str(behavior, &["errors", "clientErrorKind"]));
    format!(
        "        return status switch\n        {{\n{}\n            _ => status >= 500 ? new {server_class}({args}) : new {client_class}({args}),\n        }};",
        cases.join("\n")
    )
}

// ---- auth ------------------------------------------------------------------

/// The auth statements, split by phase: `url` mutates the URL before the request
/// is built (apiKey-query), `header` adds a header after. Guarded on a non-empty
/// credential.
fn auth_blocks(spec: &Value) -> (String, String) {
    let Some(scheme) = spec
        .get("security")
        .and_then(Value::as_array)
        .and_then(|a| a.first())
    else {
        return (String::new(), String::new());
    };
    let name = scheme.get("name").and_then(Value::as_str).unwrap_or("");
    let guard = |stmt: String| {
        format!("        if (!string.IsNullOrEmpty(_apiKey))\n        {{\n            {stmt}\n        }}\n")
    };
    match scheme.get("kind").and_then(Value::as_str) {
        Some("apiKey-query") => (
            guard(format!(
                "url += (url.Contains('?') ? \"&\" : \"?\") + {} + Uri.EscapeDataString(_apiKey);",
                json_string(&format!("{name}="))
            )),
            String::new(),
        ),
        Some("apiKey-header") => (
            String::new(),
            guard(format!(
                "request.Headers.TryAddWithoutValidation({}, _apiKey);",
                json_string(name)
            )),
        ),
        _ => (
            String::new(),
            guard(
                "request.Headers.TryAddWithoutValidation(\"Authorization\", \"Bearer \" + _apiKey);"
                    .to_string(),
            ),
        ),
    }
}

// ---- constants -------------------------------------------------------------

fn constants_block(spec: &Value, behavior: &Value, ctx: &DotnetRuntimeCtx) -> String {
    let version = spec
        .get("info")
        .and_then(|i| i.get("version"))
        .and_then(Value::as_str)
        .filter(|v| !v.is_empty())
        .unwrap_or("0.0.0");
    let user_agent = get_str(behavior, &["userAgent", "sdkIdentifierTemplate"])
        .replace("{package}", ctx.sdk)
        .replace("{language}", "dotnet")
        .replace("{version}", version);

    let ai_entries = get(behavior, &["userAgent", "aiAgentEnvVars"])
        .and_then(Value::as_object)
        .map(|m| {
            m.iter()
                .map(|(env, slug)| {
                    format!(
                        "        [{}] = {},",
                        json_string(env),
                        json_string(slug.as_str().unwrap_or(""))
                    )
                })
                .collect::<Vec<_>>()
                .join("\n")
        })
        .unwrap_or_default();

    let codes = get(behavior, &["retry", "retryableStatusCodes"])
        .and_then(Value::as_array)
        .map(|a| {
            a.iter()
                .filter_map(Value::as_i64)
                .map(|n| n.to_string())
                .collect::<Vec<_>>()
                .join(", ")
        })
        .unwrap_or_default();

    let timeout_ms = get(behavior, &["timeout", "defaultTimeoutMs"])
        .map(cs_int)
        .unwrap_or_else(|| "0".to_string());
    let max_retries = get(behavior, &["retry", "maxRetries"])
        .map(cs_int)
        .unwrap_or_else(|| "0".to_string());
    let timeout_env_var = get(behavior, &["timeout", "timeoutEnvVar"])
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty());

    let mut lines: Vec<String> = vec![
        format!(
            "    private const string DefaultBaseUrl = {};",
            json_string(ctx.base_url)
        ),
        format!(
            "    private const string UserAgentIdentifier = {};",
            json_string(&user_agent)
        ),
        format!(
            "    private static readonly bool IncludeRuntimeVersion = {};",
            cs_bool(get_bool(behavior, &["userAgent", "includeRuntimeVersion"]))
        ),
        format!("    private const int DefaultTimeoutMs = {timeout_ms};"),
    ];
    if let Some(env) = timeout_env_var {
        lines.push(format!(
            "    private const string TimeoutEnvVar = {};",
            json_string(env)
        ));
    }
    lines.extend([
        format!("    private const int MaxRetries = {max_retries};"),
        format!(
            "    private static readonly bool RetryConnectionErrors = {};",
            cs_bool(get_bool(behavior, &["retry", "retryConnectionErrors"]))
        ),
        format!(
            "    private static readonly bool HonorRetryAfterHeader = {};",
            cs_bool(get_bool(behavior, &["retry", "honorRetryAfterHeader"]))
        ),
        format!(
            "    private const double BackoffInitialMs = {};",
            cs_double(get_f64(behavior, &["retry", "backoff", "initialDelayMs"]))
        ),
        format!(
            "    private const double BackoffMaxMs = {};",
            cs_double(get_f64(behavior, &["retry", "backoff", "maxDelayMs"]))
        ),
        format!(
            "    private const double BackoffMultiplier = {};",
            cs_double(get_f64(behavior, &["retry", "backoff", "multiplier"]))
        ),
        format!(
            "    private const double BackoffJitter = {};",
            cs_double(get_f64(behavior, &["retry", "backoff", "jitter"]))
        ),
        format!(
            "    private const string RequestIdHeader = {};",
            json_string(get_str(behavior, &["telemetry", "requestIdHeader"]))
        ),
        format!(
            "    private const string IdempotencyHeader = {};",
            json_string(get_str(behavior, &["idempotency", "headerName"]))
        ),
        format!("    private static readonly HashSet<int> RetryableStatusCodes = new() {{ {codes} }};"),
        format!(
            "    private static readonly Dictionary<string, string> AiAgentEnvVars = new()\n    {{\n{ai_entries}\n    }};"
        ),
    ]);
    lines.join("\n")
}

/// Emit `Transport.cs` — the vendored, dependency-free runtime.
pub fn render_transport_file(spec: &Value, ctx: &DotnetRuntimeCtx) -> String {
    let behavior = resolve_behavior(spec);
    let (url_block, header_block) = auth_blocks(spec);

    let runtime_version = if get_bool(&behavior, &["userAgent", "includeRuntimeVersion"]) {
        "        if (IncludeRuntimeVersion)\n        {\n            ua += \" dotnet/\" + Environment.Version.ToString();\n        }\n"
            .to_string()
    } else {
        String::new()
    };

    let timeout_env_var = get(&behavior, &["timeout", "timeoutEnvVar"])
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty());
    let timeout_body = if timeout_env_var.is_some() {
        [
            "        string? raw = Environment.GetEnvironmentVariable(TimeoutEnvVar);",
            "        if (!string.IsNullOrEmpty(raw) && double.TryParse(raw, NumberStyles.Any, CultureInfo.InvariantCulture, out double ms))",
            "        {",
            "            return TimeSpan.FromMilliseconds(ms);",
            "        }",
            "        return DefaultTimeoutMs > 0 ? TimeSpan.FromMilliseconds(DefaultTimeoutMs) : TimeSpan.Zero;",
        ]
        .join("\n")
    } else {
        "        return DefaultTimeoutMs > 0 ? TimeSpan.FromMilliseconds(DefaultTimeoutMs) : TimeSpan.Zero;"
            .to_string()
    };

    TRANSPORT_TEMPLATE
        .replace("__XYD_NAMESPACE__", ctx.namespace)
        .replace("__XYD_ERROR_CLASSES__", &error_class_decls(&behavior))
        .replace("__XYD_CONSTANTS__", &constants_block(spec, &behavior, ctx))
        .replace("__XYD_URL_BLOCK__", &url_block)
        .replace("__XYD_HEADER_BLOCK__", &header_block)
        .replace("__XYD_RUNTIME_VERSION__", &runtime_version)
        .replace("__XYD_TIMEOUT_BODY__", &timeout_body)
        .replace("__XYD_ERROR_DISPATCH__", &error_dispatch(&behavior))
}

/// Emit `Pagination.cs` — the generic page containers list methods return.
pub fn render_pagination_file(namespace: &str) -> String {
    PAGINATION_TEMPLATE.replace("__XYD_NAMESPACE__", namespace)
}
