import { type OpensdkSpecJson, type ResolvedSdkBehavior, type SdkSecurity, sdkBehavior } from '@xyd-js/opensdk-core';

/**
 * The dependency-free TypeScript runtime, mirroring openai-node's `core/`
 * layout:
 *   core/error.ts      — the APIError base + policy error-kind subclasses + dispatch
 *   core/resource.ts   — the APIResource base every resource class extends
 *   core/request.ts    — the fetch transport (auth, retry/timeout/UA, JSON/form/multipart)
 *   core/pagination.ts — the vendored page containers (emitted only when a method pages)
 *
 * Uses ONLY built-ins: global `fetch`, `URL`, `Headers`, `Response`, `FormData`,
 * `Blob`, `URLSearchParams`, `AbortController`, `crypto` (all from the DOM lib —
 * no `@types/node`) plus an ambient `process` for env-var reads. Runtime BEHAVIOR
 * (retry loop, timeout, User-Agent, error kinds, idempotency) is policy-driven:
 * every constant is interpolated from the IR's `sdk` block via `sdkBehavior(spec)`.
 */
export function runtimeFiles(
  spec: OpensdkSpecJson,
  baseURL: string,
  pkg: string,
  withPagination: boolean,
): Record<string, string> {
  const files: Record<string, string> = {
    'src/core/error.ts': errorTs(sdkBehavior(spec)),
    'src/core/resource.ts': resourceTs(),
    'src/core/request.ts': requestTs(spec, baseURL, pkg),
  };
  if (withPagination) files['src/core/pagination.ts'] = paginationTs();
  return files;
}

// ---- literal helpers -------------------------------------------------------

function tsStr(value: string): string {
  return JSON.stringify(value);
}

function tsBool(value: boolean): string {
  return value ? 'true' : 'false';
}

function tsStrRecord(record: Record<string, string>): string {
  const entries = Object.entries(record).map(([k, v]) => `${tsStr(k)}: ${tsStr(v)}`);
  return `{ ${entries.join(', ')} }`;
}

// ---- error-kind classes (sdk.errors) --------------------------------------

/** The class name for a policy error kind: `NotFound` -> `NotFoundError`; the canonical `API` kind IS `APIError`. */
function errorClassName(kind: string): string {
  if (kind === 'API') return 'APIError';
  return kind.endsWith('Error') ? kind : `${kind}Error`;
}

/** The generated `APIError` subclass names (sorted), for the public index re-export. */
export function errorClassNames(spec: OpensdkSpecJson): string[] {
  const behavior = sdkBehavior(spec);
  const names = new Set<string>();
  for (const kind of Object.values(behavior.errors.statusCodeMap)) names.add(errorClassName(kind));
  names.add(errorClassName(behavior.errors.serverErrorKind));
  names.add(errorClassName(behavior.errors.clientErrorKind));
  names.delete('APIError');
  return [...names].sort();
}

/** The per-kind subclasses + the status -> class dispatch table + errorForStatus(). */
function errorClassesBlock(behavior: ResolvedSdkBehavior): string {
  const mapped = Object.entries(behavior.errors.statusCodeMap)
    .map(([status, kind]) => [Number(status), kind] as const)
    .sort((a, b) => a[0] - b[0]);

  // class -> { kind, statuses } (several statuses may share one kind).
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

  const subclass = (cls: string, kind: string, doc: string): string =>
    `/** ${doc} */\nexport class ${cls} extends APIError {\n  override readonly kind = ${tsStr(kind)};\n}`;

  const classes: string[] = [];
  for (const [cls, { kind, statuses }] of byClass) {
    classes.push(subclass(cls, kind, `The mapped error for HTTP ${statuses.join('/')} responses.`));
  }
  if (serverClass !== 'APIError' && !byClass.has(serverClass)) {
    classes.push(subclass(serverClass, behavior.errors.serverErrorKind, 'Catch-all for unmapped 5xx responses.'));
  }
  if (clientClass !== 'APIError' && !byClass.has(clientClass) && clientClass !== serverClass) {
    classes.push(subclass(clientClass, behavior.errors.clientErrorKind, 'Catch-all for unmapped non-5xx responses.'));
  }

  const tableEntries = mapped.map(([status, kind]) => `  ${status}: ${errorClassName(kind)},`);
  const table = tableEntries.length
    ? `const STATUS_TO_ERROR: Record<number, APIErrorConstructor> = {\n${tableEntries.join('\n')}\n};`
    : 'const STATUS_TO_ERROR: Record<number, APIErrorConstructor> = {};';

  return `${classes.join('\n\n')}

${table}

/** The policy-mapped error: exact status map first, then the 5xx catch-all, then the client catch-all. */
export function errorForStatus(status: number, message: string, headers: Headers, body: string): APIError {
  const Ctor = STATUS_TO_ERROR[status] ?? (status >= 500 ? ${serverClass} : ${clientClass});
  return new Ctor(status, message, headers, body);
}`;
}

