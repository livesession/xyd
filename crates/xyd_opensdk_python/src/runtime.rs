//! Port of `runtime.ts` — the vendored Python transport (`<pkg>/_transport.py`)
//! and the generic pagination containers (`<pkg>/_pagination.py`). The transport
//! bulk is a fixed urllib client kept as an `include_str!` template
//! (`transport.py.txt`) with seven `__XYD_*__` interpolation seams: the optional
//! `platform` import, the sdk-behavior constants block, the optional error-doc
//! `__str__`, the error-class hierarchy + dispatch, the optional runtime-version
//! UA suffix, the `_default_timeout` body, and the auth statement. Every behavior
//! constant comes from `behavior::resolve_behavior(spec)` so the runtime encodes
//! the declared policy. `_pagination.py` is fully verbatim.

use serde_json::Value;

use crate::behavior::{error_class_name, resolve_behavior};
use crate::val::pystr;

/// The fixed transport source with `__XYD_*__` seams (validated byte-exact
/// against the JS emitter's goldens by the parity suite).
const TRANSPORT_TEMPLATE: &str = include_str!("transport.py.txt");
/// The fixed pagination containers (no seams — pure vendored source).
const PAGINATION: &str = include_str!("pagination.py.txt");

// ---- Python literal helpers (mirror runtime.ts) ----------------------------

fn py_bool(value: bool) -> &'static str {
    if value {
        "True"
    } else {
        "False"
    }
}

/// A Python float literal: integers render as `60.0` so units read as seconds.
fn py_float(value: f64) -> String {
    if value.fract() == 0.0 {
        format!("{}.0", value as i64)
    } else {
        format!("{value}")
    }
}

fn py_frozenset(items: &[String]) -> String {
    if items.is_empty() {
        "frozenset()".to_string()
    } else {
        format!("frozenset({{{}}})", items.join(", "))
    }
}

/// A behavior value at a JSON path, as `&str` ("" when absent / not a string).
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

fn opt_str<'a>(v: &'a Value, path: &[&str]) -> Option<&'a str> {
    let mut cur = v;
    for k in path {
        cur = cur.get(k)?;
    }
    cur.as_str().filter(|s| !s.is_empty())
}

// ---- error-class hierarchy (sdk.errors) ------------------------------------

/// The per-kind exception classes + the status -> class dispatch table +
/// `_error_for_status`, ported from runtime.ts `errorClassesBlock`.
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

    // class -> (kind, statuses), in first-seen order (kind from first occurrence).
    let mut order: Vec<String> = Vec::new();
    let mut by_class: std::collections::HashMap<String, (String, Vec<i64>)> =
        std::collections::HashMap::new();
    for (status, kind) in &mapped {
        let cls = error_class_name(kind);
        if cls == "APIError" {
            continue;
        }
        let entry = by_class
            .entry(cls.clone())
            .or_insert_with(|| (kind.clone(), Vec::new()));
        if entry.1.is_empty() {
            order.push(cls);
        }
        entry.1.push(*status);
    }

    let server_kind = get_str(behavior, &["errors", "serverErrorKind"]);
    let client_kind = get_str(behavior, &["errors", "clientErrorKind"]);
    let server_class = error_class_name(server_kind);
    let client_class = error_class_name(client_kind);

    let error_class = |cls: &str, kind: &str, doc: &str| -> String {
        format!(
            "class {cls}(APIError):\n    \"\"\"{doc}\"\"\"\n\n    kind = {}",
            pystr(kind)
        )
    };

    let mut classes: Vec<String> = Vec::new();
    for cls in &order {
        let (kind, statuses) = &by_class[cls];
        let joined = statuses
            .iter()
            .map(i64::to_string)
            .collect::<Vec<_>>()
            .join("/");
        classes.push(error_class(
            cls,
            kind,
            &format!("The mapped error kind for HTTP {joined} responses."),
        ));
    }
    if server_class != "APIError" && !by_class.contains_key(&server_class) {
        classes.push(error_class(
            &server_class,
            server_kind,
            "Catch-all for unmapped 5xx responses.",
        ));
    }
    if client_class != "APIError"
        && !by_class.contains_key(&client_class)
        && client_class != server_class
    {
        classes.push(error_class(
            &client_class,
            client_kind,
            "Catch-all for unmapped non-5xx error responses.",
        ));
    }

    let table = if mapped.is_empty() {
        "_STATUS_TO_ERROR: dict[int, type] = {}".to_string()
    } else {
        let entries: Vec<String> = mapped
            .iter()
            .map(|(status, kind)| format!("    {status}: {},", error_class_name(kind)))
            .collect();
        format!(
            "_STATUS_TO_ERROR: dict[int, type] = {{\n{}\n}}",
            entries.join("\n")
        )
    };

    let dispatch = format!(
        "def _error_for_status(status_code: int, headers: dict[str, str], body: bytes) -> APIError:\n\
         \x20   \"\"\"The policy-mapped exception: exact status map first, then the 5xx catch-all, then the client catch-all.\"\"\"\n\
         \x20   cls = _STATUS_TO_ERROR.get(status_code)\n\
         \x20   if cls is None:\n\
         \x20       cls = {server_class} if status_code >= 500 else {client_class}\n\
         \x20   return cls(status_code, headers, body)"
    );

    format!("{}\n\n\n{table}\n\n\n{dispatch}", classes.join("\n\n\n"))
}

