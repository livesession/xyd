import { type OpensdkSpecJson, type ResolvedSdkBehavior, sdkBehavior } from '@xyd-js/opensdk-core';

import { pascalCase } from './naming';
import { rsString } from './rswriter';

// The generated Rust runtime (`src/error.rs` + `src/transport.rs`): an async
// reqwest transport with a structured error type, wire-correct json/form/
// multipart encoding, best-effort JSON decode, a modest retry/backoff loop and a
// generic Page container. Every behavior constant is interpolated from the IR's
// `sdk` block via opensdk-core's `sdkBehavior(spec)`, so the Rust runtime encodes
// the same declared policy as the Go/Ruby/Python runtimes instead of drifting.

function rsBool(value: boolean): string {
  return value ? 'true' : 'false';
}

/** A Rust f64 literal: integers render as `2.0` so they parse as floats. */
function rsFloat(value: number): string {
  return Number.isInteger(value) ? `${value}.0` : String(value);
}

/** The unique ErrorKind names (status order, then server/client), PascalCased. */
function errorKinds(behavior: ResolvedSdkBehavior): string[] {
  const kinds: string[] = [];
  const push = (kind: string) => {
    const name = pascalCase(kind);
    if (!kinds.includes(name)) kinds.push(name);
  };
  for (const [, kind] of sortedStatusMap(behavior)) push(kind);
  push(behavior.errors.serverErrorKind);
  push(behavior.errors.clientErrorKind);
  return kinds;
}

/** The status->kind entries, numeric and status-sorted. */
function sortedStatusMap(behavior: ResolvedSdkBehavior): [number, string][] {
  return Object.entries(behavior.errors.statusCodeMap)
    .map(([status, kind]) => [Number(status), kind] as [number, string])
    .filter(([status]) => Number.isFinite(status))
    .sort((a, b) => a[0] - b[0]);
}

/** Emit `src/error.rs`: the Error enum + ErrorKind + status->kind mapping. */
export function renderErrorFile(spec: OpensdkSpecJson): string {
  const behavior = sdkBehavior(spec);
  const kinds = errorKinds(behavior);
  const serverKind = pascalCase(behavior.errors.serverErrorKind);
  const clientKind = pascalCase(behavior.errors.clientErrorKind);

  const matchArms = sortedStatusMap(behavior).map(([status, kind]) => `        ${status} => ErrorKind::${pascalCase(kind)},`);
  matchArms.push(`        status if status >= 500 => ErrorKind::${serverKind},`);
  matchArms.push(`        _ => ErrorKind::${clientKind},`);

  return `/// A structured error kind, derived from the SDK's status -> kind policy.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ErrorKind {
${kinds.map((k) => `    ${k},`).join('\n')}
}

/// The error type every generated SDK method returns.
#[derive(Debug, thiserror::Error)]
pub enum Error {
    /// A non-2xx API response.
    #[error("API error {status}: {message}")]
    Api {
        status: u16,
        kind: ErrorKind,
        message: String,
        request_id: Option<String>,
        body: Option<String>,
    },
    /// A required argument was empty or invalid before the request was sent.
    #[error("invalid argument: {0}")]
    InvalidArgument(String),
    /// A transport / connection error from reqwest.
    #[error("HTTP transport error: {0}")]
    Http(#[from] reqwest::Error),
    /// A JSON (de)serialization error.
    #[error("decode error: {0}")]
    Decode(#[from] serde_json::Error),
}

/// Map an HTTP status code to its ErrorKind (from the SDK's error policy).
pub(crate) fn kind_for_status(status: u16) -> ErrorKind {
    match status {
${matchArms.join('\n')}
    }
}
`;
}

/** The auth application, from the first security scheme (bearer by default). */
function authStatements(spec: OpensdkSpecJson): string {
  const scheme = spec.security?.[0];
  const name = scheme?.name || '';
  let stmt: string;
  switch (scheme?.kind) {
    case 'apiKey-header':
      stmt = `rb = rb.header(${rsString(name)}, api_key.as_str());`;
      break;
    case 'apiKey-query':
      stmt = `rb = rb.query(&[(${rsString(name)}, api_key.as_str())]);`;
      break;
    case 'apiKey-cookie':
      stmt = `rb = rb.header("Cookie", format!("{}={}", ${rsString(name)}, api_key));`;
      break;
    default:
      stmt = 'rb = rb.bearer_auth(api_key);';
  }
  return `            if let Some(api_key) = &self.transport.api_key {
                if !api_key.is_empty() {
                    ${stmt}
                }
            }`;
}