function errorTs(behavior: ResolvedSdkBehavior): string {
  const requestIdHeader = behavior.telemetry.requestIdHeader;
  const docTemplate = behavior.errors.errorDocUrlTemplate;
  const docBlock = docTemplate
    ? `
  /** A documentation URL for this error kind (sdk.errors.errorDocUrlTemplate). */
  docURL(): string {
    return ${tsStr(docTemplate)}.replace('{kind}', this.kind).replace('{status}', String(this.status));
  }
`
    : '';

  return `/** The telemetry header the request id is read from (sdk.telemetry.requestIdHeader). */
export const REQUEST_ID_HEADER = ${tsStr(requestIdHeader)};

/** A constructor shared by APIError and its policy subclasses. */
type APIErrorConstructor = new (status: number, message: string, headers: Headers, body: string) => APIError;

/** The error thrown for a non-2xx API response: status, headers, raw body and request id. */
export class APIError extends Error {
  readonly status: number;
  readonly headers: Headers;
  readonly body: string;
  /** The captured request id (from the telemetry header), when present. */
  readonly requestId: string | undefined;
  /** The policy error kind (overridden by subclasses). */
  readonly kind: string = 'API';

  constructor(status: number, message: string, headers: Headers, body: string) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.headers = headers;
    this.body = body;
    this.requestId = headers.get(REQUEST_ID_HEADER) ?? undefined;
  }
${docBlock}}

${errorClassesBlock(behavior)}
`;
}

function resourceTs(): string {
  return `import type { APIClient } from './request';

/** The base class every resource (\`client.pets\`, ...) extends: it holds the client. */
export abstract class APIResource {
  protected _client: APIClient;

  constructor(client: APIClient) {
    this._client = client;
  }
}
`;
}

/** The auth statement injected into request(), by security kind (first scheme wins). */
function authStatement(scheme: SdkSecurity | undefined): string {
  if (!scheme) return '';
  const name = scheme.name || '';
  switch (scheme.kind) {
    case 'apiKey-header':
      return `    if (this.apiKey) headers[${tsStr(name)}] = this.apiKey;\n`;
    case 'apiKey-query':
      return `    if (this.apiKey) url.searchParams.set(${tsStr(name)}, this.apiKey);\n`;
    case 'apiKey-cookie':
      return `    if (this.apiKey) headers['Cookie'] = ${tsStr(`${name}=`)} + this.apiKey;\n`;
    default:
      // bearer / http — the common case.
      return `    if (this.apiKey) headers['Authorization'] = 'Bearer ' + this.apiKey;\n`;
  }
}