// ---- the sdk-behavior constants block --------------------------------------

fn constants_block(spec: &Value, behavior: &Value, pkg: &str, base_url: &str) -> String {
    let version = opt_str(spec, &["info", "version"]).unwrap_or("0.0.0");
    let user_agent = get_str(behavior, &["userAgent", "sdkIdentifierTemplate"])
        .replace("{package}", pkg)
        .replace("{language}", "python")
        .replace("{version}", version);

    let ai_agents = behavior
        .get("userAgent")
        .and_then(|u| u.get("aiAgentEnvVars"))
        .and_then(Value::as_object)
        .map(|m| {
            m.iter()
                .map(|(env, slug)| {
                    format!("{}: {}", pystr(env), pystr(slug.as_str().unwrap_or("")))
                })
                .collect::<Vec<_>>()
                .join(", ")
        })
        .unwrap_or_default();

    let codes: Vec<String> = behavior
        .get("retry")
        .and_then(|r| r.get("retryableStatusCodes"))
        .and_then(Value::as_array)
        .map(|a| {
            a.iter()
                .filter_map(Value::as_i64)
                .map(|n| n.to_string())
                .collect()
        })
        .unwrap_or_default();

    let timeout_ms = get_f64(behavior, &["timeout", "defaultTimeoutMs"]);
    let default_timeout = if timeout_ms > 0.0 {
        py_float(timeout_ms / 1000.0)
    } else {
        "None".to_string()
    };
    let timeout_env_var = opt_str(behavior, &["timeout", "timeoutEnvVar"]);
    let error_doc_url = opt_str(behavior, &["errors", "errorDocUrlTemplate"]);
    let max_retries = get_f64(behavior, &["retry", "maxRetries"]) as i64;

    let guarded: Vec<String> = behavior
        .get("requestGuard")
        .and_then(|g| g.get("optionKeys"))
        .and_then(Value::as_array)
        .map(|a| a.iter().filter_map(Value::as_str).map(pystr).collect())
        .unwrap_or_default();

    let mut lines: Vec<String> = vec![
        format!("DEFAULT_BASE_URL = {}", pystr(base_url)),
        format!("USER_AGENT = {}", pystr(&user_agent)),
        format!("AI_AGENT_ENV_VARS = {{{ai_agents}}}"),
        format!("DEFAULT_TIMEOUT: Optional[float] = {default_timeout}"),
    ];
    if let Some(env) = timeout_env_var {
        lines.push(format!("TIMEOUT_ENV_VAR = {}", pystr(env)));
    }
    lines.push(format!("MAX_RETRIES = {max_retries}"));
    lines.push(format!("RETRYABLE_STATUS_CODES = {}", py_frozenset(&codes)));
    lines.push(format!(
        "RETRY_CONNECTION_ERRORS = {}",
        py_bool(get_bool(behavior, &["retry", "retryConnectionErrors"]))
    ));
    lines.push(format!(
        "HONOR_RETRY_AFTER_HEADER = {}",
        py_bool(get_bool(behavior, &["retry", "honorRetryAfterHeader"]))
    ));
    lines.push(format!(
        "BACKOFF_INITIAL_DELAY = {}",
        py_float(get_f64(behavior, &["retry", "backoff", "initialDelayMs"]) / 1000.0)
    ));
    lines.push(format!(
        "BACKOFF_MAX_DELAY = {}",
        py_float(get_f64(behavior, &["retry", "backoff", "maxDelayMs"]) / 1000.0)
    ));
    lines.push(format!(
        "BACKOFF_MULTIPLIER = {}",
        py_float(get_f64(behavior, &["retry", "backoff", "multiplier"]))
    ));
    lines.push(format!(
        "BACKOFF_JITTER = {}",
        py_float(get_f64(behavior, &["retry", "backoff", "jitter"]))
    ));
    lines.push(format!(
        "REQUEST_ID_HEADER = {}",
        pystr(get_str(behavior, &["telemetry", "requestIdHeader"]))
    ));
    lines.push(format!(
        "IDEMPOTENCY_HEADER = {}",
        pystr(get_str(behavior, &["idempotency", "headerName"]))
    ));
    if let Some(tpl) = error_doc_url {
        lines.push(format!("ERROR_DOC_URL_TEMPLATE = {}", pystr(tpl)));
    }
    lines.push(format!("GUARDED_OPTION_KEYS = {}", py_frozenset(&guarded)));
    lines.join("\n")
}

