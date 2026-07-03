import { type OpensdkSpecJson, type ResolvedSdkBehavior, sdkBehavior } from '@xyd-js/opensdk-core';

// The generated Python runtime, mirroring the Go emitter's vendored runtime at
// its minimum bar: a stdlib-only transport (urllib) with structured APIError,
// wire-correct query/form/multipart encoding, best-effort typed decode into
// the generated dataclasses, and (only when a method pages) generic
// CursorPage/Page containers.
//
// Runtime BEHAVIOR (retry loop, timeout, User-Agent, error kinds, request
// guard, idempotency) is policy-driven: every constant below is interpolated
// from the IR's `sdk` block via opensdk-core's `sdkBehavior(spec)`, so the
// Python and Go runtimes encode the same declared values instead of drifting.

// ---- Python literal helpers ------------------------------------------------

function pyStr(value: string): string {
  return JSON.stringify(value);
}

function pyBool(value: boolean): string {
  return value ? 'True' : 'False';
}

/** A float literal (Python): integers render as `60.0` so units read as seconds. */
function pyFloat(value: number): string {
  return Number.isInteger(value) ? `${value}.0` : String(value);
}

function pyFrozenset(items: string[]): string {
  return items.length ? `frozenset({${items.join(', ')}})` : 'frozenset()';
}

function pyStrDict(record: Record<string, string>): string {
  const entries = Object.entries(record).map(([key, value]) => `${pyStr(key)}: ${pyStr(value)}`);
  return `{${entries.join(', ')}}`;
}

// ---- error-kind classes (sdk.errors) --------------------------------------

/**
 * The Python exception class for a policy error kind: `NotFound` ->
 * `NotFoundError`; the canonical client kind `API` IS the `APIError` base.
 */
function errorClassName(kind: string): string {
  if (kind === 'API') return 'APIError';
  return kind.endsWith('Error') ? kind : `${kind}Error`;
}

/**
 * The generated `APIError` subclass names (sorted), for the package
 * `__init__` exports. `APIError` itself is not included.
 */
export function errorClassNames(spec: OpensdkSpecJson): string[] {
  const behavior = sdkBehavior(spec);
  const names = new Set<string>();
  for (const kind of Object.values(behavior.errors.statusCodeMap)) names.add(errorClassName(kind));
  names.add(errorClassName(behavior.errors.serverErrorKind));
  names.add(errorClassName(behavior.errors.clientErrorKind));
  names.delete('APIError');
  return [...names].sort();
}

/** The per-kind exception classes plus the status -> class dispatch table. */
function errorClassesBlock(behavior: ResolvedSdkBehavior): string {
  const mapped = Object.entries(behavior.errors.statusCodeMap)
    .map(([status, kind]) => [Number(status), kind] as const)
    .sort((a, b) => a[0] - b[0]);

  // Class -> its policy kind + the statuses it maps (several statuses may share a kind).
  const byClass = new Map<string, { kind: string; statuses: number[] }>();
  for (const [status, kind] of mapped) {
    const cls = errorClassName(kind);
    if (cls === 'APIError') continue;
    const entry = byClass.get(cls) || { kind, statuses: [] };
    entry.statuses.push(status);
    byClass.set(cls, entry);
  }

  const serverClass = errorClassName(behavior.errors.serverErrorKind);
  const clientClass = errorClassName(behavior.errors.clientErrorKind);

  const errorClass = (cls: string, kind: string, doc: string): string =>
    `class ${cls}(APIError):\n    """${doc}"""\n\n    kind = ${pyStr(kind)}`;

  const classes: string[] = [];
  for (const [cls, { kind, statuses }] of byClass) {
    classes.push(errorClass(cls, kind, `The mapped error kind for HTTP ${statuses.join('/')} responses.`));
  }
  if (serverClass !== 'APIError' && !byClass.has(serverClass)) {
    classes.push(errorClass(serverClass, behavior.errors.serverErrorKind, 'Catch-all for unmapped 5xx responses.'));
  }
  if (clientClass !== 'APIError' && !byClass.has(clientClass) && clientClass !== serverClass) {
    classes.push(
      errorClass(clientClass, behavior.errors.clientErrorKind, 'Catch-all for unmapped non-5xx error responses.'),
    );
  }

  const tableEntries = mapped.map(([status, kind]) => `    ${status}: ${errorClassName(kind)},`);
  const table = tableEntries.length
    ? `_STATUS_TO_ERROR: dict[int, type] = {\n${tableEntries.join('\n')}\n}`
    : '_STATUS_TO_ERROR: dict[int, type] = {}';

  return `${classes.join('\n\n\n')}\n\n\n${table}


def _error_for_status(status_code: int, headers: dict[str, str], body: bytes) -> APIError:
    """The policy-mapped exception: exact status map first, then the 5xx catch-all, then the client catch-all."""
    cls = _STATUS_TO_ERROR.get(status_code)
    if cls is None:
        cls = ${serverClass} if status_code >= 500 else ${clientClass}
    return cls(status_code, headers, body)`;
}