function requestTs(spec: OpensdkSpecJson, baseURL: string, pkg: string): string {
  const behavior = sdkBehavior(spec);
  const auth = authStatement(spec.security?.[0]);
  const retry = behavior.retry;

  // sdk.userAgent: the identifier is assembled at generation time from the
  // template; the runtime-version suffix + AI-agent sniff run at runtime.
  const userAgent = behavior.userAgent.sdkIdentifierTemplate
    .replace(/\{package\}/g, pkg)
    .replace(/\{language\}/g, 'node')
    .replace(/\{version\}/g, spec.info.version || '0.0.0');
  const includeRuntimeVersion = behavior.userAgent.includeRuntimeVersion;
  const timeoutEnvVar = behavior.timeout.timeoutEnvVar;

  const constants = [
    `export const DEFAULT_BASE_URL = ${tsStr(baseURL)};`,
    `const USER_AGENT = ${tsStr(userAgent)};`,
    `const AI_AGENT_ENV_VARS: Record<string, string> = ${tsStrRecord(behavior.userAgent.aiAgentEnvVars)};`,
    `const DEFAULT_TIMEOUT_MS = ${behavior.timeout.defaultTimeoutMs};`,
    ...(timeoutEnvVar ? [`const TIMEOUT_ENV_VAR = ${tsStr(timeoutEnvVar)};`] : []),
    `const MAX_RETRIES = ${retry.maxRetries};`,
    `const RETRYABLE_STATUS_CODES = new Set<number>([${retry.retryableStatusCodes.join(', ')}]);`,
    `const RETRY_CONNECTION_ERRORS = ${tsBool(retry.retryConnectionErrors)};`,
    `const HONOR_RETRY_AFTER_HEADER = ${tsBool(retry.honorRetryAfterHeader)};`,
    `const BACKOFF_INITIAL_DELAY_MS = ${retry.backoff.initialDelayMs};`,
    `const BACKOFF_MAX_DELAY_MS = ${retry.backoff.maxDelayMs};`,
    `const BACKOFF_MULTIPLIER = ${retry.backoff.multiplier};`,
    `const BACKOFF_JITTER = ${retry.backoff.jitter};`,
    `const IDEMPOTENCY_HEADER = ${tsStr(behavior.idempotency.headerName)};`,
  ].join('\n');

  const runtimeVersion = includeRuntimeVersion
    ? `  if (typeof process !== 'undefined' && process?.versions?.node) ua += ' node/' + process.versions.node;\n`
    : '';

  const defaultTimeoutBody = timeoutEnvVar
    ? `  const raw = readEnv(TIMEOUT_ENV_VAR);
  if (raw) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return DEFAULT_TIMEOUT_MS;`
    : '  return DEFAULT_TIMEOUT_MS;';

  return `import { errorForStatus } from './error';

declare const process: { env: Record<string, string | undefined>; versions?: { node?: string } } | undefined;

${constants}

/** Read an environment variable without a hard dependency on \`@types/node\`. */
export function readEnv(name: string): string | undefined {
  return typeof process !== 'undefined' && process ? process.env[name] : undefined;
}

/** The policy default request timeout in milliseconds (0 = no deadline). */
function defaultTimeout(): number {
${defaultTimeoutBody}
}

/** The policy User-Agent: SDK identifier plus an AI-agent slug when a known agent env var is set. */
function userAgent(): string {
  let ua = USER_AGENT;
${runtimeVersion}  for (const [envVar, slug] of Object.entries(AI_AGENT_ENV_VARS)) {
    if (readEnv(envVar)) {
      ua += ' agent/' + slug;
      break;
    }
  }
  return ua;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Milliseconds to wait before a retry attempt (0-based): Retry-After wins when honored,
 * else min(initial * multiplier**attempt, max) plus proportional random jitter. */
function retryDelay(attempt: number, headers: Headers | null): number {
  if (HONOR_RETRY_AFTER_HEADER && headers) {
    const after = retryAfterMs(headers);
    if (after !== null) return after;
  }
  const delay = Math.min(BACKOFF_INITIAL_DELAY_MS * BACKOFF_MULTIPLIER ** attempt, BACKOFF_MAX_DELAY_MS);
  return delay + delay * BACKOFF_JITTER * Math.random();
}

/** A Retry-After header as milliseconds: the integer-seconds and the HTTP-date forms. */
function retryAfterMs(headers: Headers): number | null {
  const value = headers.get('Retry-After');
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\\d+$/.test(trimmed)) return Number(trimmed) * 1000;
  const when = Date.parse(trimmed);
  if (Number.isNaN(when)) return null;
  return Math.max(0, when - Date.now());
}

/** Coerce a scalar to its wire string form (booleans lower-cased). */
function textValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value !== null && typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** Serialize an explode=false array query parameter as one comma-joined value. */
export function joinCsv(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) return textValue(value);
  return value.map((item) => textValue(item)).join(',');
}

/** Encode a multipart/form-data body (built-in FormData): binary values become file parts. */
function toFormData(payload: Record<string, unknown>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item === undefined || item === null) continue;
      if (item instanceof Blob) form.append(key, item);
      else if (item instanceof Uint8Array) form.append(key, new Blob([item]), key);
      else form.append(key, textValue(item));
    }
  }
  return form;
}

/** Encode an application/x-www-form-urlencoded body (built-in URLSearchParams). */
function toURLSearchParams(payload: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item === undefined || item === null) continue;
      params.append(key, textValue(item));
    }
  }
  return params;
}

/** Options for constructing a client. */
export interface ClientOptions {
  /** API key; defaults to the configured environment variable. */
  apiKey?: string;
  /** Override the API base URL. */
  baseURL?: string;
  /** Per-request timeout in milliseconds (0 disables). Default: the sdk.timeout policy. */
  timeout?: number;
  /** A custom \`fetch\` implementation (defaults to the global \`fetch\`). */
  fetch?: typeof fetch;
}

/** Per-call request overrides. */
export interface RequestOptions {
  /** Extra headers merged onto (and overriding) the request's headers. */
  headers?: Record<string, string | undefined>;
  /** An AbortSignal to cancel the request. */
  signal?: AbortSignal;
}

/** The wire encoding of a request body. */
export type BodyEncoding = 'json' | 'multipart' | 'form';

/** The assembled arguments of a single API call (built by the resource methods). */
export interface RequestArgs {
  method: string;
  path: string;
  /** \`object\` (not \`Record<string, unknown>\`) so a named params interface — which
   * lacks an index signature — is assignable as the whole-object query shorthand. */
  query?: object;
  body?: unknown;
  headers?: Record<string, unknown>;
  /** The body wire encoding (default json). */
  encoding?: BodyEncoding;
  /** Return the raw \`Response\` without JSON-decoding (binary/stream downloads). */
  raw?: boolean;
  /** Inject a generated idempotency key (one per logical call, stable across retries). */
  idempotency?: boolean;
}

/** Copy header entries onto \`target\`, coercing values and dropping undefined/null. */
function assignHeaders(target: Record<string, string>, source: Record<string, unknown> | undefined): void {
  for (const [key, value] of Object.entries(source ?? {})) {
    if (value === undefined || value === null) continue;
    target[key] = textValue(value);
  }
}

/** The fetch-based transport shared by every resource: auth, retry/timeout/UA, JSON/form/multipart. */
export class APIClient {
  protected readonly apiKey?: string;
  protected readonly baseURL: string;
  protected readonly fetchImpl: typeof fetch;
  protected readonly timeoutMs: number;
  protected readonly userAgent: string;

  constructor(options: ClientOptions = {}) {
    this.apiKey = options.apiKey;
    this.baseURL = (options.baseURL ?? DEFAULT_BASE_URL).replace(/\\/+$/, '');
    this.fetchImpl = options.fetch ?? fetch;
    this.timeoutMs = options.timeout ?? defaultTimeout();
    this.userAgent = userAgent();
  }

  /** A per-attempt timeout signal composed with the caller's signal (no AbortSignal.any dependency). */
  private startTimeout(userSignal?: AbortSignal): { signal: AbortSignal | undefined; clear: () => void } {
    if (!this.timeoutMs) return { signal: userSignal, clear: () => {} };
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    const timer = setTimeout(onAbort, this.timeoutMs);
    if (userSignal) {
      if (userSignal.aborted) controller.abort();
      else userSignal.addEventListener('abort', onAbort, { once: true });
    }
    return {
      signal: controller.signal,
      clear: () => {
        clearTimeout(timer);
        if (userSignal) userSignal.removeEventListener('abort', onAbort);
      },
    };
  }

  /** Execute a request: build the URL + headers, attach auth, encode the body,
   * run the retry loop, and decode the JSON response (or return the raw \`Response\`). */
  async request<T>(args: RequestArgs, options?: RequestOptions): Promise<T> {
    const url = new URL(this.baseURL + args.path);
    if (args.query) {
      for (const [key, value] of Object.entries(args.query as Record<string, unknown>)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          for (const item of value) url.searchParams.append(key, textValue(item));
        } else {
          url.searchParams.set(key, textValue(value));
        }
      }
    }

    const headers: Record<string, string> = { Accept: 'application/json', 'User-Agent': this.userAgent };
    assignHeaders(headers, args.headers);
    assignHeaders(headers, options?.headers);
${auth}
    let body: BodyInit | undefined;
    if (args.body !== undefined && args.body !== null) {
      const encoding: BodyEncoding = args.encoding ?? 'json';
      const payload = args.body as Record<string, unknown>;
      if (encoding === 'multipart') {
        // fetch sets the multipart Content-Type (with boundary) for a FormData body.
        body = toFormData(payload);
      } else if (encoding === 'form') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        body = toURLSearchParams(payload);
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(args.body);
      }
    }

    if (args.idempotency && headers[IDEMPOTENCY_HEADER] === undefined) {
      // Generated before the loop so every retry carries the SAME idempotency key.
      headers[IDEMPOTENCY_HEADER] = crypto.randomUUID();
    }

    let attempt = 0;
    for (;;) {
      const timeout = this.startTimeout(options?.signal);
      let response: Response;
      try {
        response = await this.fetchImpl(url.toString(), {
          method: args.method,
          headers,
          body,
          signal: timeout.signal,
        });
      } catch (error) {
        timeout.clear();
        if (RETRY_CONNECTION_ERRORS && attempt < MAX_RETRIES && !options?.signal?.aborted) {
          await sleep(retryDelay(attempt, null));
          attempt++;
          continue;
        }
        throw error;
      }
      timeout.clear();

      if (!response.ok) {
        if (attempt < MAX_RETRIES && RETRYABLE_STATUS_CODES.has(response.status)) {
          await sleep(retryDelay(attempt, response.headers));
          attempt++;
          continue;
        }
        const errorBody = await response.text();
        throw errorForStatus(
          response.status,
          args.method + ' ' + args.path + ' failed with status ' + response.status,
          response.headers,
          errorBody,
        );
      }

      if (args.raw) return response as unknown as T;
      if (response.status === 204) return undefined as T;
      const text = await response.text();
      return (text ? JSON.parse(text) : undefined) as T;
    }
  }
}
`;
}

