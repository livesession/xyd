//! runtime.ts — the vendored, dependency-free Java runtime (java.net.http + the
//! hand-rolled Json codec). Ported as fixed `.java.txt` templates embedded via
//! `include_str!` (so `cargo fmt` can NEVER touch the emitted Java bytes) with
//! `__XYD_*__` seams filled from the resolved sdk-behavior: the Json codec, the
//! status-mapped typed exception hierarchy, the HTTP Transport (retry/timeout/
//! user-agent/auth/multipart from behavior), and the generic page containers.

use serde_json::Value;
use std::collections::HashSet;

use crate::ir::{arr_field, str_field};
use crate::javawriter::java_file;
use crate::jsrt::{json_str, pascal_case};
use crate::model::GenFile;
use crate::plan::plan_operation;
use crate::project::JavaCtx;
use crate::service::method_encoding;

// ---- fixed Java source (byte-exact, never touched by cargo fmt) -------------
const JSON_BODY: &str = include_str!("json_body.java.txt");
const TRANSPORT_TEMPLATE: &str = include_str!("transport_template.java.txt");
const FORM_SWITCH: &str = include_str!("form_switch.java.txt");
const FORM_ENCODERS: &str = include_str!("form_encoders.java.txt");
const RETRY_AFTER_CALL: &str = include_str!("retry_after_call.java.txt");
const RETRY_AFTER_HELPER: &str = include_str!("retry_after_helper.java.txt");

const JSON_IMPORTS: [&str; 4] = [
    "java.util.ArrayList",
    "java.util.LinkedHashMap",
    "java.util.List",
    "java.util.Map",
];

/// The runtime files: Json.java (codec), the typed exceptions, Transport.java
/// and — only when a spec needs them — the generic page containers.
pub fn render_runtime_files(spec: &Value, ctx: &JavaCtx) -> Vec<GenFile> {
    let methods = walk_methods(spec);
    let needs_form = methods.iter().any(|m| {
        let plan = plan_operation(m, &ctx.types);
        method_encoding(m, &plan, &ctx.types) != "json"
    });

    let mut files: Vec<GenFile> = vec![json_file(ctx)];
    files.extend(error_files(ctx));
    files.push(GenFile {
        path: format!("{}Transport.java", ctx.src_dir),
        content: java_file(
            &ctx.full_package,
            &transport_imports(needs_form),
            &transport_body(ctx, needs_form),
        ),
    });

    // Page containers are vendored only for the page kinds some list method
    // returns (dedup, first-seen order).
    let mut seen: HashSet<&'static str> = HashSet::new();
    for m in &methods {
        if let Some(kind) = plan_operation(m, &ctx.types).page_name {
            if seen.insert(kind) {
                files.push(page_file(kind, ctx));
            }
        }
    }
    files
}

/// Json.java — the vendored dependency-free codec (shared with CLI mode).
pub(crate) fn json_file(ctx: &JavaCtx) -> GenFile {
    GenFile {
        path: format!("{}Json.java", ctx.src_dir),
        content: java_file(
            &ctx.full_package,
            &JSON_IMPORTS
                .iter()
                .map(|s| s.to_string())
                .collect::<Vec<_>>(),
            JSON_BODY,
        ),
    }
}

/// Every method in the spec's resource tree, in declaration order.
fn walk_methods(spec: &Value) -> Vec<Value> {
    let mut out: Vec<Value> = Vec::new();
    fn visit(resource: &Value, out: &mut Vec<Value>) {
        for m in arr_field(resource, "methods") {
            out.push(m.clone());
        }
        for sub in arr_field(resource, "resources") {
            visit(sub, out);
        }
    }
    for r in arr_field(spec, "resources") {
        visit(r, &mut out);
    }
    out
}

// ---- typed exception hierarchy (behavior-driven) ----------------------------

/// The Java exception class for a policy error kind, or None for the `API` base.
fn error_class_name(kind: &str) -> Option<String> {
    if kind == "API" {
        None
    } else {
        Some(format!("{}Exception", pascal_case(kind)))
    }
}