/** Emit `src/transport.rs`: the async reqwest transport, request builder and Page. */
export function renderTransportFile(spec: OpensdkSpecJson, crate: string, baseURL: string): string {
  const behavior = sdkBehavior(spec);
  const { retry, timeout, userAgent, telemetry, idempotency } = behavior;

  const userAgentStr = userAgent.sdkIdentifierTemplate
    .split('{package}')
    .join(crate)
    .split('{language}')
    .join('rust')
    .split('{version}')
    .join(spec.info.version || '0.0.0');

  const aiAgents = Object.entries(userAgent.aiAgentEnvVars)
    .map(([env, slug]) => `(${rsString(env)}, ${rsString(slug)})`)
    .join(', ');

  const constants = `pub const DEFAULT_BASE_URL: &str = ${rsString(baseURL)};
pub const USER_AGENT: &str = ${rsString(userAgentStr)};
pub const DEFAULT_TIMEOUT_MS: u64 = ${timeout.defaultTimeoutMs};
pub const MAX_RETRIES: u32 = ${retry.maxRetries};
pub const RETRYABLE_STATUS: &[u16] = &[${retry.retryableStatusCodes.join(', ')}];
pub const RETRY_CONNECTION_ERRORS: bool = ${rsBool(retry.retryConnectionErrors)};
pub const HONOR_RETRY_AFTER: bool = ${rsBool(retry.honorRetryAfterHeader)};
pub const BACKOFF_INITIAL_MS: u64 = ${retry.backoff.initialDelayMs};
pub const BACKOFF_MAX_MS: u64 = ${retry.backoff.maxDelayMs};
pub const BACKOFF_MULTIPLIER: f64 = ${rsFloat(retry.backoff.multiplier)};
pub const BACKOFF_JITTER: f64 = ${rsFloat(retry.backoff.jitter)};
pub const REQUEST_ID_HEADER: &str = ${rsString(telemetry.requestIdHeader)};
pub const IDEMPOTENCY_HEADER: &str = ${rsString(idempotency.headerName)};
const AI_AGENT_ENV_VARS: &[(&str, &str)] = &[${aiAgents}];`;

  return `use std::sync::Arc;
use std::time::Duration;

use serde::de::DeserializeOwned;
use serde_json::Value;

use crate::error::{kind_for_status, Error};

${constants}

/// One page of a list response: the decoded items plus a coarse \`has_more\` marker.
#[derive(Debug, Clone)]
pub struct Page<T> {
    pub data: Vec<T>,
    pub has_more: bool,
}

impl<T: DeserializeOwned> Page<T> {
    pub(crate) fn from_value(value: Value, items_field: &str, next_field: Option<&str>) -> Result<Self, Error> {
        let items = value.get(items_field).cloned().unwrap_or_else(|| Value::Array(Vec::new()));
        let data: Vec<T> = serde_json::from_value(items)?;
        let has_more = next_field
            .and_then(|field| value.get(field))
            .and_then(Value::as_bool)
            .unwrap_or(false);
        Ok(Page { data, has_more })
    }
}

/// The vendored HTTP transport: auth, encoding, a modest retry loop and typed
/// error mapping. Constructed once and shared (Arc) by every resource.
#[derive(Debug)]
pub(crate) struct Transport {
    http: reqwest::Client,
    base_url: String,
    api_key: Option<String>,
}

impl Transport {
    pub(crate) fn new(api_key: Option<String>, base_url: Option<String>, timeout_ms: Option<u64>) -> Self {
        let mut builder = reqwest::Client::builder().user_agent(user_agent());
        let timeout = timeout_ms.unwrap_or(DEFAULT_TIMEOUT_MS);
        if timeout > 0 {
            builder = builder.timeout(Duration::from_millis(timeout));
        }
        let http = builder.build().unwrap_or_else(|_| reqwest::Client::new());
        let base_url = base_url
            .unwrap_or_else(|| DEFAULT_BASE_URL.to_string())
            .trim_end_matches('/')
            .to_string();
        Transport { http, base_url, api_key }
    }

    pub(crate) fn request(self: &Arc<Self>, method: reqwest::Method, path: impl Into<String>) -> RequestBuilder {
        RequestBuilder {
            transport: self.clone(),
            method,
            path: path.into(),
            query: Vec::new(),
            headers: Vec::new(),
            body: Body::None,
            idempotency: false,
        }
    }
}

enum Body {
    None,
    Json(serde_json::Map<String, Value>),
    Form(Vec<(String, String)>),
    Multipart(Vec<MultipartPart>),
}

enum MultipartPart {
    Text(String, String),
    File(String, Vec<u8>),
}

/// A buffered request the retry loop rebuilds each attempt (a reqwest Request /
/// multipart Form is single-use, so its parts are stored, not the Request).
pub(crate) struct RequestBuilder {
    transport: Arc<Transport>,
    method: reqwest::Method,
    path: String,
    query: Vec<(String, Value)>,
    headers: Vec<(String, String)>,
    body: Body,
    idempotency: bool,
}

impl RequestBuilder {
    pub(crate) fn query(mut self, key: &str, value: Value) -> Self {
        self.query.push((key.to_string(), value));
        self
    }

    /// A \`style=form, explode=false\` array query param, joined into one CSV value.
    pub(crate) fn query_csv(mut self, key: &str, value: Value) -> Self {
        let joined = match value {
            Value::Array(items) => items.iter().map(stringify).collect::<Vec<_>>().join(","),
            other => stringify(&other),
        };
        self.query.push((key.to_string(), Value::String(joined)));
        self
    }

    pub(crate) fn header(mut self, key: &str, value: String) -> Self {
        self.headers.push((key.to_string(), value));
        self
    }

    pub(crate) fn json_field(mut self, key: &str, value: Value) -> Self {
        if let Body::Json(map) = &mut self.body {
            map.insert(key.to_string(), value);
        } else {
            let mut map = serde_json::Map::new();
            map.insert(key.to_string(), value);
            self.body = Body::Json(map);
        }
        self
    }

    pub(crate) fn form_field(mut self, key: &str, value: String) -> Self {
        if let Body::Form(pairs) = &mut self.body {
            pairs.push((key.to_string(), value));
        } else {
            self.body = Body::Form(vec![(key.to_string(), value)]);
        }
        self
    }

    pub(crate) fn multipart_text(mut self, key: &str, value: String) -> Self {
        self.push_part(MultipartPart::Text(key.to_string(), value));
        self
    }

    pub(crate) fn multipart_file(mut self, key: &str, value: Vec<u8>) -> Self {
        self.push_part(MultipartPart::File(key.to_string(), value));
        self
    }

    /// A header carrying a JSON-encoded value (stringified to its wire form).
    pub(crate) fn header_json(self, key: &str, value: Value) -> Self {
        let text = stringify(&value);
        self.header(key, text)
    }

    /// A form (application/x-www-form-urlencoded) field from a JSON value.
    pub(crate) fn form_json(self, key: &str, value: Value) -> Self {
        let text = stringify(&value);
        self.form_field(key, text)
    }

    /// A multipart text field from a JSON value.
    pub(crate) fn multipart_json(self, key: &str, value: Value) -> Self {
        let text = stringify(&value);
        self.multipart_text(key, text)
    }

    fn push_part(&mut self, part: MultipartPart) {
        if let Body::Multipart(parts) = &mut self.body {
            parts.push(part);
        } else {
            self.body = Body::Multipart(vec![part]);
        }
    }

    pub(crate) fn idempotency(mut self) -> Self {
        self.idempotency = true;
        self
    }

    /// Send the request and decode the JSON response into \`T\`.
    pub(crate) async fn send<T: DeserializeOwned>(self) -> Result<T, Error> {
        let bytes = self.execute().await?;
        Ok(serde_json::from_slice(&bytes)?)
    }

    /// Send the request and decode the JSON response into a \`serde_json::Value\`.
    pub(crate) async fn send_value(self) -> Result<Value, Error> {
        let bytes = self.execute().await?;
        if bytes.is_empty() {
            return Ok(Value::Null);
        }
        Ok(serde_json::from_slice(&bytes)?)
    }

    /// Send the request and return the raw response bytes (binary downloads).
    pub(crate) async fn send_bytes(self) -> Result<Vec<u8>, Error> {
        self.execute().await
    }

    /// Send the request, discarding the response body (no-content responses).
    pub(crate) async fn send_empty(self) -> Result<(), Error> {
        self.execute().await?;
        Ok(())
    }

    async fn execute(self) -> Result<Vec<u8>, Error> {
        let url = format!("{}{}", self.transport.base_url, self.path);
        let query = expand_query(&self.query);
        // A single idempotency key reused across retry attempts (never regenerated).
        let idempotency_key = if self.idempotency {
            Some(uuid::Uuid::new_v4().to_string())
        } else {
            None
        };
        let mut attempt: u32 = 0;
        loop {
            let mut rb = self.transport.http.request(self.method.clone(), &url);
            if !query.is_empty() {
                rb = rb.query(&query);
            }
            for (key, value) in &self.headers {
                rb = rb.header(key.as_str(), value.as_str());
            }
${authStatements(spec)}
            if let Some(key) = &idempotency_key {
                rb = rb.header(IDEMPOTENCY_HEADER, key.as_str());
            }
            rb = match &self.body {
                Body::None => rb,
                Body::Json(map) => rb.json(&Value::Object(map.clone())),
                Body::Form(pairs) => rb.form(&pairs.clone()),
                Body::Multipart(parts) => rb.multipart(build_multipart(parts)),
            };

            let response = match rb.send().await {
                Ok(response) => response,
                Err(error) => {
                    if RETRY_CONNECTION_ERRORS && attempt < MAX_RETRIES {
                        tokio::time::sleep(backoff(attempt, None)).await;
                        attempt += 1;
                        continue;
                    }
                    return Err(Error::Http(error));
                }
            };

            let status = response.status();
            if status.is_client_error() || status.is_server_error() {
                let code = status.as_u16();
                if attempt < MAX_RETRIES && RETRYABLE_STATUS.contains(&code) {
                    let retry_after = if HONOR_RETRY_AFTER {
                        retry_after_seconds(response.headers())
                    } else {
                        None
                    };
                    tokio::time::sleep(backoff(attempt, retry_after)).await;
                    attempt += 1;
                    continue;
                }
                let request_id = header_value(response.headers(), REQUEST_ID_HEADER);
                let body = response.text().await.unwrap_or_default();
                let message = error_message(&body).unwrap_or_else(|| format!("HTTP {code}"));
                return Err(Error::Api {
                    status: code,
                    kind: kind_for_status(code),
                    message,
                    request_id,
                    body: if body.is_empty() { None } else { Some(body) },
                });
            }

            let bytes = response.bytes().await?;
            return Ok(bytes.to_vec());
        }
    }
}

fn build_multipart(parts: &[MultipartPart]) -> reqwest::multipart::Form {
    let mut form = reqwest::multipart::Form::new();
    for part in parts {
        form = match part {
            MultipartPart::Text(name, value) => form.text(name.clone(), value.clone()),
            MultipartPart::File(name, bytes) => form.part(
                name.clone(),
                reqwest::multipart::Part::bytes(bytes.clone()).file_name(name.clone()),
            ),
        };
    }
    form
}

fn expand_query(query: &[(String, Value)]) -> Vec<(String, String)> {
    let mut pairs = Vec::new();
    for (key, value) in query {
        match value {
            Value::Array(items) => {
                for item in items {
                    pairs.push((key.clone(), stringify(item)));
                }
            }
            Value::Null => {}
            other => pairs.push((key.clone(), stringify(other))),
        }
    }
    pairs
}

fn stringify(value: &Value) -> String {
    match value {
        Value::String(text) => text.clone(),
        Value::Bool(flag) => flag.to_string(),
        Value::Number(number) => number.to_string(),
        Value::Null => String::new(),
        other => other.to_string(),
    }
}

fn header_value(headers: &reqwest::header::HeaderMap, name: &str) -> Option<String> {
    headers
        .get(name)
        .and_then(|value| value.to_str().ok())
        .map(|value| value.to_string())
}

fn error_message(body: &str) -> Option<String> {
    if body.is_empty() {
        return None;
    }
    let parsed: Value = serde_json::from_str(body).ok()?;
    if let Some(error) = parsed.get("error") {
        if let Some(message) = error.get("message").and_then(Value::as_str) {
            return Some(message.to_string());
        }
        if let Some(message) = error.as_str() {
            return Some(message.to_string());
        }
    }
    for key in ["message", "detail"] {
        if let Some(message) = parsed.get(key).and_then(Value::as_str) {
            return Some(message.to_string());
        }
    }
    None
}

fn retry_after_seconds(headers: &reqwest::header::HeaderMap) -> Option<f64> {
    let value = headers.get("Retry-After").and_then(|value| value.to_str().ok())?.trim().to_string();
    value.parse::<f64>().ok().map(|seconds| seconds.max(0.0))
}

fn backoff(attempt: u32, retry_after: Option<f64>) -> Duration {
    if let Some(seconds) = retry_after {
        return Duration::from_secs_f64(seconds.max(0.0));
    }
    let mut delay = BACKOFF_INITIAL_MS as f64 * BACKOFF_MULTIPLIER.powi(attempt as i32);
    let max = BACKOFF_MAX_MS as f64;
    if delay > max {
        delay = max;
    }
    delay += delay * BACKOFF_JITTER * jitter_fraction();
    Duration::from_millis(delay as u64)
}

/// A cheap 0..1 jitter fraction without a \`rand\` dependency (uses the clock's
/// sub-second nanos — enough to spread simultaneous retries).
fn jitter_fraction() -> f64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|elapsed| elapsed.subsec_nanos() as f64 / 1_000_000_000.0)
        .unwrap_or(0.0)
}

fn user_agent() -> String {
    let mut ua = USER_AGENT.to_string();
    for (env, slug) in AI_AGENT_ENV_VARS {
        if std::env::var(env).map(|value| !value.is_empty()).unwrap_or(false) {
            ua.push_str(" agent/");
            ua.push_str(slug);
            break;
        }
    }
    ua
}
`;
}