/** The vendored page containers, emitted only when some list method pages. */
function paginationTs(): string {
  return `/**
 * One page of a cursor-paginated list: the \`data\` items plus a \`has_more\` marker.
 * (Auto-pager continuation — fetching the next page — is a phase-2+ seam.)
 */
export class CursorPage<T> {
  readonly data: T[];
  readonly hasMore: boolean;

  constructor(data: T[], hasMore: boolean) {
    this.data = data;
    this.hasMore = hasMore;
  }

  static fromResponse<T>(raw: unknown): CursorPage<T> {
    const payload = (raw ?? {}) as { data?: T[]; has_more?: boolean };
    return new CursorPage<T>(payload.data ?? [], Boolean(payload.has_more));
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.data.values();
  }
}

/** One page of a marker-less list: the whole collection in one \`data\` envelope. */
export class Page<T> {
  readonly data: T[];

  constructor(data: T[]) {
    this.data = data;
  }

  static fromResponse<T>(raw: unknown): Page<T> {
    const payload = (raw ?? {}) as { data?: T[] };
    return new Page<T>(payload.data ?? []);
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.data.values();
  }
}

/** One page of an offset-paginated list: the \`data\` items for the requested window. */
export class OffsetPage<T> {
  readonly data: T[];

  constructor(data: T[]) {
    this.data = data;
  }

  static fromResponse<T>(raw: unknown): OffsetPage<T> {
    const payload = (raw ?? {}) as { data?: T[] };
    return new OffsetPage<T>(payload.data ?? []);
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.data.values();
  }
}
`;
}
