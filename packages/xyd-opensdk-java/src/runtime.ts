import { type NamedType, type OpensdkSpecJson, walkMethods } from '@xyd-js/opensdk-core';
import type { GeneratedFile } from '@xyd-js/opensdk-framework';
import { type PageName, planOperation } from '@xyd-js/opensdk-framework';

import { javaFile } from './javawriter';
import { pascalCase } from './naming';
import type { JavaCtx } from './project';
import { methodEncoding } from './service';

// The vendored Java runtime — dependency-free (java.net.http + java.util + the
// hand-rolled Json codec below; NO okhttp / Jackson). Mirrors the Go/Python
// emitters' vendored runtime: a stdlib HTTP transport with a policy-driven
// retry loop, default timeout + env override and User-Agent assembly (all from
// sdkBehavior), multipart/form body encoders, wire-correct query serialization,
// status-mapped typed exceptions carrying a request id, and generic page
// containers — plus the manual encoder/decoder the generated models drive via
// the JsonSerializable / JsonEnum interfaces.

// A single backslash character — interpolated wherever the emitted Java source
// needs a literal backslash, so this generator never fights TS string escaping.
const B = '\\';

/**
 * The runtime files: Json.java (codec), the typed exceptions (ApiException +
 * status-mapped subclasses), Transport.java (HTTP), and — only when a spec
 * needs them — the multipart/form encoders (inline in Transport) and the
 * generic page containers.
 */
export function runtimeFiles(spec: OpensdkSpecJson, ctx: JavaCtx): GeneratedFile[] {
  const plans = walkMethods(spec).map(({ method }) => planOperation(method, ctx.types));
  // Vendored only when some method encodes a multipart/form body (a json-only
  // spec gets no dead encoder code).
  const needsForm = walkMethods(spec).some(({ method }) => methodEncoding(method, planOperation(method, ctx.types), ctx.types) !== 'json');
  const pageKinds = new Set(plans.map((p) => p.pageName).filter((p): p is PageName => p !== null));

  const files: GeneratedFile[] = [
    { path: `${ctx.srcDir}Json.java`, content: javaFile(ctx.fullPackage, JSON_IMPORTS, jsonBody()) },
    ...errorFiles(ctx),
    { path: `${ctx.srcDir}Transport.java`, content: javaFile(ctx.fullPackage, transportImports(needsForm), transportBody(ctx, needsForm)) },
  ];
  // Page containers are vendored only for the page kinds some list method returns.
  for (const kind of pageKinds) files.push(pageFile(kind, ctx));
  return files;
}

const JSON_IMPORTS = ['java.util.ArrayList', 'java.util.LinkedHashMap', 'java.util.List', 'java.util.Map'];

