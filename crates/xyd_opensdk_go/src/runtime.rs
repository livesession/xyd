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
// Templated runtime source with __XYD_*__ seams.
const OPTION_GO: &str = include_str!("option.go.txt");
const PAGINATION_GO: &str = include_str!("pagination.go.txt");
const REQUESTCONFIG_GO: &str = include_str!("requestconfig.go.txt");

/// The `case "multipart" | "form"` branch prepended to marshalBody when some
/// request body is form-encoded (`__XYD_RC_FORM_BRANCH__`).
const FORM_BRANCH: &str = "\tswitch cfg.Encoding {\n\tcase \"multipart\":\n\t\treturn apiform.MarshalMultipart(cfg.Body)\n\tcase \"form\":\n\t\tbody, err = apiform.MarshalForm(cfg.Body)\n\t\treturn body, \"application/x-www-form-urlencoded\", err\n\t}\n";

/// The dependency-free UUIDv4 helper appended to requestconfig.go when some
/// method auto-injects an idempotency key (`__XYD_RC_IDEMPOTENCY__`).
const IDEMPOTENCY_HELPER: &str = "\n\n// NewIdempotencyKey returns a fresh UUIDv4 (crypto/rand, dependency-free) for\n// idempotency-key injection: generated methods set it once per logical call,\n// so every retry replays the SAME key (sdk.idempotency).\nfunc NewIdempotencyKey() string {\n\tvar b [16]byte\n\tif _, err := cryptorand.Read(b[:]); err != nil {\n\t\t// crypto/rand failing is effectively unreachable; fall back to a\n\t\t// time-based key rather than panicking inside a request path.\n\t\treturn fmt.Sprintf(\"fallback-%d\", time.Now().UnixNano())\n\t}\n\tb[6] = (b[6] & 0x0f) | 0x40 // version 4\n\tb[8] = (b[8] & 0x3f) | 0x80 // RFC 4122 variant\n\treturn fmt.Sprintf(\"%x-%x-%x-%x-%x\", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])\n}";

// ---- sdk-behavior rendering helpers (ports of runtime.ts's) ----------------

/// A Go `time.Duration` expression from milliseconds (`goMs`).
fn go_ms(ms: i64) -> String {
    format!("{ms} * time.Millisecond")
}

/// A Go float literal (`goFloat`): whole numbers keep an explicit `.0`.
fn go_float(v: f64) -> String {
    if v.fract() == 0.0 {
        format!("{}.0", v as i64)
    } else {
        // `{}` on f64 already yields JS-style shortest round-trip for these.
        format!("{v}")
    }
}

/// gofmt-style aligned `name = value` lines for a const block (`alignedConsts`).
/// The alignment is byte-significant: gofmt would produce exactly this, and the
/// goldens record it.
fn aligned_consts(entries: &[(&str, String)]) -> String {
    let width = entries.iter().map(|(n, _)| n.len()).max().unwrap_or(0);
    entries
        .iter()
        .map(|(name, value)| format!("\t{name:<width$} = {value}"))
        .collect::<Vec<_>>()
        .join("\n")
}

/// `behavior[section][key]`, absent-safe.
fn bkey<'a>(behavior: &'a Value, section: &str, key: &str) -> Option<&'a Value> {
    behavior.get(section).and_then(|s| s.get(key))
}

fn bstr<'a>(behavior: &'a Value, section: &str, key: &str) -> Option<&'a str> {
    bkey(behavior, section, key).and_then(|v| v.as_str())
}

fn bbool(behavior: &Value, section: &str, key: &str, default: bool) -> bool {
    bkey(behavior, section, key)
        .and_then(|v| v.as_bool())
        .unwrap_or(default)
}

fn bi64(behavior: &Value, section: &str, key: &str, default: i64) -> i64 {
    bkey(behavior, section, key)
        .and_then(|v| v.as_i64())
        .unwrap_or(default)
}