// ---- the auth statement (first security scheme) ----------------------------

fn auth_block(spec: &Value) -> String {
    let Some(security) = spec
        .get("security")
        .and_then(Value::as_array)
        .and_then(|a| a.first())
    else {
        return String::new();
    };
    let name = security.get("name").and_then(Value::as_str).unwrap_or("");
    let auth_line = match security.get("kind").and_then(Value::as_str) {
        Some("apiKey-header") => {
            format!(
                "            request_headers[{}] = self.api_key\n",
                pystr(name)
            )
        }
        Some("apiKey-query") => format!("            params[{}] = self.api_key\n", pystr(name)),
        _ => "            request_headers[\"Authorization\"] = \"Bearer \" + self.api_key\n"
            .to_string(),
    };
    format!("        if self.api_key:\n{auth_line}")
}

/// Render the vendored `_transport.py` body (no ownership header — the caller
/// prepends it, matching the framework orchestrator).
pub fn transport_py(spec: &Value, pkg: &str, base_url: &str) -> String {
    let behavior = resolve_behavior(spec);
    let include_runtime_version = get_bool(&behavior, &["userAgent", "includeRuntimeVersion"]);
    let timeout_env_var = opt_str(&behavior, &["timeout", "timeoutEnvVar"]);
    let error_doc_url = opt_str(&behavior, &["errors", "errorDocUrlTemplate"]);

    let platform_import = if include_runtime_version {
        "\nimport platform"
    } else {
        ""
    };
    let runtime_version = if include_runtime_version {
        "\n    ua += \" python/\" + platform.python_version()"
    } else {
        ""
    };
    let error_doc_str = if error_doc_url.is_some() {
        "\n\n    def __str__(self) -> str:\n        \
         url = ERROR_DOC_URL_TEMPLATE.replace(\"{kind}\", self.kind).replace(\"{status}\", str(self.status_code))\n        \
         return self.message + \" (\" + url + \")\""
    } else {
        ""
    };
    let default_timeout_body = if timeout_env_var.is_some() {
        "    \"\"\"The policy default timeout in seconds; TIMEOUT_ENV_VAR (milliseconds) overrides it when set.\"\"\"\n    \
         raw = os.environ.get(TIMEOUT_ENV_VAR)\n    \
         if raw:\n        \
         try:\n            \
         return float(raw) / 1000.0\n        \
         except ValueError:\n            \
         pass\n    \
         return DEFAULT_TIMEOUT"
            .to_string()
    } else {
        "    \"\"\"The policy default timeout in seconds (None = no deadline).\"\"\"\n    \
         return DEFAULT_TIMEOUT"
            .to_string()
    };

    TRANSPORT_TEMPLATE
        .replace("__XYD_PLATFORM_IMPORT__", platform_import)
        .replace(
            "__XYD_CONSTANTS__",
            &constants_block(spec, &behavior, pkg, base_url),
        )
        .replace("__XYD_ERROR_DOC_STR__", error_doc_str)
        .replace("__XYD_ERROR_CLASSES__", &error_classes_block(&behavior))
        .replace("__XYD_RUNTIME_VERSION__", runtime_version)
        .replace("__XYD_DEFAULT_TIMEOUT_BODY__", &default_timeout_body)
        .replace("__XYD_AUTH_BLOCK__", &auth_block(spec))
}

/// The vendored `_pagination.py` (verbatim; no interpolation).
pub fn pagination_py() -> String {
    PAGINATION.to_string()
}