function jsonBody(): string {
  return `/**
 * A tiny, dependency-free JSON codec. The encoder walks Maps, Lists, Strings,
 * Numbers, Booleans and the generated JsonSerializable / JsonEnum types; the
 * parser is a small recursive-descent reader producing Map / List / String /
 * Long / Double / Boolean / null. Coercion helpers ({@link #asString} etc.) and
 * the element-mapping helpers ({@link #mapList} / {@link #mapValues}) drive the
 * generated models' fromJson / toJsonMap.
 */
public final class Json {
  private Json() {
  }

  /** Implemented by generated models so the encoder can serialize them. */
  public interface JsonSerializable {
    Map<String, Object> toJsonMap();
  }

  /** Implemented by generated enums so the encoder can serialize their wire value. */
  public interface JsonEnum {
    Object jsonValue();
  }

  /** Maps a parsed-JSON element to a typed value (list/map element decoding). */
  public interface Mapper<T> {
    T apply(Object value);
  }

  // ---- encode --------------------------------------------------------------

  public static String encode(Object value) {
    StringBuilder sb = new StringBuilder();
    write(sb, value);
    return sb.toString();
  }

  private static void write(StringBuilder sb, Object value) {
    if (value == null) {
      sb.append("null");
    } else if (value instanceof String) {
      writeString(sb, (String) value);
    } else if (value instanceof Boolean) {
      sb.append(value.toString());
    } else if (value instanceof Number) {
      sb.append(writeNumber((Number) value));
    } else if (value instanceof JsonEnum) {
      write(sb, ((JsonEnum) value).jsonValue());
    } else if (value instanceof JsonSerializable) {
      write(sb, ((JsonSerializable) value).toJsonMap());
    } else if (value instanceof Map) {
      writeObject(sb, (Map<?, ?>) value);
    } else if (value instanceof Iterable) {
      writeArray(sb, (Iterable<?>) value);
    } else {
      writeString(sb, value.toString());
    }
  }

  private static String writeNumber(Number number) {
    if (number instanceof Double || number instanceof Float) {
      double d = number.doubleValue();
      if (d == Math.floor(d) && !Double.isInfinite(d)) {
        return Long.toString((long) d);
      }
      return Double.toString(d);
    }
    return number.toString();
  }

  private static void writeObject(StringBuilder sb, Map<?, ?> map) {
    sb.append('{');
    boolean first = true;
    for (Map.Entry<?, ?> entry : map.entrySet()) {
      if (!first) {
        sb.append(',');
      }
      first = false;
      writeString(sb, String.valueOf(entry.getKey()));
      sb.append(':');
      write(sb, entry.getValue());
    }
    sb.append('}');
  }

  private static void writeArray(StringBuilder sb, Iterable<?> items) {
    sb.append('[');
    boolean first = true;
    for (Object item : items) {
      if (!first) {
        sb.append(',');
      }
      first = false;
      write(sb, item);
    }
    sb.append(']');
  }

  private static void writeString(StringBuilder sb, String value) {
    sb.append('"');
    for (int i = 0; i < value.length(); i++) {
      char c = value.charAt(i);
      if (c == '"' || c == '${B}${B}') {
        sb.append('${B}${B}').append(c);
      } else if (c == '${B}n') {
        sb.append('${B}${B}').append('n');
      } else if (c == '${B}r') {
        sb.append('${B}${B}').append('r');
      } else if (c == '${B}t') {
        sb.append('${B}${B}').append('t');
      } else if (c < 0x20) {
        sb.append(String.format("${B}${B}u%04x", (int) c));
      } else {
        sb.append(c);
      }
    }
    sb.append('"');
  }

  // ---- parse ---------------------------------------------------------------

  public static Object parse(String text) {
    return new Parser(text).parseDocument();
  }

  // ---- coercion ------------------------------------------------------------

  public static String asString(Object value) {
    return value == null ? null : value.toString();
  }

  public static Long asLong(Object value) {
    if (value == null) {
      return null;
    }
    if (value instanceof Number) {
      return ((Number) value).longValue();
    }
    return Long.parseLong(value.toString());
  }

  public static Double asDouble(Object value) {
    if (value == null) {
      return null;
    }
    if (value instanceof Number) {
      return ((Number) value).doubleValue();
    }
    return Double.parseDouble(value.toString());
  }

  public static Boolean asBoolean(Object value) {
    if (value == null) {
      return null;
    }
    if (value instanceof Boolean) {
      return (Boolean) value;
    }
    return Boolean.parseBoolean(value.toString());
  }

  public static byte[] asBytes(Object value) {
    if (value == null) {
      return null;
    }
    if (value instanceof byte[]) {
      return (byte[]) value;
    }
    return value.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
  }

  public static <T> List<T> mapList(Object raw, Mapper<T> mapper) {
    if (!(raw instanceof List)) {
      return null;
    }
    List<?> source = (List<?>) raw;
    List<T> out = new ArrayList<>(source.size());
    for (Object item : source) {
      out.add(mapper.apply(item));
    }
    return out;
  }

  public static <T> Map<String, T> mapValues(Object raw, Mapper<T> mapper) {
    if (!(raw instanceof Map)) {
      return null;
    }
    Map<?, ?> source = (Map<?, ?>) raw;
    Map<String, T> out = new LinkedHashMap<>();
    for (Map.Entry<?, ?> entry : source.entrySet()) {
      out.put(String.valueOf(entry.getKey()), mapper.apply(entry.getValue()));
    }
    return out;
  }

  // ---- recursive-descent parser -------------------------------------------

  private static final class Parser {
    private final String s;
    private int i;

    Parser(String s) {
      this.s = s;
    }

    Object parseDocument() {
      skipWhitespace();
      Object value = parseValue();
      skipWhitespace();
      return value;
    }

    private Object parseValue() {
      skipWhitespace();
      char c = peek();
      switch (c) {
        case '{':
          return parseObject();
        case '[':
          return parseArray();
        case '"':
          return parseString();
        case 't':
        case 'f':
          return parseBoolean();
        case 'n':
          return parseNull();
        default:
          return parseNumber();
      }
    }

    private Map<String, Object> parseObject() {
      Map<String, Object> out = new LinkedHashMap<>();
      expect('{');
      skipWhitespace();
      if (peek() == '}') {
        i++;
        return out;
      }
      while (true) {
        skipWhitespace();
        String key = parseString();
        skipWhitespace();
        expect(':');
        out.put(key, parseValue());
        skipWhitespace();
        char c = next();
        if (c == '}') {
          break;
        }
        if (c != ',') {
          throw error("expected ',' or '}'");
        }
      }
      return out;
    }

    private List<Object> parseArray() {
      List<Object> out = new ArrayList<>();
      expect('[');
      skipWhitespace();
      if (peek() == ']') {
        i++;
        return out;
      }
      while (true) {
        out.add(parseValue());
        skipWhitespace();
        char c = next();
        if (c == ']') {
          break;
        }
        if (c != ',') {
          throw error("expected ',' or ']'");
        }
      }
      return out;
    }

    private String parseString() {
      expect('"');
      StringBuilder sb = new StringBuilder();
      while (true) {
        char c = next();
        if (c == '"') {
          break;
        }
        if (c == '${B}${B}') {
          char esc = next();
          switch (esc) {
            case '"':
              sb.append('"');
              break;
            case '${B}${B}':
              sb.append('${B}${B}');
              break;
            case '/':
              sb.append('/');
              break;
            case 'n':
              sb.append('${B}n');
              break;
            case 'r':
              sb.append('${B}r');
              break;
            case 't':
              sb.append('${B}t');
              break;
            case 'b':
              sb.append('${B}b');
              break;
            case 'f':
              sb.append('${B}f');
              break;
            case 'u':
              String hex = s.substring(i, i + 4);
              i += 4;
              sb.append((char) Integer.parseInt(hex, 16));
              break;
            default:
              throw error("invalid escape: ${B}${B}" + esc);
          }
        } else {
          sb.append(c);
        }
      }
      return sb.toString();
    }

    private Object parseNumber() {
      int start = i;
      while (i < s.length() && isNumberChar(s.charAt(i))) {
        i++;
      }
      String token = s.substring(start, i);
      if (token.isEmpty()) {
        throw error("invalid token");
      }
      if (token.indexOf('.') >= 0 || token.indexOf('e') >= 0 || token.indexOf('E') >= 0) {
        return Double.parseDouble(token);
      }
      try {
        return Long.parseLong(token);
      } catch (NumberFormatException ex) {
        return Double.parseDouble(token);
      }
    }

    private Boolean parseBoolean() {
      if (s.startsWith("true", i)) {
        i += 4;
        return Boolean.TRUE;
      }
      if (s.startsWith("false", i)) {
        i += 5;
        return Boolean.FALSE;
      }
      throw error("invalid literal");
    }

    private Object parseNull() {
      if (s.startsWith("null", i)) {
        i += 4;
        return null;
      }
      throw error("invalid literal");
    }

    private boolean isNumberChar(char c) {
      return (c >= '0' && c <= '9') || c == '-' || c == '+' || c == '.' || c == 'e' || c == 'E';
    }

    private void skipWhitespace() {
      while (i < s.length()) {
        char c = s.charAt(i);
        if (c == ' ' || c == '${B}t' || c == '${B}n' || c == '${B}r') {
          i++;
        } else {
          break;
        }
      }
    }

    private char peek() {
      if (i >= s.length()) {
        throw error("unexpected end of input");
      }
      return s.charAt(i);
    }

    private char next() {
      if (i >= s.length()) {
        throw error("unexpected end of input");
      }
      return s.charAt(i++);
    }

    private void expect(char expected) {
      char actual = next();
      if (actual != expected) {
        throw error("expected '" + expected + "' but found '" + actual + "'");
      }
    }

    private RuntimeException error(String message) {
      return new IllegalArgumentException("JSON parse error at " + i + ": " + message);
    }
  }
}`;
}