/// `requestconfig/config.go` — every per-spec and per-policy constant.
///
/// Built programmatically rather than from a `.go.txt` template because three of
/// its regions change SHAPE, not just values: the import list grows with
/// `includeRuntimeVersion` / `timeoutEnvVar`, the timeout region is either a
/// `const` or a `var` + resolver func, and the user-agent region is a bare
/// `const`, or a probe table, or a func — in any combination. A seam-per-region
/// template would be seams end to end. This mirrors `runtime.ts`'s `configGo`
/// statement for statement.
fn config_go(spec: &Value, base_url: &str, pkg: &str, behavior: &Value) -> String {
    let agents: Vec<(&str, &str)> = bkey(behavior, "userAgent", "aiAgentEnvVars")
        .and_then(|v| v.as_object())
        .map(|m| {
            m.iter()
                .filter_map(|(k, v)| v.as_str().map(|s| (k.as_str(), s)))
                .collect()
        })
        .unwrap_or_default();
    let include_runtime_version = bbool(behavior, "userAgent", "includeRuntimeVersion", false);
    let timeout_env_var = bstr(behavior, "timeout", "timeoutEnvVar");
    let needs_user_agent_func = include_runtime_version || !agents.is_empty();

    // --- imports ------------------------------------------------------------
    let mut imports = vec!["\"net/http\"", "\"time\""];
    if !agents.is_empty() || timeout_env_var.is_some() {
        imports.push("\"os\"");
    }
    if include_runtime_version {
        imports.push("\"runtime\"");
    }
    if timeout_env_var.is_some() {
        imports.push("\"strconv\"");
    }
    imports.sort_unstable();
    let import_block = imports
        .iter()
        .map(|i| format!("\t{i}"))
        .collect::<Vec<_>>()
        .join("\n");

    // --- retry policy --------------------------------------------------------
    let retry_consts = aligned_consts(&[
        (
            "defaultMaxRetries",
            bi64(behavior, "retry", "maxRetries", 2).to_string(),
        ),
        (
            "retryConnectionErrors",
            bbool(behavior, "retry", "retryConnectionErrors", true).to_string(),
        ),
        (
            "honorRetryAfterHeader",
            bbool(behavior, "retry", "honorRetryAfterHeader", true).to_string(),
        ),
        (
            "backoffInitialDelay",
            go_ms(backoff_i64(behavior, "initialDelayMs", 500)),
        ),
        (
            "backoffMaxDelay",
            go_ms(backoff_i64(behavior, "maxDelayMs", 8000)),
        ),
        (
            "backoffMultiplier",
            go_float(backoff_f64(behavior, "multiplier", 2.0)),
        ),
        (
            "backoffJitter",
            go_float(backoff_f64(behavior, "jitter", 0.25)),
        ),
    ]);

    let statuses: Vec<i64> = bkey(behavior, "retry", "retryableStatusCodes")
        .and_then(|v| v.as_array())
        .map(|a| a.iter().filter_map(|v| v.as_i64()).collect())
        .unwrap_or_default();
    let status_set = if statuses.is_empty() {
        "map[int]bool{}".to_string()
    } else {
        let width = statuses
            .iter()
            .map(|s| format!("{s}:").len())
            .max()
            .unwrap_or(0);
        let rows = statuses
            .iter()
            .map(|s| format!("\t{:<width$} true,", format!("{s}:")))
            .collect::<Vec<_>>()
            .join("\n");
        format!("map[int]bool{{\n{rows}\n}}")
    };

    // --- timeout policy -------------------------------------------------------
    let default_timeout_ms = bi64(behavior, "timeout", "defaultTimeoutMs", 60000);
    let timeout_block = match timeout_env_var {
        Some(env) => format!(
            "// defaultRequestTimeout is the per-attempt deadline applied when no\n\
             // option.WithRequestTimeout is given: sdk.timeout.defaultTimeoutMs,\n\
             // overridable via the {env} env var (milliseconds).\n\
             var defaultRequestTimeout = resolveRequestTimeout()\n\
             \n\
             func resolveRequestTimeout() time.Duration {{\n\
             \tif raw := os.Getenv({}); raw != \"\" {{\n\
             \t\tif ms, err := strconv.Atoi(raw); err == nil && ms >= 0 {{\n\
             \t\t\treturn time.Duration(ms) * time.Millisecond\n\
             \t\t}}\n\
             \t}}\n\
             \treturn {}\n\
             }}",
            json_string(env),
            go_ms(default_timeout_ms)
        ),
        None => format!(
            "// defaultRequestTimeout is the per-attempt deadline applied when no\n\
             // option.WithRequestTimeout is given (sdk.timeout.defaultTimeoutMs).\n\
             const defaultRequestTimeout = {}",
            go_ms(default_timeout_ms)
        ),
    };

    // --- user agent -----------------------------------------------------------
    let version = spec
        .get("info")
        .and_then(|i| i.get("version"))
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let identifier = bstr(behavior, "userAgent", "sdkIdentifierTemplate")
        .unwrap_or("{package}-{language}/{version}")
        .replace("{package}", pkg)
        .replace("{language}", "go")
        .replace("{version}", version);

    let ua_block = if !needs_user_agent_func {
        format!(
            "// defaultUserAgent identifies this SDK on every request, from the\n\
             // sdk.userAgent template (overridable via option.WithHeader(\"User-Agent\", ...)).\n\
             const defaultUserAgent = {}",
            json_string(&identifier)
        )
    } else {
        let mut parts: Vec<String> = Vec::new();
        if !agents.is_empty() {
            let rows = agents
                .iter()
                .map(|(env, slug)| format!("\t{{{}, {}}},", json_string(env), json_string(slug)))
                .collect::<Vec<_>>()
                .join("\n");
            parts.push(format!(
                "// aiAgentProbe pairs an agent-detection env var with its User-Agent slug.\n\
                 type aiAgentProbe struct {{\n\tenvVar string\n\tslug   string\n}}\n\n\
                 // aiAgentEnvVars appends an attribution slug to the User-Agent when a known\n\
                 // AI coding agent's env var is set (sdk.userAgent.aiAgentEnvVars); the first\n\
                 // env var set at init wins.\n\
                 var aiAgentEnvVars = []aiAgentProbe{{\n{rows}\n}}"
            ));
        }
        let runtime_line = if include_runtime_version {
            "\tua += \" \" + runtime.Version()\n"
        } else {
            ""
        };
        let sniff_lines = if agents.is_empty() {
            String::new()
        } else {
            "\tfor _, agent := range aiAgentEnvVars {\n\
             \t\tif os.Getenv(agent.envVar) != \"\" {\n\
             \t\t\tua += \" agent/\" + agent.slug\n\
             \t\t\tbreak\n\
             \t\t}\n\
             \t}\n"
                .to_string()
        };
        parts.push(format!(
            "// defaultUserAgent identifies this SDK on every request, assembled once at\n\
             // init per sdk.userAgent (overridable via option.WithHeader(\"User-Agent\", ...)).\n\
             var defaultUserAgent = userAgent()\n\
             \n\
             func userAgent() string {{\n\tua := {}\n{runtime_line}{sniff_lines}\treturn ua\n}}",
            json_string(&identifier)
        ));
        parts.join("\n\n")
    };

    let auth_body = apply_auth_body(spec);
    let request_id_header =
        bstr(behavior, "telemetry", "requestIdHeader").unwrap_or("X-Request-ID");

    format!(
        "package requestconfig\n\
         \n\
         import (\n{import_block}\n)\n\
         \n\
         // DefaultBaseURL is the production API endpoint.\n\
         const DefaultBaseURL = {}\n\
         \n\
         // Retry policy (sdk.retry): how many transient failures are retried and the\n\
         // shape of the exponential backoff between attempts.\n\
         const (\n{retry_consts}\n)\n\
         \n\
         // retryableStatuses is the set of HTTP statuses that trigger a retry\n\
         // (sdk.retry.retryableStatusCodes).\n\
         var retryableStatuses = {status_set}\n\
         \n\
         {timeout_block}\n\
         \n\
         // requestIDHeader is the response header carrying the server-assigned request\n\
         // id, surfaced as APIError.RequestID (sdk.telemetry.requestIdHeader).\n\
         const requestIDHeader = {}\n\
         \n\
         {ua_block}\n\
         \n\
         // applyAuth attaches the configured credential to the outgoing request.\n\
         func (cfg *RequestConfig) applyAuth(req *http.Request) {{{}}}\n",
        json_string(base_url),
        json_string(request_id_header),
        auth_body
    )
}