// ---- _transport.py (auth + behavior policies baked from the spec) ----------

export function transportPy(spec: OpensdkSpecJson, pkg: string, baseURL: string): string {
  const behavior = sdkBehavior(spec);

  const security = spec.security?.[0];
  let authLine = '';
  if (security) {
    const name = security.name || '';
    switch (security.kind) {
      case 'apiKey-header':
        authLine = `            request_headers[${JSON.stringify(name)}] = self.api_key\n`;
        break;
      case 'apiKey-query':
        authLine = `            params[${JSON.stringify(name)}] = self.api_key\n`;
        break;
      default:
        authLine = `            request_headers["Authorization"] = "Bearer " + self.api_key\n`;
    }
  }
  const authBlock = authLine ? `        if self.api_key:\n${authLine}` : '';

  // sdk.userAgent: the identifier is assembled at generation time from the
  // template; the runtime-version suffix and AI-agent sniff run at runtime.
  const userAgent = behavior.userAgent.sdkIdentifierTemplate
    .replace(/\{package\}/g, pkg)
    .replace(/\{language\}/g, 'python')
    .replace(/\{version\}/g, spec.info.version || '0.0.0');

  // sdk.timeout: milliseconds in the IR, seconds on urlopen; 0 = no deadline.
  const timeoutMs = behavior.timeout.defaultTimeoutMs;
  const defaultTimeout = timeoutMs > 0 ? pyFloat(timeoutMs / 1000) : 'None';
  const timeoutEnvVar = behavior.timeout.timeoutEnvVar;

  const retry = behavior.retry;
  const errorDocUrlTemplate = behavior.errors.errorDocUrlTemplate;
  const includeRuntimeVersion = behavior.userAgent.includeRuntimeVersion;

  const constants = [
    `DEFAULT_BASE_URL = ${pyStr(baseURL)}`,
    `USER_AGENT = ${pyStr(userAgent)}`,
    `AI_AGENT_ENV_VARS = ${pyStrDict(behavior.userAgent.aiAgentEnvVars)}`,
    `DEFAULT_TIMEOUT: Optional[float] = ${defaultTimeout}`,
    ...(timeoutEnvVar ? [`TIMEOUT_ENV_VAR = ${pyStr(timeoutEnvVar)}`] : []),
    `MAX_RETRIES = ${retry.maxRetries}`,
    `RETRYABLE_STATUS_CODES = ${pyFrozenset(retry.retryableStatusCodes.map(String))}`,
    `RETRY_CONNECTION_ERRORS = ${pyBool(retry.retryConnectionErrors)}`,
    `HONOR_RETRY_AFTER_HEADER = ${pyBool(retry.honorRetryAfterHeader)}`,
    `BACKOFF_INITIAL_DELAY = ${pyFloat(retry.backoff.initialDelayMs / 1000)}`,
    `BACKOFF_MAX_DELAY = ${pyFloat(retry.backoff.maxDelayMs / 1000)}`,
    `BACKOFF_MULTIPLIER = ${pyFloat(retry.backoff.multiplier)}`,
    `BACKOFF_JITTER = ${pyFloat(retry.backoff.jitter)}`,
    `REQUEST_ID_HEADER = ${pyStr(behavior.telemetry.requestIdHeader)}`,
    `IDEMPOTENCY_HEADER = ${pyStr(behavior.idempotency.headerName)}`,
    ...(errorDocUrlTemplate ? [`ERROR_DOC_URL_TEMPLATE = ${pyStr(errorDocUrlTemplate)}`] : []),
    `GUARDED_OPTION_KEYS = ${pyFrozenset(behavior.requestGuard.optionKeys.map(pyStr))}`,
  ].join('\n');

  // sdk.errors.errorDocUrlTemplate ({kind}/{status} placeholders) is appended
  // to the error's string form only when the policy declares it.
  const errorDocStr = errorDocUrlTemplate
    ? `

    def __str__(self) -> str:
        url = ERROR_DOC_URL_TEMPLATE.replace("{kind}", self.kind).replace("{status}", str(self.status_code))
        return self.message + " (" + url + ")"`
    : '';

  const runtimeVersionLine = includeRuntimeVersion ? '\n    ua += " python/" + platform.python_version()' : '';

  return `from __future__ import annotations

import dataclasses
import datetime
import email.utils
import json
import os${includeRuntimeVersion ? '\nimport platform' : ''}
import random
import time
import typing
import urllib.error
import urllib.parse
import urllib.request
import uuid
from enum import Enum
from typing import Any, Optional

${constants}


class APIError(Exception):
    """A non-2xx API response: status code, headers, raw body, request id and a best-effort message."""

    kind = "API"

    def __init__(self, status_code: int, headers: dict[str, str], body: bytes) -> None:
        self.status_code = status_code
        self.headers = headers
        self.body = body
        self.request_id = _header(headers, REQUEST_ID_HEADER)
        self.message = _error_message(body) or "HTTP " + str(status_code)
        super().__init__(self.message)${errorDocStr}


${errorClassesBlock(behavior)}


def _error_message(body: bytes) -> Optional[str]:
    """Best-effort message from a JSON error envelope ({"error": {"message": ...}} etc.)."""
    try:
        payload = json.loads(body.decode("utf-8"))
    except Exception:
        return None
    if not isinstance(payload, dict):
        return None
    error = payload.get("error")
    if isinstance(error, dict) and isinstance(error.get("message"), str):
        return error["message"]
    if isinstance(error, str):
        return error
    for key in ("message", "detail"):
        if isinstance(payload.get(key), str):
            return payload[key]
    return None


def _header(headers: dict[str, str], name: str) -> Optional[str]:
    """Case-insensitive header lookup."""
    target = name.lower()
    for key, value in headers.items():
        if key.lower() == target:
            return value
    return None


def _user_agent() -> str:
    """The policy User-Agent: SDK identifier, plus an AI-agent slug when a known agent env var is set."""
    ua = USER_AGENT${runtimeVersionLine}
    for env_var, slug in AI_AGENT_ENV_VARS.items():
        if os.environ.get(env_var):
            ua += " agent/" + slug
            break
    return ua


def _default_timeout() -> Optional[float]:
${
  timeoutEnvVar
    ? `    """The policy default timeout in seconds; TIMEOUT_ENV_VAR (milliseconds) overrides it when set."""
    raw = os.environ.get(TIMEOUT_ENV_VAR)
    if raw:
        try:
            return float(raw) / 1000.0
        except ValueError:
            pass
    return DEFAULT_TIMEOUT`
    : `    """The policy default timeout in seconds (None = no deadline)."""
    return DEFAULT_TIMEOUT`
}


def _retry_delay(attempt: int, headers: Optional[dict[str, str]]) -> float:
    """Seconds to sleep before retry attempt (0-based): a Retry-After header
    wins when honored; otherwise min(initial * multiplier**attempt, max) plus
    proportional random jitter."""
    if HONOR_RETRY_AFTER_HEADER and headers:
        retry_after = _retry_after_seconds(headers)
        if retry_after is not None:
            return retry_after
    delay = min(BACKOFF_INITIAL_DELAY * (BACKOFF_MULTIPLIER ** attempt), BACKOFF_MAX_DELAY)
    return delay + delay * BACKOFF_JITTER * random.random()


def _retry_after_seconds(headers: dict[str, str]) -> Optional[float]:
    """A Retry-After header as seconds: both the integer-seconds and the HTTP-date forms."""
    value = _header(headers, "Retry-After")
    if value is None:
        return None
    value = value.strip()
    if value.isdigit():
        return float(value)
    try:
        parsed = email.utils.parsedate_to_datetime(value)
    except (TypeError, ValueError):
        return None
    if parsed is None:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=datetime.timezone.utc)
    return max(0.0, (parsed - datetime.datetime.now(datetime.timezone.utc)).total_seconds())


def _guard_options(params: Optional[dict[str, Any]]) -> None:
    """Fail fast when a request-option key (api_key, max_retries, ...) is
    misplaced into request params — a misplaced credential would otherwise be
    sent on the wire and end up in provider logs."""
    for key in params or ():
        if key in GUARDED_OPTION_KEYS:
            raise ValueError(
                "request option " + repr(key) + " must be set on the client, not passed as a request parameter"
            )


def encode(value: Any) -> Any:
    """Wire-encode a request value: dataclasses -> dicts keyed by wire name
    (None fields dropped), enums -> their values; lists/dicts recurse."""
    if isinstance(value, Enum):
        return encode(value.value)
    if dataclasses.is_dataclass(value) and not isinstance(value, type):
        out: dict[str, Any] = {}
        for f in dataclasses.fields(value):
            item = getattr(value, f.name)
            if item is None:
                continue
            out[f.metadata.get("wire", f.name)] = encode(item)
        return out
    if isinstance(value, (list, tuple)):
        return [encode(item) for item in value]
    if isinstance(value, dict):
        return {key: encode(item) for key, item in value.items()}
    return value


def decode(tp: Any, value: Any) -> Any:
    """Best-effort decode of parsed JSON into the generated models: dataclasses
    are built field-by-field (honoring wire names), enums by value; unknown
    shapes are returned as-is."""
    if value is None or tp is None or tp is Any:
        return value
    origin = typing.get_origin(tp)
    if origin is not None:
        args = typing.get_args(tp)
        if origin is list and isinstance(value, list):
            item_tp = args[0] if args else Any
            return [decode(item_tp, item) for item in value]
        if origin is dict and isinstance(value, dict):
            value_tp = args[1] if len(args) > 1 else Any
            return {key: decode(value_tp, item) for key, item in value.items()}
        if origin is typing.Union:
            for arg in args:
                if arg is type(None):
                    continue
                try:
                    decoded = decode(arg, value)
                except Exception:
                    continue
                if decoded is not value:
                    return decoded
            return value
        return value
    if isinstance(tp, type) and issubclass(tp, Enum):
        try:
            return tp(value)
        except ValueError:
            return value
    if isinstance(tp, type) and dataclasses.is_dataclass(tp) and isinstance(value, dict):
        try:
            hints = typing.get_type_hints(tp)
        except Exception:
            hints = {}
        kwargs: dict[str, Any] = {}
        for f in dataclasses.fields(tp):
            wire = f.metadata.get("wire", f.name)
            if wire in value:
                kwargs[f.name] = decode(hints.get(f.name, Any), value[wire])
            elif f.default is dataclasses.MISSING and f.default_factory is dataclasses.MISSING:
                kwargs[f.name] = None
        return tp(**kwargs)
    return value


def join_csv(value: Optional[list]) -> Optional[str]:
    """Serialize an explode=false array parameter as one comma-joined value."""
    if value is None:
        return None
    return ",".join(_text(encode(item)) for item in value)


def _text(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (dict, list)):
        return json.dumps(value)
    return str(value)


def _query_value(value: Any) -> Any:
    encoded = encode(value)
    if isinstance(encoded, list):
        return [_text(item) for item in encoded]
    return _text(encoded)


def _multipart(payload: dict[str, Any]) -> tuple[bytes, str]:
    """Encode a multipart/form-data body (stdlib-only, manual boundary).
    bytes / file-like values become file parts; lists become repeated parts."""
    boundary = uuid.uuid4().hex
    chunks: list[bytes] = []
    for name, value in payload.items():
        items = value if isinstance(value, list) else [value]
        for item in items:
            chunks.append(("--" + boundary + "\\r\\n").encode("utf-8"))
            if isinstance(item, bytes) or hasattr(item, "read"):
                content = item if isinstance(item, bytes) else item.read()
                if isinstance(content, str):
                    content = content.encode("utf-8")
                filename = str(getattr(item, "name", name)).replace("\\\\", "/").split("/")[-1] or name
                disposition = 'Content-Disposition: form-data; name="' + name + '"; filename="' + filename + '"\\r\\n'
                chunks.append(disposition.encode("utf-8"))
                chunks.append(b"Content-Type: application/octet-stream\\r\\n\\r\\n")
                chunks.append(content)
            else:
                chunks.append(('Content-Disposition: form-data; name="' + name + '"\\r\\n\\r\\n').encode("utf-8"))
                chunks.append(_text(item).encode("utf-8"))
            chunks.append(b"\\r\\n")
    chunks.append(("--" + boundary + "--\\r\\n").encode("utf-8"))
    return b"".join(chunks), "multipart/form-data; boundary=" + boundary


class Transport:
    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: Optional[float] = None,
    ) -> None:
        self.base_url = (base_url or DEFAULT_BASE_URL).rstrip("/")
        self.api_key = api_key
        self.timeout = timeout if timeout is not None else _default_timeout()
        self.user_agent = _user_agent()

    def request(
        self,
        method: str,
        path: str,
        query: Optional[dict[str, Any]] = None,
        body: Optional[dict[str, Any]] = None,
        headers: Optional[dict[str, Any]] = None,
        encoding: str = "json",
        raw: bool = False,
        idempotency: bool = False,
    ) -> Any:
        _guard_options(query)
        _guard_options(body)
        url = self.base_url + path
        params = {k: _query_value(v) for k, v in (query or {}).items() if v is not None}
        request_headers: dict[str, str] = {k: _text(v) for k, v in (headers or {}).items() if v is not None}
        request_headers.setdefault("User-Agent", self.user_agent)
        data = None
        if body is not None:
            payload = {k: encode(v) for k, v in body.items() if v is not None}
            if encoding == "multipart":
                data, content_type = _multipart(payload)
                request_headers["Content-Type"] = content_type
            elif encoding == "form":
                data = urllib.parse.urlencode(payload, doseq=True).encode("utf-8")
                request_headers["Content-Type"] = "application/x-www-form-urlencoded"
            else:
                data = json.dumps(payload).encode("utf-8")
                request_headers["Content-Type"] = "application/json"
${authBlock}        if idempotency:
            # One key per logical call, generated before the retry loop so every
            # retry of this request carries the SAME idempotency key.
            request_headers.setdefault(IDEMPOTENCY_HEADER, str(uuid.uuid4()))
        if params:
            url += "?" + urllib.parse.urlencode(params, doseq=True)
        attempt = 0
        while True:
            request = urllib.request.Request(url, data=data, method=method, headers=request_headers)
            try:
                with urllib.request.urlopen(request, timeout=self.timeout) as response:
                    content = response.read()
            except urllib.error.HTTPError as error:
                error_headers = dict(error.headers.items())
                error_body = error.read()
                if attempt < MAX_RETRIES and error.code in RETRYABLE_STATUS_CODES:
                    time.sleep(_retry_delay(attempt, error_headers))
                    attempt += 1
                    continue
                raise _error_for_status(error.code, error_headers, error_body) from None
            except OSError:
                # Connection/timeout errors (URLError, reset, DNS failure, socket timeout).
                if RETRY_CONNECTION_ERRORS and attempt < MAX_RETRIES:
                    time.sleep(_retry_delay(attempt, None))
                    attempt += 1
                    continue
                raise
            if raw:
                return content
            return json.loads(content.decode("utf-8")) if content else None
`;
}

// ---- _pagination.py (only emitted when some method returns a page) -------

export function paginationPy(): string {
  return `from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Generic, Iterator, TypeVar

from ._transport import decode

T = TypeVar("T")


@dataclass
class CursorPage(Generic[T]):
    """One page of a cursor-paginated list: \`data\` plus a \`has_more\` marker."""

    data: list[T] = field(default_factory=list)
    has_more: bool = False

    def __iter__(self) -> Iterator[T]:
        return iter(self.data)

    @classmethod
    def from_response(cls, item_type: Any, raw: Any) -> CursorPage[T]:
        payload = raw if isinstance(raw, dict) else {}
        data = [decode(item_type, item) for item in payload.get("data") or []]
        return cls(data=data, has_more=bool(payload.get("has_more") or False))


@dataclass
class Page(Generic[T]):
    """One page of a marker-less list: the whole collection in one \`data\` envelope."""

    data: list[T] = field(default_factory=list)

    def __iter__(self) -> Iterator[T]:
        return iter(self.data)

    @classmethod
    def from_response(cls, item_type: Any, raw: Any) -> Page[T]:
        payload = raw if isinstance(raw, dict) else {}
        return cls(data=[decode(item_type, item) for item in payload.get("data") or []])
`;
}