/// (status, kind) pairs from sdk.errors.statusCodeMap, numerically sorted.
fn mapped_errors(behavior: &Value) -> Vec<(i64, String)> {
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

fn error_files(ctx: &JavaCtx) -> Vec<GenFile> {
    let behavior = &ctx.behavior;
    let mapped = mapped_errors(behavior);
    let server_kind = str_field(
        behavior.get("errors").unwrap_or(&Value::Null),
        "serverErrorKind",
    )
    .unwrap_or("")
    .to_string();
    let client_kind = str_field(
        behavior.get("errors").unwrap_or(&Value::Null),
        "clientErrorKind",
    )
    .unwrap_or("")
    .to_string();

    // className -> (kind, statuses), first-seen order (several statuses may share a kind).
    let mut order: Vec<(String, String, Vec<i64>)> = Vec::new();
    let mut index: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
    for (status, kind) in &mapped {
        let Some(cls) = error_class_name(kind) else {
            continue;
        };
        if let Some(&i) = index.get(&cls) {
            order[i].2.push(*status);
        } else {
            index.insert(cls.clone(), order.len());
            order.push((cls, kind.clone(), vec![*status]));
        }
    }
    if let Some(server_cls) = error_class_name(&server_kind) {
        if !index.contains_key(&server_cls) {
            index.insert(server_cls.clone(), order.len());
            order.push((server_cls, server_kind.clone(), Vec::new()));
        }
    }
    if let Some(client_cls) = error_class_name(&client_kind) {
        if !index.contains_key(&client_cls) {
            index.insert(client_cls.clone(), order.len());
            order.push((client_cls, client_kind.clone(), Vec::new()));
        }
    }

    let mut files: Vec<GenFile> = vec![GenFile {
        path: format!("{}ApiException.java", ctx.src_dir),
        content: java_file(
            &ctx.full_package,
            &[],
            &api_exception_body(&mapped, &server_kind, &client_kind),
        ),
    }];
    for (cls, kind, statuses) in &order {
        files.push(GenFile {
            path: format!("{}{}.java", ctx.src_dir, cls),
            content: java_file(&ctx.full_package, &[], &subclass_body(cls, kind, statuses)),
        });
    }
    files
}

fn api_exception_body(mapped: &[(i64, String)], server_kind: &str, client_kind: &str) -> String {
    let cases: String = mapped
        .iter()
        .map(|(status, kind)| {
            let expr = match error_class_name(kind) {
                Some(cls) => format!("new {cls}(statusCode, message, rawBody, requestId)"),
                None => format!(
                    "new ApiException(statusCode, message, rawBody, requestId, {})",
                    json_str(kind)
                ),
            };
            format!("      case {status}:\n        return {expr};")
        })
        .collect::<Vec<_>>()
        .join("\n");
    let switch_block = if mapped.is_empty() {
        String::new()
    } else {
        format!("    switch (statusCode) {{\n{cases}\n    }}\n")
    };
    let server_branch = match error_class_name(server_kind) {
        Some(cls) => format!(
            "    if (statusCode >= 500) {{\n      return new {cls}(statusCode, message, rawBody, requestId);\n    }}\n"
        ),
        None => String::new(),
    };
    let client_return = match error_class_name(client_kind) {
        Some(cls) => format!("    return new {cls}(statusCode, message, rawBody, requestId);"),
        None => format!(
            "    return new ApiException(statusCode, message, rawBody, requestId, {});",
            json_str(client_kind)
        ),
    };

    format!(
        r#"/**
 * A non-2xx API response: the HTTP status, a best-effort message, the raw body
 * bytes, the server-assigned request id (from the configured request-id header)
 * and the policy error kind. Mapped statuses arrive as a concrete subclass
 * (e.g. {{@link NotFoundException}}) via {{@link #of}}.
 */
public class ApiException extends RuntimeException {{
  private final int statusCode;
  private final byte[] rawBody;
  private final String requestId;
  private final String kind;

  public ApiException(int statusCode, String message) {{
    this(statusCode, message, new byte[0], null, "API");
  }}

  protected ApiException(int statusCode, String message, byte[] rawBody, String requestId, String kind) {{
    super(message);
    this.statusCode = statusCode;
    this.rawBody = rawBody == null ? new byte[0] : rawBody;
    this.requestId = requestId;
    this.kind = kind;
  }}

  public int statusCode() {{
    return statusCode;
  }}

  public byte[] rawBody() {{
    return rawBody;
  }}

  /** The server-assigned request id (sdk.telemetry.requestIdHeader), or null. */
  public String requestId() {{
    return requestId;
  }}

  /** The status-mapped error kind (sdk.errors), e.g. "NotFound" or "API". */
  public String kind() {{
    return kind;
  }}

  /** Dispatch a non-2xx response to its status-mapped exception kind (sdk.errors). */
  public static ApiException of(int statusCode, String message, byte[] rawBody, String requestId) {{
{switch_block}{server_branch}{client_return}
  }}
}}"#
    )
}

fn subclass_body(cls: &str, kind: &str, statuses: &[i64]) -> String {
    let reason = if statuses.is_empty() {
        let flavor = if cls.contains("Internal") {
            "5xx"
        } else {
            "error"
        };
        format!("unmapped {flavor} responses")
    } else {
        let joined = statuses
            .iter()
            .map(|s| s.to_string())
            .collect::<Vec<_>>()
            .join("/");
        format!("HTTP {joined} responses")
    };
    format!(
        "/** The {kind} error kind ({reason}). */\npublic final class {cls} extends ApiException {{\n  public {cls}(int statusCode, String message, byte[] rawBody, String requestId) {{\n    super(statusCode, message, rawBody, requestId, {kind});\n  }}\n}}",
        kind = json_str(kind),
    )
}

// ---- generic page containers -----------------------------------------------

fn page_file(kind: &str, ctx: &JavaCtx) -> GenFile {
    let imports: Vec<String> = JSON_IMPORTS.iter().map(|s| s.to_string()).collect();
    let decode_data = "    Map<?, ?> map = json instanceof Map ? (Map<?, ?>) json : new LinkedHashMap<>();\n    List<T> data = Json.mapList(map.get(\"data\"), mapper);\n    if (data == null) {\n      data = new ArrayList<>();\n    }";

    let body = if kind == "Page" {
        format!(
            "/** One page of a marker-less list: the whole collection in one `data` envelope. */\npublic final class Page<T> {{\n  private final List<T> data;\n\n  private Page(List<T> data) {{\n    this.data = data;\n  }}\n\n  /** The items in this page. */\n  public List<T> data() {{\n    return data;\n  }}\n\n  /** Decode a {{data:[...]}} envelope, mapping each item with the supplied mapper. */\n  public static <T> Page<T> fromJson(Object json, Json.Mapper<T> mapper) {{\n{decode_data}\n    return new Page<>(data);\n  }}\n}}"
        )
    } else {
        let marker = if kind == "CursorPage" {
            "a cursor-paginated list: `data` plus a `has_more` marker"
        } else {
            "an offset-paginated list: `data` plus an optional `has_more` marker"
        };
        format!(
            "/** One page of {marker}. */\npublic final class {kind}<T> {{\n  private final List<T> data;\n  private final boolean hasMore;\n\n  private {kind}(List<T> data, boolean hasMore) {{\n    this.data = data;\n    this.hasMore = hasMore;\n  }}\n\n  /** The items in this page. */\n  public List<T> data() {{\n    return data;\n  }}\n\n  /** Whether the server reports more pages after this one. */\n  public boolean hasMore() {{\n    return hasMore;\n  }}\n\n  /** Decode a {{data:[...], has_more:bool}} envelope, mapping each item with the supplied mapper. */\n  public static <T> {kind}<T> fromJson(Object json, Json.Mapper<T> mapper) {{\n{decode_data}\n    Boolean hasMore = Json.asBoolean(map.get(\"has_more\"));\n    return new {kind}<>(data, hasMore != null && hasMore);\n  }}\n}}"
        )
    };
    GenFile {
        path: format!("{}{}.java", ctx.src_dir, kind),
        content: java_file(&ctx.full_package, &imports, &body),
    }
}

// ---- Transport --------------------------------------------------------------

fn transport_imports(needs_form: bool) -> Vec<String> {
    let mut imports: Vec<String> = [
        "java.net.URI",
        "java.net.URLEncoder",
        "java.net.http.HttpClient",
        "java.net.http.HttpRequest",
        "java.net.http.HttpResponse",
        "java.nio.charset.StandardCharsets",
        "java.time.Duration",
        "java.util.ArrayList",
        "java.util.LinkedHashMap",
        "java.util.List",
        "java.util.Map",
    ]
    .iter()
    .map(|s| s.to_string())
    .collect();
    if needs_form {
        imports.push("java.io.ByteArrayOutputStream".to_string());
        imports.push("java.io.IOException".to_string());
        imports.push("java.util.UUID".to_string());
    }
    imports
}

fn get<'a>(v: &'a Value, path: &[&str]) -> &'a Value {
    let mut cur = v;
    for k in path {
        cur = match cur.get(k) {
            Some(x) => x,
            None => return &Value::Null,
        };
    }
    cur
}

fn get_i64(v: &Value, path: &[&str]) -> i64 {
    get(v, path).as_i64().unwrap_or(0)
}

fn get_f64(v: &Value, path: &[&str]) -> f64 {
    get(v, path).as_f64().unwrap_or(0.0)
}

fn get_bool(v: &Value, path: &[&str]) -> bool {
    get(v, path).as_bool().unwrap_or(false)
}

/// A Java `long` literal from a millisecond count.
fn java_ms(ms: i64) -> String {
    format!("{ms}L")
}

/// A Java `double` literal (integers keep a trailing `.0`).
fn java_double(value: f64) -> String {
    if value.fract() == 0.0 {
        format!("{}.0", value as i64)
    } else {
        format!("{value}")
    }
}

fn constants_block(ctx: &JavaCtx) -> String {
    let b = &ctx.behavior;
    let codes: Vec<i64> = get(b, &["retry", "retryableStatusCodes"])
        .as_array()
        .map(|a| a.iter().filter_map(Value::as_i64).collect())
        .unwrap_or_default();
    let status_set = if codes.is_empty() {
        "java.util.Collections.<Integer>emptySet()".to_string()
    } else {
        format!(
            "java.util.Set.of({})",
            codes
                .iter()
                .map(|c| c.to_string())
                .collect::<Vec<_>>()
                .join(", ")
        )
    };

    let timeout_env = get(b, &["timeout", "timeoutEnvVar"])
        .as_str()
        .map(str::to_string);
    let default_timeout_ms = get_i64(b, &["timeout", "defaultTimeoutMs"]);
    let timeout_block = match timeout_env {
        Some(env) if !env.is_empty() => format!(
            "  private static final long DEFAULT_TIMEOUT_MS = resolveTimeoutMs();\n\n  /** The default per-request timeout (sdk.timeout), overridable via the {env} env var (ms). */\n  private static long resolveTimeoutMs() {{\n    String raw = System.getenv({env_lit});\n    if (raw != null && !raw.isEmpty()) {{\n      try {{\n        long ms = Long.parseLong(raw);\n        if (ms >= 0) {{\n          return ms;\n        }}\n      }} catch (NumberFormatException ignored) {{\n        // fall through to the default\n      }}\n    }}\n    return {default};\n  }}",
            env = env,
            env_lit = json_str(&env),
            default = java_ms(default_timeout_ms),
        ),
        _ => format!(
            "  private static final long DEFAULT_TIMEOUT_MS = {};",
            java_ms(default_timeout_ms)
        ),
    };

    let lines = [
        format!(
            "  private static final String DEFAULT_BASE_URL = {};",
            json_str(&ctx.base_url)
        ),
        "  private static final String USER_AGENT = userAgent();".to_string(),
        format!(
            "  private static final int MAX_RETRIES = {};",
            get_i64(b, &["retry", "maxRetries"])
        ),
        format!(
            "  private static final java.util.Set<Integer> RETRYABLE_STATUS_CODES = {status_set};"
        ),
        format!(
            "  private static final boolean RETRY_CONNECTION_ERRORS = {};",
            get_bool(b, &["retry", "retryConnectionErrors"])
        ),
        format!(
            "  private static final boolean HONOR_RETRY_AFTER_HEADER = {};",
            get_bool(b, &["retry", "honorRetryAfterHeader"])
        ),
        format!(
            "  private static final long BACKOFF_INITIAL_DELAY_MS = {};",
            java_ms(get_i64(b, &["retry", "backoff", "initialDelayMs"]))
        ),
        format!(
            "  private static final long BACKOFF_MAX_DELAY_MS = {};",
            java_ms(get_i64(b, &["retry", "backoff", "maxDelayMs"]))
        ),
        format!(
            "  private static final double BACKOFF_MULTIPLIER = {};",
            java_double(get_f64(b, &["retry", "backoff", "multiplier"]))
        ),
        format!(
            "  private static final double BACKOFF_JITTER = {};",
            java_double(get_f64(b, &["retry", "backoff", "jitter"]))
        ),
        format!(
            "  private static final String REQUEST_ID_HEADER = {};",
            json_str(
                get(b, &["telemetry", "requestIdHeader"])
                    .as_str()
                    .unwrap_or("")
            )
        ),
        timeout_block,
    ];
    lines.join("\n")
}

fn user_agent_body(ctx: &JavaCtx) -> String {
    let b = &ctx.behavior;
    let runtime_line = if get_bool(b, &["userAgent", "includeRuntimeVersion"]) {
        "    ua = ua + \" java/\" + System.getProperty(\"java.version\");\n".to_string()
    } else {
        String::new()
    };
    let agent_block = match get(b, &["userAgent", "aiAgentEnvVars"]).as_object() {
        Some(agents) if !agents.is_empty() => {
            let rows: String = agents
                .iter()
                .map(|(env, slug)| {
                    format!(
                        "      {{{}, {}}},",
                        json_str(env),
                        json_str(slug.as_str().unwrap_or(""))
                    )
                })
                .collect::<Vec<_>>()
                .join("\n");
            format!(
                "    String[][] agents = {{\n{rows}\n    }};\n    for (String[] agent : agents) {{\n      String value = System.getenv(agent[0]);\n      if (value != null && !value.isEmpty()) {{\n        ua = ua + \" agent/\" + agent[1];\n        break;\n      }}\n    }}\n"
            )
        }
        _ => String::new(),
    };
    format!(
        "    String ua = {};\n{runtime_line}{agent_block}",
        json_str(&ctx.user_agent)
    )
}

fn auth_header_block(ctx: &JavaCtx) -> String {
    let name = ctx.auth_name.clone().unwrap_or_default();
    match ctx.auth_kind.as_deref() {
        Some("bearer") => "    if (apiKey != null) {\n      builder.header(\"Authorization\", \"Bearer \" + apiKey);\n    }\n".to_string(),
        Some("apiKey-header") => format!(
            "    if (apiKey != null) {{\n      builder.header({}, apiKey);\n    }}\n",
            json_str(&name)
        ),
        Some("apiKey-cookie") => format!(
            "    if (apiKey != null) {{\n      builder.header(\"Cookie\", {} + apiKey);\n    }}\n",
            json_str(&format!("{name}="))
        ),
        _ => String::new(),
    }
}

fn auth_query_block(ctx: &JavaCtx) -> String {
    if ctx.auth_kind.as_deref() != Some("apiKey-query") {
        return String::new();
    }
    let name = ctx.auth_name.clone().unwrap_or_default();
    format!(
        "    if (apiKey != null) {{\n      query.computeIfAbsent({}, unused -> new ArrayList<>()).add(apiKey);\n    }}\n",
        json_str(&name)
    )
}

fn transport_body(ctx: &JavaCtx, needs_form: bool) -> String {
    let honor = get_bool(&ctx.behavior, &["retry", "honorRetryAfterHeader"]);

    let encode_branch = if needs_form {
        FORM_SWITCH.trim_end_matches('\n').to_string()
    } else {
        "      payload = Json.encode(request.body).getBytes(StandardCharsets.UTF_8);\n      contentType = \"application/json\";".to_string()
    };
    let encoders = if needs_form {
        format!("\n\n{}", FORM_ENCODERS.trim_end_matches('\n'))
    } else {
        String::new()
    };
    let retry_after_call = if honor {
        format!("{}\n", RETRY_AFTER_CALL.trim_end_matches('\n'))
    } else {
        String::new()
    };
    let retry_after_helper = if honor {
        format!("\n\n{}", RETRY_AFTER_HELPER.trim_end_matches('\n'))
    } else {
        String::new()
    };

    TRANSPORT_TEMPLATE
        .trim_end_matches('\n')
        .replace("__XYD_CONSTANTS__", &constants_block(ctx))
        .replace("__XYD_UA_BODY__", &user_agent_body(ctx))
        .replace("__XYD_AUTH_HEADER__", &auth_header_block(ctx))
        .replace("__XYD_ENCODE_BRANCH__", &encode_branch)
        .replace("__XYD_RETRY_AFTER_CALL__", &retry_after_call)
        .replace("__XYD_RETRY_AFTER_HELPER__", &retry_after_helper)
        .replace("__XYD_AUTH_QUERY__", &auth_query_block(ctx))
        .replace("__XYD_ENCODERS__", &encoders)
}