/// `internal/requestconfig/errors.go` — the typed error hierarchy.
///
/// Fully derived from `sdk.errors`, so it is built here rather than from a
/// template: the set of wrapper TYPES, the switch arms, whether a 5xx branch
/// exists at all, and whether the file imports anything are all policy-driven.
/// Mirrors `runtime.ts`'s `errorsGo`.
///
/// Ordering is load-bearing and matches the JS `Map` insertion semantics:
/// statuses sort numerically, kinds appear in first-mapped-status order, and
/// re-inserting an existing kind (the 4xx/5xx catch-alls) keeps its original
/// position rather than moving it to the end.
fn errors_go(behavior: &Value) -> String {
    let client_kind = bstr(behavior, "errors", "clientErrorKind").unwrap_or("API");
    let server_kind = bstr(behavior, "errors", "serverErrorKind").unwrap_or("Internal");
    let doc_url = bstr(behavior, "errors", "errorDocUrlTemplate");

    // statusCodeMap -> (status, kind), numeric-sorted.
    let mut mapped: Vec<(i64, &str)> = bkey(behavior, "errors", "statusCodeMap")
        .and_then(|v| v.as_object())
        .map(|m| {
            m.iter()
                .filter_map(|(k, v)| Some((k.parse::<i64>().ok()?, v.as_str()?)))
                .collect()
        })
        .unwrap_or_default();
    mapped.sort_by_key(|(status, _)| *status);

    // kind -> statuses, in first-appearance order.
    let mut by_kind: Vec<(&str, Vec<i64>)> = Vec::new();
    for (status, kind) in &mapped {
        match by_kind.iter_mut().find(|(k, _)| k == kind) {
            Some((_, statuses)) => statuses.push(*status),
            None => by_kind.push((kind, vec![*status])),
        }
    }

    // Why each kind exists (drives the wrapper doc comments). The literal kind
    // "API" IS the base *APIError and never gets a wrapper type.
    // Upsert with JS `Map.set` semantics: re-inserting an existing kind appends
    // to its reason list and KEEPS its original position.
    fn push_reason<'k>(reasons: &mut Vec<(&'k str, Vec<String>)>, kind: &'k str, why: String) {
        match reasons.iter_mut().find(|(k, _)| *k == kind) {
            Some((_, list)) => list.push(why),
            None => reasons.push((kind, vec![why])),
        }
    }
    let mut reasons: Vec<(&str, Vec<String>)> = Vec::new();
    for (kind, statuses) in &by_kind {
        if *kind != "API" {
            let joined = statuses
                .iter()
                .map(|s| s.to_string())
                .collect::<Vec<_>>()
                .join("/");
            push_reason(&mut reasons, kind, format!("HTTP {joined}"));
        }
    }
    if client_kind != "API" {
        push_reason(&mut reasons, client_kind, "unmapped 4xx".to_string());
    }
    if server_kind != "API" {
        push_reason(&mut reasons, server_kind, "5xx".to_string());
    }

    let type_name = |kind: &str| format!("{}Error", crate::naming::pascal_case(kind));
    let wrap_expr = |kind: &str| {
        if kind == "API" {
            "return e".to_string()
        } else {
            format!("return &{}{{APIError: e}}", type_name(kind))
        }
    };

    let type_decls: Vec<String> = reasons
        .iter()
        .map(|(kind, why)| {
            let t = type_name(kind);
            format!(
                "// {t} is the {} error kind ({} responses).\n\
                 type {t} struct{{ *APIError }}\n\
                 \n\
                 // Unwrap exposes the wrapped *APIError to errors.As / errors.Is.\n\
                 func (e *{t}) Unwrap() error {{ return e.APIError }}",
                json_string(kind),
                why.join(" and ")
            )
        })
        .collect();

    let joined_statuses = |statuses: &[i64]| {
        statuses
            .iter()
            .map(|s| s.to_string())
            .collect::<Vec<_>>()
            .join(", ")
    };

    let wrap_cases = by_kind
        .iter()
        .map(|(kind, statuses)| {
            format!(
                "\tcase {}:\n\t\t{}",
                joined_statuses(statuses),
                wrap_expr(kind)
            )
        })
        .collect::<Vec<_>>()
        .join("\n");
    let server_branch = if server_kind == client_kind {
        String::new()
    } else {
        format!(
            "\tif e.StatusCode >= 500 {{\n\t\t{}\n\t}}\n",
            wrap_expr(server_kind)
        )
    };
    let wrap_func = format!(
        "// wrapAPIError wraps e in its status-mapped error kind (sdk.errors):\n\
         // mapped statuses get their concrete type, unmapped 4xx are {} and\n\
         // 5xx are {} (the kind \"API\" stays the base *APIError).\n\
         func wrapAPIError(e *APIError) error {{\n{}{server_branch}\t{}\n}}",
        json_string(client_kind),
        json_string(server_kind),
        if wrap_cases.is_empty() {
            String::new()
        } else {
            format!("\tswitch e.StatusCode {{\n{wrap_cases}\n\t}}\n")
        },
        wrap_expr(client_kind)
    );

    let kind_cases = by_kind
        .iter()
        .map(|(kind, statuses)| {
            format!(
                "\tcase {}:\n\t\treturn {}",
                joined_statuses(statuses),
                json_string(kind)
            )
        })
        .collect::<Vec<_>>()
        .join("\n");
    let kind_server_branch = if server_kind == client_kind {
        String::new()
    } else {
        format!(
            "\tif status >= 500 {{\n\t\treturn {}\n\t}}\n",
            json_string(server_kind)
        )
    };
    let kind_func = format!(
        "// errorKind names the status-mapped error kind carried on APIError.Kind\n\
         // (sdk.errors.statusCodeMap plus the 4xx/5xx catch-alls).\n\
         func errorKind(status int) string {{\n{}{kind_server_branch}\treturn {}\n}}",
        if kind_cases.is_empty() {
            String::new()
        } else {
            format!("\tswitch status {{\n{kind_cases}\n\t}}\n")
        },
        json_string(client_kind)
    );

    let doc_suffix = match doc_url {
        Some(tpl) => format!(
            "// errorDocSuffix renders the \" (see <url>)\" docs pointer APIError.Error\n\
             // appends, from sdk.errors.errorDocUrlTemplate.\n\
             func errorDocSuffix(e *APIError) string {{\n\
             \turl := strings.ReplaceAll({}, \"{{kind}}\", e.Kind)\n\
             \turl = strings.ReplaceAll(url, \"{{status}}\", strconv.Itoa(e.StatusCode))\n\
             \treturn \" (see \" + url + \")\"\n\
             }}",
            json_string(tpl)
        ),
        None => "// errorDocSuffix is the docs pointer APIError.Error appends when the error\n\
                 // policy declares an errorDocUrlTemplate; this build declares none.\n\
                 func errorDocSuffix(_ *APIError) string { return \"\" }"
            .to_string(),
    };

    let imports = if doc_url.is_some() {
        "import (\n\t\"strconv\"\n\t\"strings\"\n)\n\n"
    } else {
        ""
    };

    let mut blocks = type_decls;
    blocks.push(wrap_func);
    blocks.push(kind_func);
    blocks.push(doc_suffix);

    format!(
        "package requestconfig\n\n{imports}\
         // Status-mapped error kinds (sdk.errors): every mapped status arrives wrapped\n\
         // in a concrete kind embedding *APIError, so callers can match the kind\n\
         // (errors.As(err, &notFound)) or the base (errors.As(err, &apiErr)).\n\n{}\n",
        blocks.join("\n\n")
    )
}