/**
 * The typed exception hierarchy from sdk.errors: the base ApiException (its
 * `of` factory dispatches a non-2xx response to the mapped kind), plus one
 * `<Kind>Exception` subclass per mapped error kind (and the 4xx/5xx catch-alls
 * when they aren't the base). Mirrors the Go/Python per-kind error wrappers.
 */
function errorFiles(ctx: JavaCtx): GeneratedFile[] {
  const { statusCodeMap, clientErrorKind, serverErrorKind } = ctx.behavior.errors;
  const mapped = Object.entries(statusCodeMap)
    .map(([status, kind]) => [Number(status), kind] as [number, string])
    .filter(([status]) => Number.isFinite(status))
    .sort((a, b) => a[0] - b[0]);

  // className -> { kind, statuses } (several statuses may share a kind).
  const byClass = new Map<string, { kind: string; statuses: number[] }>();
  for (const [status, kind] of mapped) {
    const cls = errorClassName(kind);
    if (!cls) continue;
    const entry = byClass.get(cls) ?? { kind, statuses: [] };
    entry.statuses.push(status);
    byClass.set(cls, entry);
  }
  const serverCls = errorClassName(serverErrorKind);
  if (serverCls && !byClass.has(serverCls)) byClass.set(serverCls, { kind: serverErrorKind, statuses: [] });
  const clientCls = errorClassName(clientErrorKind);
  if (clientCls && !byClass.has(clientCls)) byClass.set(clientCls, { kind: clientErrorKind, statuses: [] });

  const files: GeneratedFile[] = [
    { path: `${ctx.srcDir}ApiException.java`, content: javaFile(ctx.fullPackage, [], apiExceptionBody(mapped, serverErrorKind, clientErrorKind)) },
  ];
  for (const [cls, { kind, statuses }] of byClass) {
    files.push({ path: `${ctx.srcDir}${cls}.java`, content: javaFile(ctx.fullPackage, [], subclassBody(cls, kind, statuses)) });
  }
  return files;
}

/** The Java exception class for a policy error kind, or null for the `API` base. */
function errorClassName(kind: string): string | null {
  if (kind === 'API') return null;
  return `${pascalCase(kind)}Exception`;
}

