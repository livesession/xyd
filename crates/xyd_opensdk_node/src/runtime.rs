//! The vendored dependency-free TypeScript runtime (`src/core/**`). Ports
//! `runtime.ts` `runtimeFiles` — the global-`fetch` transport (`request.ts`),
//! the `APIError` hierarchy + status dispatch (`error.ts`), the resource base
//! (`resource.ts`), and the vendored page containers (`pagination.ts`, emitted
//! only when some list method pages).
//!
//! The bulk of each file is fixed TypeScript kept as an `include_str!` template
//! (a sibling `*.ts.txt`, so `cargo fmt` can never touch the emitted bytes) with
//! `__XYD_*__` seams substituted here. Every behavior constant comes from
//! `behavior::resolve_behavior(spec)` so the runtime encodes the declared policy;
//! `resource.ts` / `pagination.ts` are entirely fixed.

use serde_json::Value;

use crate::behavior::resolve_behavior;
use crate::jsrt::json_string;

/// The fixed runtime sources with `__XYD_*__` seams (validated byte-exact against
/// the JS emitter's goldens).
const ERROR_TEMPLATE: &str = include_str!("core_error.ts.txt");
const REQUEST_TEMPLATE: &str = include_str!("core_request.ts.txt");
const RESOURCE_TEMPLATE: &str = include_str!("core_resource.ts.txt");
const PAGINATION_TEMPLATE: &str = include_str!("core_pagination.ts.txt");

/// The vendored runtime files as `(relPath, content)` pairs (no ownership header
/// — the caller's `with_file_header` prepends it, matching the orchestrator).
/// `pagination.ts` is included only when some list method pages.
pub fn runtime_files(
    spec_json: &Value,
    base_url: &str,
    pkg: &str,
    with_pagination: bool,
) -> Vec<(String, String)> {
    let behavior = resolve_behavior(spec_json);
    let mut files = vec![
        ("src/core/error.ts".to_string(), error_ts(&behavior)),
        (
            "src/core/resource.ts".to_string(),
            RESOURCE_TEMPLATE.to_string(),
        ),
        (
            "src/core/request.ts".to_string(),
            request_ts(spec_json, &behavior, base_url, pkg),
        ),
    ];
    if with_pagination {
        files.push((
            "src/core/pagination.ts".to_string(),
            PAGINATION_TEMPLATE.to_string(),
        ));
    }
    files
}

// ---- literal helpers -------------------------------------------------------

fn ts_bool(value: bool) -> &'static str {
    if value {
        "true"
    } else {
        "false"
    }
}

/// A JSON number rendered the way JS `String(number)` would: an integer stays
/// integral, a fractional float keeps its decimals (default behavior only ever
/// yields ints + `0.25`, so this matches the goldens exactly).
fn num_ts(v: &Value) -> String {
    if let Some(i) = v.as_i64() {
        return i.to_string();
    }
    if let Some(u) = v.as_u64() {
        return u.to_string();
    }
    match v.as_f64() {
        Some(f) if f.fract() == 0.0 && f.is_finite() && f.abs() < 1e15 => (f as i64).to_string(),
        Some(f) => f.to_string(),
        None => "0".to_string(),
    }
}