/// A human duration for doc comments (`formatMs`): whole seconds collapse.
fn format_ms(ms: i64) -> String {
    if ms % 1000 == 0 {
        format!("{}s", ms / 1000)
    } else {
        format!("{ms}ms")
    }
}

/// The `WithRequestTimeout` doc sentence (`optionGo`'s `timeoutDefault`).
fn timeout_default_doc(behavior: &Value) -> String {
    let ms = bi64(behavior, "timeout", "defaultTimeoutMs", 60000);
    if ms <= 0 {
        return "Default: no deadline (sdk.timeout).".to_string();
    }
    let env = bstr(behavior, "timeout", "timeoutEnvVar")
        .map(|e| format!(", overridable via the {e} env var"))
        .unwrap_or_default();
    format!("Default: {}{env} (sdk.timeout).", format_ms(ms))
}

/// The `WithLogger` doc list of lifecycle events (`sdk.logging.events`).
fn log_events(behavior: &Value) -> String {
    bkey(behavior, "logging", "events")
        .and_then(|v| v.as_array())
        .map(|a| {
            a.iter()
                .filter_map(|v| v.as_str())
                .collect::<Vec<_>>()
                .join(", ")
        })
        .unwrap_or_default()
}

fn backoff_i64(behavior: &Value, key: &str, default: i64) -> i64 {
    behavior
        .get("retry")
        .and_then(|r| r.get("backoff"))
        .and_then(|b| b.get(key))
        .and_then(|v| v.as_i64())
        .unwrap_or(default)
}