function apiExceptionBody(mapped: [number, string][], serverKind: string, clientKind: string): string {
  const cases = mapped
    .map(([status, kind]) => {
      const cls = errorClassName(kind);
      const expr = cls
        ? `new ${cls}(statusCode, message, rawBody, requestId)`
        : `new ApiException(statusCode, message, rawBody, requestId, ${JSON.stringify(kind)})`;
      return `      case ${status}:\n        return ${expr};`;
    })
    .join('\n');
  const switchBlock = mapped.length ? `    switch (statusCode) {\n${cases}\n    }\n` : '';
  const serverCls = errorClassName(serverKind);
  const serverBranch = serverCls
    ? `    if (statusCode >= 500) {\n      return new ${serverCls}(statusCode, message, rawBody, requestId);\n    }\n`
    : '';
  const clientCls = errorClassName(clientKind);
  const clientReturn = clientCls
    ? `    return new ${clientCls}(statusCode, message, rawBody, requestId);`
    : `    return new ApiException(statusCode, message, rawBody, requestId, ${JSON.stringify(clientKind)});`;

  return `/**
 * A non-2xx API response: the HTTP status, a best-effort message, the raw body
 * bytes, the server-assigned request id (from the configured request-id header)
 * and the policy error kind. Mapped statuses arrive as a concrete subclass
 * (e.g. {@link NotFoundException}) via {@link #of}.
 */
public class ApiException extends RuntimeException {
  private final int statusCode;
  private final byte[] rawBody;
  private final String requestId;
  private final String kind;

  public ApiException(int statusCode, String message) {
    this(statusCode, message, new byte[0], null, "API");
  }

  protected ApiException(int statusCode, String message, byte[] rawBody, String requestId, String kind) {
    super(message);
    this.statusCode = statusCode;
    this.rawBody = rawBody == null ? new byte[0] : rawBody;
    this.requestId = requestId;
    this.kind = kind;
  }

  public int statusCode() {
    return statusCode;
  }

  public byte[] rawBody() {
    return rawBody;
  }

  /** The server-assigned request id (sdk.telemetry.requestIdHeader), or null. */
  public String requestId() {
    return requestId;
  }

  /** The status-mapped error kind (sdk.errors), e.g. "NotFound" or "API". */
  public String kind() {
    return kind;
  }

  /** Dispatch a non-2xx response to its status-mapped exception kind (sdk.errors). */
  public static ApiException of(int statusCode, String message, byte[] rawBody, String requestId) {
${switchBlock}${serverBranch}${clientReturn}
  }
}`;
}

function subclassBody(cls: string, kind: string, statuses: number[]): string {
  const reason = statuses.length ? `HTTP ${statuses.join('/')} responses` : `unmapped ${cls.includes('Internal') ? '5xx' : 'error'} responses`;
  return `/** The ${JSON.stringify(kind)} error kind (${reason}). */
public final class ${cls} extends ApiException {
  public ${cls}(int statusCode, String message, byte[] rawBody, String requestId) {
    super(statusCode, message, rawBody, requestId, ${JSON.stringify(kind)});
  }
}`;
}

/** A generic page container class for one page kind (only the used kinds are emitted). */
function pageFile(kind: PageName, ctx: JavaCtx): GeneratedFile {
  const imports = ['java.util.ArrayList', 'java.util.LinkedHashMap', 'java.util.List', 'java.util.Map'];
  const decodeData =
    `    Map<?, ?> map = json instanceof Map ? (Map<?, ?>) json : new LinkedHashMap<>();\n` +
    `    List<T> data = Json.mapList(map.get("data"), mapper);\n` +
    `    if (data == null) {\n      data = new ArrayList<>();\n    }`;

  if (kind === 'Page') {
    const body = `/** One page of a marker-less list: the whole collection in one \`data\` envelope. */
public final class Page<T> {
  private final List<T> data;

  private Page(List<T> data) {
    this.data = data;
  }

  /** The items in this page. */
  public List<T> data() {
    return data;
  }

  /** Decode a {data:[...]} envelope, mapping each item with the supplied mapper. */
  public static <T> Page<T> fromJson(Object json, Json.Mapper<T> mapper) {
${decodeData}
    return new Page<>(data);
  }
}`;
    return { path: `${ctx.srcDir}Page.java`, content: javaFile(ctx.fullPackage, imports, body) };
  }

  const marker =
    kind === 'CursorPage'
      ? 'a cursor-paginated list: `data` plus a `has_more` marker'
      : 'an offset-paginated list: `data` plus an optional `has_more` marker';
  const body = `/** One page of ${marker}. */
public final class ${kind}<T> {
  private final List<T> data;
  private final boolean hasMore;

  private ${kind}(List<T> data, boolean hasMore) {
    this.data = data;
    this.hasMore = hasMore;
  }

  /** The items in this page. */
  public List<T> data() {
    return data;
  }

  /** Whether the server reports more pages after this one. */
  public boolean hasMore() {
    return hasMore;
  }

  /** Decode a {data:[...], has_more:bool} envelope, mapping each item with the supplied mapper. */
  public static <T> ${kind}<T> fromJson(Object json, Json.Mapper<T> mapper) {
${decodeData}
    Boolean hasMore = Json.asBoolean(map.get("has_more"));
    return new ${kind}<>(data, hasMore != null && hasMore);
  }
}`;
  return { path: `${ctx.srcDir}${kind}.java`, content: javaFile(ctx.fullPackage, imports, body) };
}

