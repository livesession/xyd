import { type OpensdkSpecJson, type ResolvedSdkBehavior, type SdkSecurity, sdkBehavior } from '@xyd-js/opensdk-core';

import { CS_HEADER } from './cswriter';
import { pascalCase } from './naming';

export interface DotnetRuntimeCtx {
  sdk: string;
  namespace: string;
  baseURL: string;
  security: SdkSecurity[];
}

// ---- C# literal helpers ----------------------------------------------------

function csStr(value: string): string {
  return JSON.stringify(value);
}

function csBool(value: boolean): string {
  return value ? 'true' : 'false';
}

/** A C# double literal — integers render as `2.0` so the type is unambiguous. */
function csDouble(value: number): string {
  return Number.isInteger(value) ? `${value}.0` : String(value);
}

// ---- error-kind classes (sdk.errors) --------------------------------------

/**
 * The C# exception class for a policy error kind: `NotFound` ->
 * `NotFoundException`; the canonical client kind `API` IS the `ApiException`
 * base.
 */
function errorClassName(kind: string): string {
  if (kind === 'API') return 'ApiException';
  return `${pascalCase(kind)}Exception`;
}

/** The per-kind exception subclasses (sorted, base excluded). */
function errorClassDecls(behavior: ResolvedSdkBehavior): string {
  const byClass = new Map<string, string>(); // class -> kind
  const add = (kind: string) => {
    const cls = errorClassName(kind);
    if (cls !== 'ApiException' && !byClass.has(cls)) byClass.set(cls, kind);
  };
  for (const kind of Object.values(behavior.errors.statusCodeMap)) add(kind);
  add(behavior.errors.serverErrorKind);
  add(behavior.errors.clientErrorKind);

  const classes = [...byClass.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return classes
    .map(([cls, kind]) => {
      return (
        `/// <summary>The typed exception for the ${kind} error kind.</summary>\n` +
        `public sealed class ${cls} : ApiException\n{\n` +
        `    public ${cls}(int statusCode, string? responseBody, string? requestId, string message)\n` +
        `        : base(statusCode, responseBody, requestId, message)\n    {\n    }\n\n` +
        `    /// <inheritdoc/>\n    public override string Kind => ${csStr(kind)};\n}`
      );
    })
    .join('\n\n');
}

/** The status -> exception dispatch (switch expression body). */
function errorDispatch(behavior: ResolvedSdkBehavior): string {
  const mapped = Object.entries(behavior.errors.statusCodeMap)
    .map(([status, kind]) => [Number(status), kind] as const)
    .sort((a, b) => a[0] - b[0]);
  const args = 'status, body, requestId, message';
  const cases = mapped
    .map(([status, kind]) => `            ${status} => new ${errorClassName(kind)}(${args}),`)
    .join('\n');
  const serverClass = errorClassName(behavior.errors.serverErrorKind);
  const clientClass = errorClassName(behavior.errors.clientErrorKind);
  return (
    `        return status switch\n        {\n${cases}\n` +
    `            _ => status >= 500 ? new ${serverClass}(${args}) : new ${clientClass}(${args}),\n` +
    `        };`
  );
}

// ---- auth ------------------------------------------------------------------

/**
 * The auth statements, split by phase: `urlBlock` mutates the URL before the
 * request is built (apiKey-query), `headerBlock` adds a header after (bearer /
 * apiKey-header). Guarded on a non-empty credential.
 */
function authBlocks(security: SdkSecurity[]): { urlBlock: string; headerBlock: string } {
  const scheme = security[0];
  if (!scheme) return { urlBlock: '', headerBlock: '' };
  const name = scheme.name || '';
  const guard = (stmt: string, pad: string) =>
    `${pad}if (!string.IsNullOrEmpty(_apiKey))\n${pad}{\n${pad}    ${stmt}\n${pad}}\n`;
  switch (scheme.kind) {
    case 'apiKey-query':
      return {
        urlBlock: guard(
          `url += (url.Contains('?') ? "&" : "?") + ${csStr(`${name}=`)} + Uri.EscapeDataString(_apiKey);`,
          '        ',
        ),
        headerBlock: '',
      };
    case 'apiKey-header':
      return {
        urlBlock: '',
        headerBlock: guard(`request.Headers.TryAddWithoutValidation(${csStr(name)}, _apiKey);`, '        '),
      };
    default:
      return {
        urlBlock: '',
        headerBlock: guard(
          'request.Headers.TryAddWithoutValidation("Authorization", "Bearer " + _apiKey);',
          '        ',
        ),
      };
  }
}

/**
 * Emit `Transport.cs`: the vendored, dependency-free runtime — a `System.Net.Http`
 * + `System.Text.Json` request pipeline whose runtime BEHAVIOR is policy-driven.
 * Every constant (retry policy, default timeout + env override, User-Agent +
 * ai-agent sniff, error kinds, idempotency header) is interpolated from the IR's
 * `sdk` block via opensdk-core's `sdkBehavior(spec)`, so the .NET runtime encodes
 * the SAME declared values as the Go/Python runtimes. Non-2xx responses raise a
 * per-kind `ApiException` subclass carrying the status, body and request id.
 * Multipart/form bodies go through stdlib encoders (`MultipartFormDataContent` /
 * `FormUrlEncodedContent`); no external `PackageReference`.
 */
export function renderTransportFile(spec: OpensdkSpecJson, ctx: DotnetRuntimeCtx): string {
  const behavior = sdkBehavior(spec);
  const { urlBlock, headerBlock } = authBlocks(ctx.security);
  const retry = behavior.retry;

  const userAgent = behavior.userAgent.sdkIdentifierTemplate
    .replace(/\{package\}/g, ctx.sdk)
    .replace(/\{language\}/g, 'dotnet')
    .replace(/\{version\}/g, spec.info.version || '0.0.0');
  const includeRuntimeVersion = behavior.userAgent.includeRuntimeVersion;
  const timeoutMs = behavior.timeout.defaultTimeoutMs;
  const timeoutEnvVar = behavior.timeout.timeoutEnvVar;

  const aiAgentEntries = Object.entries(behavior.userAgent.aiAgentEnvVars)
    .map(([env, slug]) => `        [${csStr(env)}] = ${csStr(slug)},`)
    .join('\n');

  const constants = [
    `    private const string DefaultBaseUrl = ${csStr(ctx.baseURL)};`,
    `    private const string UserAgentIdentifier = ${csStr(userAgent)};`,
    `    private static readonly bool IncludeRuntimeVersion = ${csBool(includeRuntimeVersion)};`,
    `    private const int DefaultTimeoutMs = ${timeoutMs};`,
    ...(timeoutEnvVar ? [`    private const string TimeoutEnvVar = ${csStr(timeoutEnvVar)};`] : []),
    `    private const int MaxRetries = ${retry.maxRetries};`,
    `    private static readonly bool RetryConnectionErrors = ${csBool(retry.retryConnectionErrors)};`,
    `    private static readonly bool HonorRetryAfterHeader = ${csBool(retry.honorRetryAfterHeader)};`,
    `    private const double BackoffInitialMs = ${csDouble(retry.backoff.initialDelayMs)};`,
    `    private const double BackoffMaxMs = ${csDouble(retry.backoff.maxDelayMs)};`,
    `    private const double BackoffMultiplier = ${csDouble(retry.backoff.multiplier)};`,
    `    private const double BackoffJitter = ${csDouble(retry.backoff.jitter)};`,
    `    private const string RequestIdHeader = ${csStr(behavior.telemetry.requestIdHeader)};`,
    `    private const string IdempotencyHeader = ${csStr(behavior.idempotency.headerName)};`,
    `    private static readonly HashSet<int> RetryableStatusCodes = new() { ${retry.retryableStatusCodes.join(', ')} };`,
    `    private static readonly Dictionary<string, string> AiAgentEnvVars = new()\n    {\n${aiAgentEntries}\n    };`,
  ].join('\n');

  const timeoutBody = timeoutEnvVar
    ? `        string? raw = Environment.GetEnvironmentVariable(TimeoutEnvVar);
        if (!string.IsNullOrEmpty(raw) && double.TryParse(raw, NumberStyles.Any, CultureInfo.InvariantCulture, out double ms))
        {
            return TimeSpan.FromMilliseconds(ms);
        }
        return DefaultTimeoutMs > 0 ? TimeSpan.FromMilliseconds(DefaultTimeoutMs) : TimeSpan.Zero;`
    : `        return DefaultTimeoutMs > 0 ? TimeSpan.FromMilliseconds(DefaultTimeoutMs) : TimeSpan.Zero;`;

  const runtimeVersionLine = includeRuntimeVersion
    ? `        if (IncludeRuntimeVersion)\n        {\n            ua += " dotnet/" + Environment.Version.ToString();\n        }\n`
    : '';

  return `${CS_HEADER}

using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace ${ctx.namespace};

/// <summary>The base exception for a non-2xx API response; carries the status code, raw body and request id.</summary>
public class ApiException : Exception
{
    /// <summary>The HTTP status code of the failing response.</summary>
    public int StatusCode { get; }

    /// <summary>The raw response body, when available.</summary>
    public string? ResponseBody { get; }

    /// <summary>The request id echoed by the server (policy header), when present.</summary>
    public string? RequestId { get; }

    public ApiException(int statusCode, string? responseBody, string? requestId, string message)
        : base(message)
    {
        StatusCode = statusCode;
        ResponseBody = responseBody;
        RequestId = requestId;
    }

    /// <summary>The policy error kind this exception represents.</summary>
    public virtual string Kind => "API";
}

${errorClassDecls(behavior)}

/// <summary>The dependency-free HTTP transport shared by every resource service.</summary>
internal sealed class Transport
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNameCaseInsensitive = true,
    };

${constants}

    private readonly HttpClient _http;
    private readonly string _baseUrl;
    private readonly string? _apiKey;
    private readonly string _userAgent;
    private readonly TimeSpan _timeout;

    public Transport(string baseUrl, string? apiKey, HttpClient? httpClient = null)
    {
        _baseUrl = (baseUrl ?? DefaultBaseUrl).TrimEnd('/');
        _apiKey = apiKey;
        _http = httpClient ?? new HttpClient();
        _userAgent = BuildUserAgent();
        _timeout = DefaultTimeout();
    }

    public async Task<T> RequestAsync<T>(
        HttpMethod method,
        string path,
        object? body = null,
        IReadOnlyDictionary<string, object?>? query = null,
        IReadOnlyDictionary<string, string?>? headers = null,
        string encoding = "json",
        bool idempotency = false,
        CancellationToken cancellationToken = default)
    {
        using HttpResponseMessage response = await ExecuteAsync(method, path, body, query, headers, encoding, null, idempotency, cancellationToken)
            .ConfigureAwait(false);
        string content = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
        {
            throw BuildError(response, content);
        }
        if (string.IsNullOrEmpty(content))
        {
            return default!;
        }
        return JsonSerializer.Deserialize<T>(content, JsonOptions)!;
    }

    public async Task RequestAsync(
        HttpMethod method,
        string path,
        object? body = null,
        IReadOnlyDictionary<string, object?>? query = null,
        IReadOnlyDictionary<string, string?>? headers = null,
        string encoding = "json",
        bool idempotency = false,
        CancellationToken cancellationToken = default)
    {
        using HttpResponseMessage response = await ExecuteAsync(method, path, body, query, headers, encoding, null, idempotency, cancellationToken)
            .ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
        {
            string content = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            throw BuildError(response, content);
        }
    }

    /// <summary>Execute a request and return the raw response body (used for discriminated-union decode).</summary>
    public async Task<string> RequestStringAsync(
        HttpMethod method,
        string path,
        object? body = null,
        IReadOnlyDictionary<string, object?>? query = null,
        IReadOnlyDictionary<string, string?>? headers = null,
        string encoding = "json",
        bool idempotency = false,
        CancellationToken cancellationToken = default)
    {
        using HttpResponseMessage response = await ExecuteAsync(method, path, body, query, headers, encoding, null, idempotency, cancellationToken)
            .ConfigureAwait(false);
        string content = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
        {
            throw BuildError(response, content);
        }
        return content;
    }

    public async Task<byte[]> RequestRawAsync(
        HttpMethod method,
        string path,
        object? body = null,
        IReadOnlyDictionary<string, object?>? query = null,
        IReadOnlyDictionary<string, string?>? headers = null,
        string encoding = "json",
        string? accept = null,
        bool idempotency = false,
        CancellationToken cancellationToken = default)
    {
        using HttpResponseMessage response = await ExecuteAsync(method, path, body, query, headers, encoding, accept, idempotency, cancellationToken)
            .ConfigureAwait(false);
        byte[] bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
        {
            throw BuildError(response, Encoding.UTF8.GetString(bytes));
        }
        return bytes;
    }

    /// <summary>Send with the retry policy: retryable statuses and connection errors back off (Retry-After honored).</summary>
    private async Task<HttpResponseMessage> ExecuteAsync(
        HttpMethod method,
        string path,
        object? body,
        IReadOnlyDictionary<string, object?>? query,
        IReadOnlyDictionary<string, string?>? headers,
        string encoding,
        string? accept,
        bool idempotency,
        CancellationToken cancellationToken)
    {
        // One key per logical call, generated before the loop so every retry
        // carries the SAME idempotency key.
        string? idempotencyKey = idempotency ? Guid.NewGuid().ToString() : null;
        int attempt = 0;
        while (true)
        {
            using HttpRequestMessage request = BuildRequest(method, path, body, query, headers, encoding, accept, idempotencyKey);
            HttpResponseMessage response;
            try
            {
                using var timeoutSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                if (_timeout > TimeSpan.Zero)
                {
                    timeoutSource.CancelAfter(_timeout);
                }
                response = await _http.SendAsync(request, timeoutSource.Token).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    throw;
                }
                if (RetryConnectionErrors && attempt < MaxRetries && IsConnectionError(ex))
                {
                    await Task.Delay(RetryDelay(attempt, null), cancellationToken).ConfigureAwait(false);
                    attempt++;
                    continue;
                }
                throw;
            }
            if (attempt < MaxRetries && RetryableStatusCodes.Contains((int)response.StatusCode))
            {
                TimeSpan delay = RetryDelay(attempt, response.Headers);
                response.Dispose();
                await Task.Delay(delay, cancellationToken).ConfigureAwait(false);
                attempt++;
                continue;
            }
            return response;
        }
    }

    private HttpRequestMessage BuildRequest(
        HttpMethod method,
        string path,
        object? body,
        IReadOnlyDictionary<string, object?>? query,
        IReadOnlyDictionary<string, string?>? headers,
        string encoding,
        string? accept,
        string? idempotencyKey)
    {
        string url = _baseUrl + path + BuildQueryString(query);
${urlBlock}        var request = new HttpRequestMessage(method, url);
        request.Headers.TryAddWithoutValidation("User-Agent", _userAgent);
${headerBlock}        if (accept != null)
        {
            request.Headers.TryAddWithoutValidation("Accept", accept);
        }
        if (idempotencyKey != null)
        {
            request.Headers.TryAddWithoutValidation(IdempotencyHeader, idempotencyKey);
        }
        if (headers != null)
        {
            foreach (KeyValuePair<string, string?> header in headers)
            {
                if (header.Value != null)
                {
                    request.Headers.TryAddWithoutValidation(header.Key, header.Value);
                }
            }
        }
        if (body != null)
        {
            request.Content = BuildContent(body, encoding);
        }
        return request;
    }

    private static HttpContent BuildContent(object body, string encoding)
    {
        switch (encoding)
        {
            case "multipart":
                return BuildMultipart((IReadOnlyDictionary<string, object?>)body);
            case "form":
                return BuildForm((IReadOnlyDictionary<string, object?>)body);
            default:
                string json = JsonSerializer.Serialize(body, JsonOptions);
                return new StringContent(json, Encoding.UTF8, "application/json");
        }
    }

    /// <summary>Encode a multipart/form-data body; byte[]/Stream values become file parts, lists repeat.</summary>
    private static HttpContent BuildMultipart(IReadOnlyDictionary<string, object?> fields)
    {
        var content = new MultipartFormDataContent();
        foreach (KeyValuePair<string, object?> entry in fields)
        {
            if (entry.Value != null)
            {
                AddMultipartField(content, entry.Key, entry.Value);
            }
        }
        return content;
    }

    private static void AddMultipartField(MultipartFormDataContent content, string name, object value)
    {
        switch (value)
        {
            case byte[] bytes:
            {
                var part = new ByteArrayContent(bytes);
                part.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
                content.Add(part, name, name);
                return;
            }
            case Stream stream:
            {
                var part = new StreamContent(stream);
                part.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
                content.Add(part, name, name);
                return;
            }
            case string text:
                content.Add(new StringContent(text), name);
                return;
            case IEnumerable enumerable:
                foreach (object? item in enumerable)
                {
                    if (item != null)
                    {
                        AddMultipartField(content, name, item);
                    }
                }
                return;
            default:
                content.Add(new StringContent(FormatValue(value)), name);
                return;
        }
    }

    /// <summary>Encode an application/x-www-form-urlencoded body; lists repeat the key.</summary>
    private static HttpContent BuildForm(IReadOnlyDictionary<string, object?> fields)
    {
        var pairs = new List<KeyValuePair<string, string>>();
        foreach (KeyValuePair<string, object?> entry in fields)
        {
            if (entry.Value == null)
            {
                continue;
            }
            if (entry.Value is string text)
            {
                pairs.Add(new KeyValuePair<string, string>(entry.Key, text));
            }
            else if (entry.Value is IEnumerable enumerable)
            {
                foreach (object? item in enumerable)
                {
                    if (item != null)
                    {
                        pairs.Add(new KeyValuePair<string, string>(entry.Key, FormatValue(item)));
                    }
                }
            }
            else
            {
                pairs.Add(new KeyValuePair<string, string>(entry.Key, FormatValue(entry.Value)));
            }
        }
        return new FormUrlEncodedContent(pairs);
    }

    /// <summary>Serialize an explode=false array query parameter as one comma-joined value.</summary>
    internal static string? JoinCsv(IEnumerable? values)
    {
        if (values == null)
        {
            return null;
        }
        var parts = new List<string>();
        foreach (object? item in values)
        {
            if (item != null)
            {
                parts.Add(FormatValue(item));
            }
        }
        return string.Join(",", parts);
    }

    /// <summary>JSON-encode a non-exploded object/map query parameter to a single value.</summary>
    internal static string? JsonQuery(object? value)
    {
        return value == null ? null : JsonSerializer.Serialize(value, JsonOptions);
    }

    private static string BuildQueryString(IReadOnlyDictionary<string, object?>? query)
    {
        if (query == null)
        {
            return string.Empty;
        }
        var parts = new List<string>();
        foreach (KeyValuePair<string, object?> entry in query)
        {
            if (entry.Value == null)
            {
                continue;
            }
            if (entry.Value is string text)
            {
                parts.Add(Uri.EscapeDataString(entry.Key) + "=" + Uri.EscapeDataString(text));
            }
            else if (entry.Value is IEnumerable enumerable)
            {
                foreach (object? item in enumerable)
                {
                    if (item != null)
                    {
                        parts.Add(Uri.EscapeDataString(entry.Key) + "=" + Uri.EscapeDataString(FormatValue(item)));
                    }
                }
            }
            else
            {
                parts.Add(Uri.EscapeDataString(entry.Key) + "=" + Uri.EscapeDataString(FormatValue(entry.Value)));
            }
        }
        return parts.Count == 0 ? string.Empty : "?" + string.Join("&", parts);
    }

    private static string FormatValue(object value)
    {
        return value switch
        {
            bool b => b ? "true" : "false",
            IFormattable formattable => formattable.ToString(null, CultureInfo.InvariantCulture),
            _ => value.ToString() ?? string.Empty,
        };
    }

    private static bool IsConnectionError(Exception ex)
    {
        return ex is HttpRequestException || ex is OperationCanceledException || ex is IOException;
    }

    private static TimeSpan RetryDelay(int attempt, HttpResponseHeaders? headers)
    {
        if (HonorRetryAfterHeader && headers?.RetryAfter != null)
        {
            RetryConditionHeaderValue retryAfter = headers.RetryAfter;
            if (retryAfter.Delta.HasValue)
            {
                return retryAfter.Delta.Value;
            }
            if (retryAfter.Date.HasValue)
            {
                TimeSpan wait = retryAfter.Date.Value - DateTimeOffset.UtcNow;
                return wait > TimeSpan.Zero ? wait : TimeSpan.Zero;
            }
        }
        double delayMs = Math.Min(BackoffInitialMs * Math.Pow(BackoffMultiplier, attempt), BackoffMaxMs);
        delayMs += delayMs * BackoffJitter * Random.Shared.NextDouble();
        return TimeSpan.FromMilliseconds(delayMs);
    }

    private static string BuildUserAgent()
    {
        string ua = UserAgentIdentifier;
${runtimeVersionLine}        foreach (KeyValuePair<string, string> entry in AiAgentEnvVars)
        {
            if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable(entry.Key)))
            {
                ua += " agent/" + entry.Value;
                break;
            }
        }
        return ua;
    }

    private static TimeSpan DefaultTimeout()
    {
${timeoutBody}
    }

    private static ApiException BuildError(HttpResponseMessage response, string body)
    {
        int status = (int)response.StatusCode;
        string? requestId = HeaderValue(response, RequestIdHeader);
        string message = ErrorMessage(body) ?? ("HTTP " + status.ToString(CultureInfo.InvariantCulture));
${errorDispatch(behavior)}
    }

    private static string? ErrorMessage(string body)
    {
        if (string.IsNullOrEmpty(body))
        {
            return null;
        }
        try
        {
            using JsonDocument document = JsonDocument.Parse(body);
            JsonElement root = document.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
            {
                return null;
            }
            if (root.TryGetProperty("error", out JsonElement error))
            {
                if (error.ValueKind == JsonValueKind.Object &&
                    error.TryGetProperty("message", out JsonElement nested) &&
                    nested.ValueKind == JsonValueKind.String)
                {
                    return nested.GetString();
                }
                if (error.ValueKind == JsonValueKind.String)
                {
                    return error.GetString();
                }
            }
            foreach (string key in new[] { "message", "detail" })
            {
                if (root.TryGetProperty(key, out JsonElement value) && value.ValueKind == JsonValueKind.String)
                {
                    return value.GetString();
                }
            }
        }
        catch (JsonException)
        {
            return null;
        }
        return null;
    }

    private static string? HeaderValue(HttpResponseMessage response, string name)
    {
        if (response.Headers.TryGetValues(name, out IEnumerable<string>? values))
        {
            foreach (string value in values)
            {
                return value;
            }
        }
        return null;
    }
}
`;
}