fn backoff_f64(behavior: &Value, key: &str, default: f64) -> f64 {
    behavior
        .get("retry")
        .and_then(|r| r.get("backoff"))
        .and_then(|b| b.get(key))
        .and_then(|v| v.as_f64())
        .unwrap_or(default)
}

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

    // config.go — per-spec constants + every sdk.* policy constant.
    let config = config_go(spec, base_url, pkg, behavior);

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
            OPTION_GO
                .replace("__XYD_MODULE__", module_path)
                .replace(
                    "__XYD_MAX_RETRIES__",
                    &bi64(behavior, "retry", "maxRetries", 2).to_string(),
                )
                .replace("__XYD_TIMEOUT_DEFAULT__", &timeout_default_doc(behavior))
                .replace("__XYD_LOG_EVENTS__", &log_events(behavior)),
        ),
        (
            "internal/requestconfig/requestconfig.go".to_string(),
            requestconfig,
        ),
        (
            "internal/requestconfig/errors.go".to_string(),
            errors_go(behavior),
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
            PAGINATION_GO
                .replace("__XYD_MODULE__", module_path)
                .replace(
                    "__XYD_AUTO_PAGE_DELAY__",
                    &go_ms(bi64(behavior, "pagination", "autoPageDelayMs", 0)),
                ),
        ));
    }
    files
}