/** The Transport imports (the form/multipart encoders pull in a couple more). */
function transportImports(needsForm: boolean): string[] {
  const imports = [
    'java.net.URI',
    'java.net.URLEncoder',
    'java.net.http.HttpClient',
    'java.net.http.HttpRequest',
    'java.net.http.HttpResponse',
    'java.nio.charset.StandardCharsets',
    'java.time.Duration',
    'java.util.ArrayList',
    'java.util.LinkedHashMap',
    'java.util.List',
    'java.util.Map',
  ];
  if (needsForm) imports.push('java.io.ByteArrayOutputStream', 'java.io.IOException', 'java.util.UUID');
  return imports;
}

/** A Java `long` literal from a millisecond count. */
function javaMs(ms: number): string {
  return `${ms}L`;
}

/** A Java `double` literal (integers keep a trailing .0). */
function javaDouble(value: number): string {
  return Number.isInteger(value) ? `${value}.0` : String(value);
}

function transportBody(ctx: JavaCtx, needsForm: boolean): string {
  const authHeader = authHeaderBlock(ctx);
  const authQuery = authQueryBlock(ctx);
  const { retry, timeout, userAgent, telemetry } = ctx.behavior;

  // --- retryable status set literal ---
  const statuses = retry.retryableStatusCodes;
  const statusSet = statuses.length
    ? `java.util.Set.of(${statuses.join(', ')})`
    : 'java.util.Collections.<Integer>emptySet()';

  // --- timeout (const, or an env-overridable resolver) ---
  const timeoutBlock = timeout.timeoutEnvVar
    ? `  private static final long DEFAULT_TIMEOUT_MS = resolveTimeoutMs();\n\n` +
      `  /** The default per-request timeout (sdk.timeout), overridable via the ${timeout.timeoutEnvVar} env var (ms). */\n` +
      `  private static long resolveTimeoutMs() {\n` +
      `    String raw = System.getenv(${JSON.stringify(timeout.timeoutEnvVar)});\n` +
      `    if (raw != null && !raw.isEmpty()) {\n` +
      `      try {\n` +
      `        long ms = Long.parseLong(raw);\n` +
      `        if (ms >= 0) {\n          return ms;\n        }\n` +
      `      } catch (NumberFormatException ignored) {\n        // fall through to the default\n      }\n` +
      `    }\n` +
      `    return ${javaMs(timeout.defaultTimeoutMs)};\n` +
      `  }`
    : `  private static final long DEFAULT_TIMEOUT_MS = ${javaMs(timeout.defaultTimeoutMs)};`;

  // --- User-Agent assembly (identifier + optional runtime version + AI-agent sniff) ---
  const agents = Object.entries(userAgent.aiAgentEnvVars);
  const runtimeLine = userAgent.includeRuntimeVersion
    ? `    ua = ua + " java/" + System.getProperty("java.version");\n`
    : '';
  const agentBlock =
    agents.length > 0
      ? `    String[][] agents = {\n` +
        agents.map(([envVar, slug]) => `      {${JSON.stringify(envVar)}, ${JSON.stringify(slug)}},`).join('\n') +
        `\n    };\n` +
        `    for (String[] agent : agents) {\n` +
        `      String value = System.getenv(agent[0]);\n` +
        `      if (value != null && !value.isEmpty()) {\n` +
        `        ua = ua + " agent/" + agent[1];\n        break;\n      }\n` +
        `    }\n`
      : '';

  // --- body-encoding branch of buildRequest (multipart/form gated on needsForm) ---
  const jsonEncode =
    `      payload = Json.encode(request.body).getBytes(StandardCharsets.UTF_8);\n` +
    `      contentType = "application/json";`;
  const encodeBranch = needsForm
    ? `      switch (request.encoding) {\n` +
      `        case "multipart": {\n` +
      `          Multipart multipart = encodeMultipart(asMap(request.body));\n` +
      `          payload = multipart.body;\n` +
      `          contentType = multipart.contentType;\n` +
      `          break;\n        }\n` +
      `        case "form":\n` +
      `          payload = encodeForm(asMap(request.body));\n` +
      `          contentType = "application/x-www-form-urlencoded";\n` +
      `          break;\n` +
      `        default:\n${jsonEncode.replace(/^ {6}/gm, '          ')}\n          break;\n` +
      `      }`
    : jsonEncode;

  // --- Retry-After parsing (only when the policy honors it) ---
  const retryAfterHelper = retry.honorRetryAfterHeader
    ? `\n\n  /** The Retry-After delay in millis (delta-seconds or HTTP-date, capped at 60s), or -1 if absent. */\n` +
      `  private static long retryAfterMs(HttpResponse<byte[]> response) {\n` +
      `    String value = response.headers().firstValue("Retry-After").orElse(null);\n` +
      `    if (value == null) {\n      return -1;\n    }\n` +
      `    value = value.trim();\n` +
      `    try {\n` +
      `      long seconds = Long.parseLong(value);\n` +
      `      if (seconds >= 0) {\n        return Math.min(seconds * 1000L, 60000L);\n      }\n` +
      `    } catch (NumberFormatException ignored) {\n      // not a delta-seconds value; try the HTTP-date form\n    }\n` +
      `    try {\n` +
      `      java.time.ZonedDateTime when = java.time.ZonedDateTime.parse(value, java.time.format.DateTimeFormatter.RFC_1123_DATE_TIME);\n` +
      `      long wait = Duration.between(java.time.ZonedDateTime.now(), when).toMillis();\n` +
      `      if (wait > 0) {\n        return Math.min(wait, 60000L);\n      }\n` +
      `    } catch (java.time.format.DateTimeParseException ignored) {\n      // unparseable Retry-After; fall back to backoff\n    }\n` +
      `    return -1;\n  }`
    : '';
  const retryAfterCall = retry.honorRetryAfterHeader
    ? `    if (HONOR_RETRY_AFTER_HEADER && response != null) {\n` +
      `      long retryAfter = retryAfterMs(response);\n` +
      `      if (retryAfter >= 0) {\n        return retryAfter;\n      }\n    }\n`
    : '';

  // --- multipart/form encoders (only when a method needs them) ---
  const encodersBlock = needsForm
    ? `\n\n  @SuppressWarnings("unchecked")\n` +
      `  private static Map<String, Object> asMap(Object value) {\n    return (Map<String, Object>) value;\n  }\n\n` +
      `  /** application/x-www-form-urlencoded: repeated keys for list values, JSON for compound values. */\n` +
      `  private static byte[] encodeForm(Map<String, Object> body) {\n` +
      `    StringBuilder sb = new StringBuilder();\n` +
      `    for (Map.Entry<String, Object> entry : body.entrySet()) {\n` +
      `      Object value = entry.getValue();\n` +
      `      if (value instanceof Iterable) {\n` +
      `        for (Object item : (Iterable<?>) value) {\n          appendForm(sb, entry.getKey(), item);\n        }\n` +
      `      } else {\n        appendForm(sb, entry.getKey(), value);\n      }\n` +
      `    }\n` +
      `    return sb.toString().getBytes(StandardCharsets.UTF_8);\n  }\n\n` +
      `  private static void appendForm(StringBuilder sb, String key, Object value) {\n` +
      `    if (sb.length() > 0) {\n      sb.append('&');\n    }\n` +
      `    sb.append(encodeQuery(key)).append('=').append(encodeQuery(formValue(value)));\n  }\n\n` +
      `  private static String formValue(Object value) {\n` +
      `    if (value instanceof byte[]) {\n      return new String((byte[]) value, StandardCharsets.UTF_8);\n    }\n` +
      `    if (value instanceof Map || value instanceof Iterable) {\n      return Json.encode(value);\n    }\n` +
      `    return String.valueOf(value);\n  }\n\n` +
      `  /** A hand-built multipart/form-data body: byte[] values become file parts, everything else a field. */\n` +
      `  private static Multipart encodeMultipart(Map<String, Object> body) {\n` +
      `    String boundary = "----opensdk" + UUID.randomUUID().toString().replace("-", "");\n` +
      `    ByteArrayOutputStream out = new ByteArrayOutputStream();\n` +
      `    try {\n` +
      `      for (Map.Entry<String, Object> entry : body.entrySet()) {\n` +
      `        Object value = entry.getValue();\n` +
      `        if (value instanceof Iterable) {\n` +
      `          for (Object item : (Iterable<?>) value) {\n            writePart(out, boundary, entry.getKey(), item);\n          }\n` +
      `        } else {\n          writePart(out, boundary, entry.getKey(), value);\n        }\n` +
      `      }\n` +
      `      out.write(("--" + boundary + "--${B}r${B}n").getBytes(StandardCharsets.UTF_8));\n` +
      `    } catch (IOException e) {\n      throw new ApiException(0, "multipart encoding failed: " + e.getMessage());\n    }\n` +
      `    return new Multipart(out.toByteArray(), "multipart/form-data; boundary=" + boundary);\n  }\n\n` +
      `  private static void writePart(ByteArrayOutputStream out, String boundary, String name, Object value) throws IOException {\n` +
      `    out.write(("--" + boundary + "${B}r${B}n").getBytes(StandardCharsets.UTF_8));\n` +
      `    if (value instanceof byte[]) {\n` +
      `      out.write(("Content-Disposition: form-data; name=${B}"" + name + "${B}"; filename=${B}"" + name + "${B}"${B}r${B}n").getBytes(StandardCharsets.UTF_8));\n` +
      `      out.write("Content-Type: application/octet-stream${B}r${B}n${B}r${B}n".getBytes(StandardCharsets.UTF_8));\n` +
      `      out.write((byte[]) value);\n` +
      `    } else {\n` +
      `      out.write(("Content-Disposition: form-data; name=${B}"" + name + "${B}"${B}r${B}n${B}r${B}n").getBytes(StandardCharsets.UTF_8));\n` +
      `      out.write(formValue(value).getBytes(StandardCharsets.UTF_8));\n    }\n` +
      `    out.write("${B}r${B}n".getBytes(StandardCharsets.UTF_8));\n  }\n\n` +
      `  private static final class Multipart {\n    final byte[] body;\n    final String contentType;\n\n` +
      `    Multipart(byte[] body, String contentType) {\n      this.body = body;\n      this.contentType = contentType;\n    }\n  }`
    : '';

  return `/**
 * The HTTP transport: builds the URL + query + headers, attaches the configured
 * credential, encodes the request body (json / multipart / form), performs the
 * request via {@link java.net.http.HttpClient} with a policy-driven retry loop
 * (sdk.retry) and default timeout (sdk.timeout), and maps a non-2xx response to
 * a status-mapped {@link ApiException}. Dependency-free — java.net.http + the
 * Json codec only.
 */
public final class Transport {
  private static final String DEFAULT_BASE_URL = ${JSON.stringify(ctx.baseURL)};
  private static final String USER_AGENT = userAgent();
  private static final int MAX_RETRIES = ${retry.maxRetries};
  private static final java.util.Set<Integer> RETRYABLE_STATUS_CODES = ${statusSet};
  private static final boolean RETRY_CONNECTION_ERRORS = ${retry.retryConnectionErrors};
  private static final boolean HONOR_RETRY_AFTER_HEADER = ${retry.honorRetryAfterHeader};
  private static final long BACKOFF_INITIAL_DELAY_MS = ${javaMs(retry.backoff.initialDelayMs)};
  private static final long BACKOFF_MAX_DELAY_MS = ${javaMs(retry.backoff.maxDelayMs)};
  private static final double BACKOFF_MULTIPLIER = ${javaDouble(retry.backoff.multiplier)};
  private static final double BACKOFF_JITTER = ${javaDouble(retry.backoff.jitter)};
  private static final String REQUEST_ID_HEADER = ${JSON.stringify(telemetry.requestIdHeader)};
${timeoutBlock}

  private final String baseUrl;
  private final String apiKey;
  private final HttpClient http;

  public Transport(String baseUrl, String apiKey) {
    this.baseUrl = (baseUrl == null || baseUrl.isEmpty()) ? DEFAULT_BASE_URL : baseUrl;
    this.apiKey = apiKey;
    this.http = HttpClient.newHttpClient();
  }

  /** The SDK User-Agent (sdk.userAgent): the identifier plus an AI-agent slug when a known env var is set. */
  private static String userAgent() {
    String ua = ${JSON.stringify(ctx.userAgent)};
${runtimeLine}${agentBlock}    return ua;
  }

  /** A single request, assembled by the generated service methods. */
  public static final class Request {
    final String method;
    final String path;
    final Map<String, List<String>> query = new LinkedHashMap<>();
    final Map<String, String> headers = new LinkedHashMap<>();
    Object body;
    String encoding = "json";
    String accept;

    public Request(String method, String path) {
      this.method = method;
      this.path = path;
    }

    public Request query(String key, String value) {
      query.computeIfAbsent(key, unused -> new ArrayList<>()).add(value);
      return this;
    }

    public Request header(String key, String value) {
      headers.put(key, value);
      return this;
    }

    public Request body(Object value) {
      this.body = value;
      return this;
    }

    public Request encoding(String encoding) {
      this.encoding = encoding;
      return this;
    }

    public Request accept(String contentType) {
      this.accept = contentType;
      return this;
    }
  }

  /** Perform the request and return the parsed JSON body (null for an empty body). */
  public Object execute(Request request) {
    HttpResponse<byte[]> response = send(request);
    byte[] bytes = response.body();
    if (bytes == null || bytes.length == 0) {
      return null;
    }
    return Json.parse(new String(bytes, StandardCharsets.UTF_8));
  }

  /** Perform the request and return the raw response bytes (binary downloads). */
  public byte[] executeRaw(Request request) {
    return send(request).body();
  }

  private HttpResponse<byte[]> send(Request request) {
    HttpRequest httpRequest = buildRequest(request);
    int attempt = 0;
    while (true) {
      HttpResponse<byte[]> response;
      try {
        response = http.send(httpRequest, HttpResponse.BodyHandlers.ofByteArray());
      } catch (java.io.IOException e) {
        if (RETRY_CONNECTION_ERRORS && attempt < MAX_RETRIES) {
          sleep(retryDelayMs(attempt, null));
          attempt++;
          continue;
        }
        throw new ApiException(0, "request failed: " + e.getMessage());
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        throw new ApiException(0, "request interrupted: " + e.getMessage());
      }
      int status = response.statusCode();
      if (status >= 400) {
        if (attempt < MAX_RETRIES && RETRYABLE_STATUS_CODES.contains(status)) {
          sleep(retryDelayMs(attempt, response));
          attempt++;
          continue;
        }
        byte[] body = response.body();
        String requestId = response.headers().firstValue(REQUEST_ID_HEADER).orElse(null);
        String message = errorMessage(body);
        throw ApiException.of(status, message != null ? message : "HTTP " + status, body, requestId);
      }
      return response;
    }
  }

  /** Assemble the immutable HttpRequest once (the body is encoded up front so retries replay the same bytes). */
  private HttpRequest buildRequest(Request request) {
    HttpRequest.Builder builder = HttpRequest.newBuilder().uri(URI.create(buildUrl(request)));
    builder.header("User-Agent", USER_AGENT);
    if (DEFAULT_TIMEOUT_MS > 0) {
      builder.timeout(Duration.ofMillis(DEFAULT_TIMEOUT_MS));
    }
    if (request.accept != null) {
      builder.header("Accept", request.accept);
    }
    for (Map.Entry<String, String> entry : request.headers.entrySet()) {
      builder.header(entry.getKey(), entry.getValue());
    }
${authHeader}    if (request.body != null) {
      byte[] payload;
      String contentType;
${encodeBranch}
      builder.header("Content-Type", contentType);
      builder.method(request.method, HttpRequest.BodyPublishers.ofByteArray(payload));
    } else {
      builder.method(request.method, HttpRequest.BodyPublishers.noBody());
    }
    return builder.build();
  }

  /** The delay before the next retry attempt: Retry-After when honored, else jittered exponential backoff (sdk.retry). */
  private static long retryDelayMs(int attempt, HttpResponse<byte[]> response) {
${retryAfterCall}    double delay = BACKOFF_INITIAL_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, attempt);
    delay = Math.min(delay, BACKOFF_MAX_DELAY_MS);
    return (long) (delay + delay * BACKOFF_JITTER * Math.random());
  }${retryAfterHelper}

  private static void sleep(long millis) {
    if (millis <= 0) {
      return;
    }
    try {
      Thread.sleep(millis);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }
  }

  private String buildUrl(Request request) {
    StringBuilder sb = new StringBuilder();
    String trimmed = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    sb.append(trimmed);
    sb.append(request.path.startsWith("/") ? request.path : "/" + request.path);
    Map<String, List<String>> query = new LinkedHashMap<>(request.query);
${authQuery}    if (!query.isEmpty()) {
      sb.append('?');
      boolean first = true;
      for (Map.Entry<String, List<String>> entry : query.entrySet()) {
        for (String value : entry.getValue()) {
          sb.append(first ? "" : "&");
          first = false;
          sb.append(encodeQuery(entry.getKey())).append('=').append(encodeQuery(value));
        }
      }
    }
    return sb.toString();
  }

  /** URL-encode a path segment (spaces as %20, not '+'). */
  public static String encodePath(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
  }

  private static String encodeQuery(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }

  /** Best-effort message from a JSON error envelope ({"error": {"message": ...}} etc.). */
  private static String errorMessage(byte[] body) {
    if (body == null || body.length == 0) {
      return null;
    }
    try {
      Object parsed = Json.parse(new String(body, StandardCharsets.UTF_8));
      if (parsed instanceof Map) {
        Map<?, ?> map = (Map<?, ?>) parsed;
        Object error = map.get("error");
        if (error instanceof Map) {
          Object message = ((Map<?, ?>) error).get("message");
          if (message instanceof String) {
            return (String) message;
          }
        }
        if (error instanceof String) {
          return (String) error;
        }
        for (String key : new String[] {"message", "detail"}) {
          Object value = map.get(key);
          if (value instanceof String) {
            return (String) value;
          }
        }
      }
    } catch (RuntimeException ignored) {
      // fall through to null
    }
    return null;
  }${encodersBlock}
}`;
}

/** Auth applied as a request header (bearer / apiKey-header / apiKey-cookie), or '' otherwise. */
function authHeaderBlock(ctx: JavaCtx): string {
  const name = ctx.authName || '';
  switch (ctx.authKind) {
    case 'bearer':
      return (
        `    if (apiKey != null) {\n` +
        `      builder.header("Authorization", "Bearer " + apiKey);\n` +
        `    }\n`
      );
    case 'apiKey-header':
      return `    if (apiKey != null) {\n      builder.header(${JSON.stringify(name)}, apiKey);\n    }\n`;
    case 'apiKey-cookie':
      return `    if (apiKey != null) {\n      builder.header("Cookie", ${JSON.stringify(`${name}=`)} + apiKey);\n    }\n`;
    default:
      return '';
  }
}

/** Auth applied as a query parameter (apiKey-query), or '' otherwise. */
function authQueryBlock(ctx: JavaCtx): string {
  if (ctx.authKind !== 'apiKey-query') return '';
  const name = ctx.authName || '';
  return (
    `    if (apiKey != null) {\n` +
    `      query.computeIfAbsent(${JSON.stringify(name)}, unused -> new ArrayList<>()).add(apiKey);\n` +
    `    }\n`
  );
}