/// `{ "k": "v", ... }` in object insertion order (serde_json `preserve_order`).
fn ts_str_record(obj: &serde_json::Map<String, Value>) -> String {
    let entries: Vec<String> = obj
        .iter()
        .map(|(k, v)| {
            format!(
                "{}: {}",
                json_string(k),
                json_string(v.as_str().unwrap_or(""))
            )
        })
        .collect();
    format!("{{ {} }}", entries.join(", "))
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

fn num_at(v: &Value, path: &[&str]) -> String {
    get(v, path).map(num_ts).unwrap_or_else(|| "0".to_string())
}

// ---- error.ts --------------------------------------------------------------

/// The class name for a policy error kind: `NotFound` -> `NotFoundError`; the
/// canonical `API` kind IS `APIError`.
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

/// The per-kind subclasses + the status -> class dispatch table + errorForStatus().
fn error_classes_block(behavior: &Value) -> String {
    // (status, kind) pairs, numerically sorted (several statuses may share a kind).
    let mut mapped: Vec<(i64, String)> = Vec::new();
    if let Some(scm) = get(behavior, &["errors", "statusCodeMap"]).and_then(Value::as_object) {
        for (status, kind) in scm {
            if let (Ok(code), Some(k)) = (status.parse::<i64>(), kind.as_str()) {
                mapped.push((code, k.to_string()));
            }
        }
    }
    mapped.sort_by_key(|(status, _)| *status);

    // class -> (kind, statuses) in first-seen order (several statuses may share a kind).
    let mut order: Vec<(String, String, Vec<i64>)> = Vec::new();
    for (status, kind) in &mapped {
        let cls = error_class_name(kind);
        if cls == "APIError" {
            continue;
        }
        if let Some(entry) = order.iter_mut().find(|(c, _, _)| *c == cls) {
            entry.2.push(*status);
        } else {
            order.push((cls, kind.clone(), vec![*status]));
        }
    }

    let server_kind = get_str(behavior, &["errors", "serverErrorKind"]);
    let client_kind = get_str(behavior, &["errors", "clientErrorKind"]);
    let server_class = error_class_name(server_kind);
    let client_class = error_class_name(client_kind);

    let subclass = |cls: &str, kind: &str, doc: &str| -> String {
        format!(
            "/** {doc} */\nexport class {cls} extends APIError {{\n  override readonly kind = {};\n}}",
            json_string(kind)
        )
    };

    let mut classes: Vec<String> = order
        .iter()
        .map(|(cls, kind, statuses)| {
            let joined: Vec<String> = statuses.iter().map(i64::to_string).collect();
            subclass(
                cls,
                kind,
                &format!("The mapped error for HTTP {} responses.", joined.join("/")),
            )
        })
        .collect();

    let has_class = |c: &str| order.iter().any(|(cls, _, _)| cls == c);
    if server_class != "APIError" && !has_class(&server_class) {
        classes.push(subclass(
            &server_class,
            server_kind,
            "Catch-all for unmapped 5xx responses.",
        ));
    }
    if client_class != "APIError" && !has_class(&client_class) && client_class != server_class {
        classes.push(subclass(
            &client_class,
            client_kind,
            "Catch-all for unmapped non-5xx responses.",
        ));
    }

    let table = if mapped.is_empty() {
        "const STATUS_TO_ERROR: Record<number, APIErrorConstructor> = {};".to_string()
    } else {
        let entries: Vec<String> = mapped
            .iter()
            .map(|(status, kind)| format!("  {status}: {},", error_class_name(kind)))
            .collect();
        format!(
            "const STATUS_TO_ERROR: Record<number, APIErrorConstructor> = {{\n{}\n}};",
            entries.join("\n")
        )
    };

    format!(
        "{classes}\n\n{table}\n\n/** The policy-mapped error: exact status map first, then the 5xx catch-all, then the client catch-all. */\nexport function errorForStatus(status: number, message: string, headers: Headers, body: string): APIError {{\n  const Ctor = STATUS_TO_ERROR[status] ?? (status >= 500 ? {server_class} : {client_class});\n  return new Ctor(status, message, headers, body);\n}}",
        classes = classes.join("\n\n"),
    )
}

fn error_ts(behavior: &Value) -> String {
    let request_id_header = get_str(behavior, &["telemetry", "requestIdHeader"]);
    let doc_template = get_str(behavior, &["errors", "errorDocUrlTemplate"]);
    let doc_block = if doc_template.is_empty() {
        String::new()
    } else {
        format!(
            "\n  /** A documentation URL for this error kind (sdk.errors.errorDocUrlTemplate). */\n  docURL(): string {{\n    return {}.replace('{{kind}}', this.kind).replace('{{status}}', String(this.status));\n  }}\n",
            json_string(doc_template)
        )
    };
    ERROR_TEMPLATE
        .replace("__XYD_REQUEST_ID_HEADER__", &json_string(request_id_header))
        .replace("__XYD_DOC_BLOCK__", &doc_block)
        .replace("__XYD_ERROR_CLASSES__", &error_classes_block(behavior))
}

// ---- request.ts ------------------------------------------------------------

/// The auth statement injected into request(), by security kind (first scheme wins).
fn auth_statement(spec_json: &Value) -> String {
    let Some(scheme) = spec_json
        .get("security")
        .and_then(Value::as_array)
        .and_then(|a| a.first())
    else {
        return String::new();
    };
    let name = scheme.get("name").and_then(Value::as_str).unwrap_or("");
    match scheme.get("kind").and_then(Value::as_str) {
        Some("apiKey-header") => {
            format!(
                "    if (this.apiKey) headers[{}] = this.apiKey;\n",
                json_string(name)
            )
        }
        Some("apiKey-query") => format!(
            "    if (this.apiKey) url.searchParams.set({}, this.apiKey);\n",
            json_string(name)
        ),
        Some("apiKey-cookie") => format!(
            "    if (this.apiKey) headers['Cookie'] = {} + this.apiKey;\n",
            json_string(&format!("{name}="))
        ),
        // bearer / http — the common case.
        _ => {
            "    if (this.apiKey) headers['Authorization'] = 'Bearer ' + this.apiKey;\n".to_string()
        }
    }
}

/// The `module`-level behavior constants block (no leading/trailing newline).
fn constants_block(spec_json: &Value, behavior: &Value, base_url: &str, pkg: &str) -> String {
    let version = spec_json
        .get("info")
        .and_then(|i| i.get("version"))
        .and_then(Value::as_str)
        .filter(|v| !v.is_empty())
        .unwrap_or("0.0.0");
    let user_agent = get_str(behavior, &["userAgent", "sdkIdentifierTemplate"])
        .replace("{package}", pkg)
        .replace("{language}", "node")
        .replace("{version}", version);

    let ai_agents = get(behavior, &["userAgent", "aiAgentEnvVars"])
        .and_then(Value::as_object)
        .map(ts_str_record)
        .unwrap_or_else(|| "{  }".to_string());

    let codes = get(behavior, &["retry", "retryableStatusCodes"])
        .and_then(Value::as_array)
        .map(|a| a.iter().map(num_ts).collect::<Vec<_>>().join(", "))
        .unwrap_or_default();

    let timeout_env_var = get_str(behavior, &["timeout", "timeoutEnvVar"]);

    let mut lines = vec![
        format!("export const DEFAULT_BASE_URL = {};", json_string(base_url)),
        format!("const USER_AGENT = {};", json_string(&user_agent)),
        format!("const AI_AGENT_ENV_VARS: Record<string, string> = {ai_agents};"),
        format!(
            "const DEFAULT_TIMEOUT_MS = {};",
            num_at(behavior, &["timeout", "defaultTimeoutMs"])
        ),
    ];
    if !timeout_env_var.is_empty() {
        lines.push(format!(
            "const TIMEOUT_ENV_VAR = {};",
            json_string(timeout_env_var)
        ));
    }
    lines.extend([
        format!(
            "const MAX_RETRIES = {};",
            num_at(behavior, &["retry", "maxRetries"])
        ),
        format!("const RETRYABLE_STATUS_CODES = new Set<number>([{codes}]);"),
        format!(
            "const RETRY_CONNECTION_ERRORS = {};",
            ts_bool(get_bool(behavior, &["retry", "retryConnectionErrors"]))
        ),
        format!(
            "const HONOR_RETRY_AFTER_HEADER = {};",
            ts_bool(get_bool(behavior, &["retry", "honorRetryAfterHeader"]))
        ),
        format!(
            "const BACKOFF_INITIAL_DELAY_MS = {};",
            num_at(behavior, &["retry", "backoff", "initialDelayMs"])
        ),
        format!(
            "const BACKOFF_MAX_DELAY_MS = {};",
            num_at(behavior, &["retry", "backoff", "maxDelayMs"])
        ),
        format!(
            "const BACKOFF_MULTIPLIER = {};",
            num_at(behavior, &["retry", "backoff", "multiplier"])
        ),
        format!(
            "const BACKOFF_JITTER = {};",
            num_at(behavior, &["retry", "backoff", "jitter"])
        ),
        format!(
            "const IDEMPOTENCY_HEADER = {};",
            json_string(get_str(behavior, &["idempotency", "headerName"]))
        ),
    ]);
    lines.join("\n")
}

fn request_ts(spec_json: &Value, behavior: &Value, base_url: &str, pkg: &str) -> String {
    let timeout_env_var = get_str(behavior, &["timeout", "timeoutEnvVar"]);
    let timeout_body = if timeout_env_var.is_empty() {
        "  return DEFAULT_TIMEOUT_MS;".to_string()
    } else {
        "  const raw = readEnv(TIMEOUT_ENV_VAR);\n  if (raw) {\n    const parsed = Number(raw);\n    if (Number.isFinite(parsed)) return parsed;\n  }\n  return DEFAULT_TIMEOUT_MS;".to_string()
    };
    let runtime_version = if get_bool(behavior, &["userAgent", "includeRuntimeVersion"]) {
        "  if (typeof process !== 'undefined' && process?.versions?.node) ua += ' node/' + process.versions.node;\n".to_string()
    } else {
        String::new()
    };

    REQUEST_TEMPLATE
        .replace(
            "__XYD_CONSTANTS__",
            &constants_block(spec_json, behavior, base_url, pkg),
        )
        .replace("__XYD_RUNTIME_VERSION__", &runtime_version)
        .replace("__XYD_TIMEOUT_BODY__", &timeout_body)
        .replace("__XYD_AUTH__", &auth_statement(spec_json))
}
