import { type OpensdkSpecJson, type ResolvedSdkBehavior, sdkBehavior } from '@xyd-js/opensdk-core';

// The generated Ruby runtime (`lib/<pkg>/transport.rb`), mirroring the Go and
// Python emitters at their minimum bar: a stdlib-only transport (net/http) with
// a structured error hierarchy, wire-correct json/form/multipart encoding, best
// -effort JSON decode, and a generic Page container. Every behavior constant is
// interpolated from the IR's `sdk` block via opensdk-core's `sdkBehavior(spec)`
// so the three runtimes encode the same declared policy instead of drifting.
// Retry/backoff/idempotency are wired but modest — full fidelity is phase 2.

function rbBool(value: boolean): string {
  return value ? 'true' : 'false';
}

/** A Ruby float literal: integers render as `60.0` so seconds read as seconds. */
function rbFloat(value: number): string {
  return Number.isInteger(value) ? `${value}.0` : String(value);
}

function rbStr(value: string): string {
  return JSON.stringify(value);
}

/** The Ruby exception class name for a policy error kind (`API` is the base). */
function errorClassName(kind: string): string {
  if (kind === 'API') return 'APIError';
  return kind.endsWith('Error') ? kind : `${kind}Error`;
}

/** The generated APIError subclass names (sorted), for reference/tests. */
export function errorClassNames(spec: OpensdkSpecJson): string[] {
  const behavior = sdkBehavior(spec);
  const names = new Set<string>();
  for (const kind of Object.values(behavior.errors.statusCodeMap)) names.add(errorClassName(kind));
  names.add(errorClassName(behavior.errors.serverErrorKind));
  names.add(errorClassName(behavior.errors.clientErrorKind));
  names.delete('APIError');
  return [...names].sort();
}

/** The auth statement applied to a request, from the first security scheme. */
function authBlock(spec: OpensdkSpecJson): string {
  const scheme = spec.security?.[0];
  if (!scheme) return '';
  const name = scheme.name || '';
  let stmt: string;
  switch (scheme.kind) {
    case 'apiKey-header':
      stmt = `request_headers[${rbStr(name)}] = @api_key`;
      break;
    case 'apiKey-query':
      stmt = `query = (query || {}).merge(${rbStr(name)} => @api_key)`;
      break;
    case 'apiKey-cookie':
      stmt = `request_headers["Cookie"] = ${rbStr(`${name}=`)} + @api_key`;
      break;
    default:
      stmt = `request_headers["Authorization"] = "Bearer #{@api_key}"`;
  }
  return `      if @api_key && !@api_key.to_s.empty?\n        ${stmt}\n      end\n`;
}

/** The per-kind exception classes + the status -> class dispatch table. */
function errorClassesBlock(behavior: ResolvedSdkBehavior): string {
  const mapped = Object.entries(behavior.errors.statusCodeMap)
    .map(([status, kind]) => [Number(status), kind] as [number, string])
    .filter(([status]) => Number.isFinite(status))
    .sort((a, b) => a[0] - b[0]);

  // class -> its kind + the statuses it maps (several statuses may share a kind).
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
  if (serverClass !== 'APIError' && !byClass.has(serverClass)) byClass.set(serverClass, { kind: behavior.errors.serverErrorKind, statuses: [] });
  if (clientClass !== 'APIError' && !byClass.has(clientClass)) byClass.set(clientClass, { kind: behavior.errors.clientErrorKind, statuses: [] });

  const classDecls = [...byClass.entries()].map(
    ([cls, { kind }]) =>
      `  class ${cls} < APIError\n` +
      `    def self.kind\n` +
      `      ${rbStr(kind)}\n` +
      `    end\n` +
      `  end`,
  );

  const tableEntries = mapped.map(([status, kind]) => `    ${status} => ${errorClassName(kind)},`);
  const table = tableEntries.length
    ? `  STATUS_TO_ERROR = {\n${tableEntries.join('\n')}\n  }.freeze`
    : `  STATUS_TO_ERROR = {}.freeze`;

  const dispatch =
    `  # The policy-mapped exception: exact status map first, then the 5xx\n` +
    `  # catch-all, then the client catch-all.\n` +
    `  def self.error_for_status(status_code, headers, body)\n` +
    `    klass = STATUS_TO_ERROR[status_code]\n` +
    `    klass = (status_code >= 500 ? ${serverClass} : ${clientClass}) if klass.nil?\n` +
    `    klass.new(status_code: status_code, headers: headers, body: body, message: APIError.error_message(body))\n` +
    `  end`;

  return `${[...classDecls, table, dispatch].join('\n\n')}`;
}

export function renderTransportFile(spec: OpensdkSpecJson, moduleName: string, pkg: string, baseURL: string): string {
  const behavior = sdkBehavior(spec);
  const { retry, timeout, userAgent, telemetry, idempotency } = behavior;

  const userAgentStr = userAgent.sdkIdentifierTemplate
    .split('{package}')
    .join(pkg)
    .split('{language}')
    .join('ruby')
    .split('{version}')
    .join(spec.info.version || '0.0.0');

  const aiAgents = Object.entries(userAgent.aiAgentEnvVars)
    .map(([env, slug]) => `${rbStr(env)} => ${rbStr(slug)}`)
    .join(', ');

  const timeoutSeconds = timeout.defaultTimeoutMs > 0 ? rbFloat(timeout.defaultTimeoutMs / 1000) : null;
  const timeoutInit = timeoutSeconds ? `timeout.nil? ? ${timeoutSeconds} : timeout` : 'timeout';
  const runtimeVersion = userAgent.includeRuntimeVersion ? '\n      ua = ua + " ruby/" + RUBY_VERSION' : '';

  const constants = [
    `  DEFAULT_BASE_URL = ${rbStr(baseURL)}`,
    `  USER_AGENT = ${rbStr(userAgentStr)}`,
    `  AI_AGENT_ENV_VARS = { ${aiAgents} }.freeze`,
    `  MAX_RETRIES = ${retry.maxRetries}`,
    `  RETRYABLE_STATUS_CODES = [${retry.retryableStatusCodes.join(', ')}].freeze`,
    `  RETRY_CONNECTION_ERRORS = ${rbBool(retry.retryConnectionErrors)}`,
    `  HONOR_RETRY_AFTER_HEADER = ${rbBool(retry.honorRetryAfterHeader)}`,
    `  BACKOFF_INITIAL_DELAY = ${rbFloat(retry.backoff.initialDelayMs / 1000)}`,
    `  BACKOFF_MAX_DELAY = ${rbFloat(retry.backoff.maxDelayMs / 1000)}`,
    `  BACKOFF_MULTIPLIER = ${rbFloat(retry.backoff.multiplier)}`,
    `  BACKOFF_JITTER = ${rbFloat(retry.backoff.jitter)}`,
    `  REQUEST_ID_HEADER = ${rbStr(telemetry.requestIdHeader)}`,
    `  IDEMPOTENCY_HEADER = ${rbStr(idempotency.headerName)}`,
  ].join('\n');

  return `require "json"
require "net/http"
require "securerandom"
require "time"
require "uri"

module ${moduleName}
${constants}

  # A non-2xx API response: status code, headers, raw body, request id and a
  # best-effort message. Mapped statuses arrive as a concrete subclass.
  class APIError < StandardError
    attr_reader :status_code, :headers, :body, :request_id

    def initialize(status_code:, headers:, body:, message: nil)
      @status_code = status_code
      @headers = headers || {}
      @body = body
      @request_id = APIError.header_value(@headers, REQUEST_ID_HEADER)
      super(message.nil? ? "HTTP #{status_code}" : message)
    end

    def kind
      self.class.kind
    end

    def self.kind
      "API"
    end

    # Case-insensitive header lookup over a plain Hash.
    def self.header_value(headers, name)
      target = name.to_s.downcase
      (headers || {}).each do |key, value|
        return value if key.to_s.downcase == target
      end
      nil
    end

    # Best-effort message from a JSON error envelope ({"error": {"message": ...}} etc.).
    def self.error_message(body)
      return nil if body.nil? || body.to_s.empty?
      begin
        parsed = JSON.parse(body)
      rescue StandardError
        return nil
      end
      return nil unless parsed.is_a?(Hash)
      error = parsed["error"]
      return error["message"] if error.is_a?(Hash) && error["message"].is_a?(String)
      return error if error.is_a?(String)
      ["message", "detail"].each do |key|
        value = parsed[key]
        return value if value.is_a?(String)
      end
      nil
    end
  end

${errorClassesBlock(behavior)}

  # One page of a list response: the items plus a coarse \`has_more\` marker.
  # Enumerable, so callers can iterate the page directly.
  class Page
    include Enumerable

    attr_reader :data, :has_more

    def initialize(data:, has_more: false)
      @data = data || []
      @has_more = has_more ? true : false
    end

    def each(&block)
      @data.each(&block)
    end
  end

  # Wire-encode a request value: Structs -> hashes keyed by member name (nil
  # members dropped); arrays/hashes recurse; everything else passes through.
  def self.encode(value)
    if value.is_a?(Struct)
      result = {}
      value.each_pair do |key, item|
        result[key.to_s] = encode(item) unless item.nil?
      end
      return result
    end
    return value.map { |item| encode(item) } if value.is_a?(Array)
    if value.is_a?(Hash)
      result = {}
      value.each { |key, item| result[key] = encode(item) }
      return result
    end
    value
  end

  # Serialize an \`explode: false\` array query parameter as one comma-joined
  # value (style=form, explode=false). nil passes through so the transport drops
  # an omitted optional parameter.
  def self.join_csv(value)
    return nil if value.nil?
    Array(value).map { |item| encode(item) }.map { |item| item == true ? "true" : (item == false ? "false" : item.to_s) }.join(",")
  end

  # Encode a multipart/form-data body (stdlib-only, manual boundary). bytes /
  # file-like values become file parts; lists become repeated parts.
  def self.multipart_body(payload)
    boundary = SecureRandom.hex(16)
    parts = []
    payload.each do |name, value|
      items = value.is_a?(Array) ? value : [value]
      items.each do |item|
        parts << "--#{boundary}\\r\\n"
        if item.respond_to?(:read)
          filename = File.basename(item.respond_to?(:path) ? item.path : name.to_s)
          parts << "Content-Disposition: form-data; name=\\"#{name}\\"; filename=\\"#{filename}\\"\\r\\n"
          parts << "Content-Type: application/octet-stream\\r\\n\\r\\n"
          parts << item.read
        else
          parts << "Content-Disposition: form-data; name=\\"#{name}\\"\\r\\n\\r\\n"
          parts << item.to_s
        end
        parts << "\\r\\n"
      end
    end
    parts << "--#{boundary}--\\r\\n"
    [parts.join, "multipart/form-data; boundary=#{boundary}"]
  end

  # The stdlib-only HTTP transport: auth, encoding, a modest retry loop and
  # typed error mapping. Constructed once and shared by every resource.
  class Transport
    HTTP_METHODS = {
      get: Net::HTTP::Get,
      post: Net::HTTP::Post,
      put: Net::HTTP::Put,
      patch: Net::HTTP::Patch,
      delete: Net::HTTP::Delete,
      head: Net::HTTP::Head,
      options: Net::HTTP::Options
    }.freeze

    def initialize(api_key: nil, base_url: nil, timeout: nil)
      @api_key = api_key
      @base_url = (base_url || DEFAULT_BASE_URL).sub(%r{/+\\z}, "")
      @timeout = ${timeoutInit}
      @user_agent = build_user_agent
    end

    def request(method:, path:, query: nil, body: nil, headers: nil, encoding: "json", raw: false, idempotency: false)
      url = @base_url + path
      request_headers = { "User-Agent" => @user_agent }
      (headers || {}).each do |key, value|
        request_headers[key] = stringify(value) unless value.nil?
      end

      data = nil
      unless body.nil?
        payload = {}
        body.each do |key, value|
          payload[key] = ${moduleName}.encode(value) unless value.nil?
        end
        if encoding == "multipart"
          data, content_type = ${moduleName}.multipart_body(payload)
          request_headers["Content-Type"] = content_type
        elsif encoding == "form"
          data = URI.encode_www_form(payload)
          request_headers["Content-Type"] = "application/x-www-form-urlencoded"
        else
          data = JSON.generate(payload)
          request_headers["Content-Type"] = "application/json"
        end
      end

${authBlock(spec)}
      if idempotency
        request_headers[IDEMPOTENCY_HEADER] ||= SecureRandom.uuid
      end

      unless query.nil?
        pairs = []
        query.each do |key, value|
          next if value.nil?
          encoded = ${moduleName}.encode(value)
          if encoded.is_a?(Array)
            encoded.each { |item| pairs << [key, stringify(item)] }
          else
            pairs << [key, stringify(encoded)]
          end
        end
        url = url + "?" + URI.encode_www_form(pairs) unless pairs.empty?
      end

      perform(method, url, request_headers, data, raw)
    end

    private

    def perform(method, url, headers, data, raw)
      uri = URI.parse(url)
      request_class = HTTP_METHODS[method]
      raise ArgumentError, "unsupported HTTP method: #{method}" if request_class.nil?

      attempt = 0
      loop do
        req = request_class.new(uri.request_uri)
        headers.each { |key, value| req[key] = value }
        req.body = data unless data.nil?

        begin
          response = http_client(uri).request(req)
        rescue SocketError, IOError, SystemCallError, Timeout::Error => error
          raise error unless RETRY_CONNECTION_ERRORS && attempt < MAX_RETRIES
          sleep(retry_delay(attempt, nil))
          attempt += 1
          next
        end

        status = response.code.to_i
        if status >= 400
          response_headers = {}
          response.each_header { |key, value| response_headers[key] = value }
          if attempt < MAX_RETRIES && RETRYABLE_STATUS_CODES.include?(status)
            sleep(retry_delay(attempt, response_headers))
            attempt += 1
            next
          end
          raise ${moduleName}.error_for_status(status, response_headers, response.body)
        end

        return response.body if raw
        body = response.body
        return nil if body.nil? || body.empty?
        return JSON.parse(body, symbolize_names: true)
      end
    end

    def http_client(uri)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == "https"
      unless @timeout.nil?
        http.open_timeout = @timeout
        http.read_timeout = @timeout
      end
      http
    end

    def retry_delay(attempt, headers)
      if HONOR_RETRY_AFTER_HEADER && headers
        retry_after = retry_after_seconds(headers)
        return retry_after unless retry_after.nil?
      end
      delay = BACKOFF_INITIAL_DELAY * (BACKOFF_MULTIPLIER**attempt)
      delay = BACKOFF_MAX_DELAY if delay > BACKOFF_MAX_DELAY
      delay + (delay * BACKOFF_JITTER * rand)
    end

    def retry_after_seconds(headers)
      value = APIError.header_value(headers, "Retry-After")
      return nil if value.nil?
      value = value.strip
      return value.to_f if value =~ /\\A\\d+\\z/
      begin
        at = Time.httpdate(value)
      rescue ArgumentError
        return nil
      end
      diff = at - Time.now
      diff > 0 ? diff : 0.0
    end

    def build_user_agent
      ua = USER_AGENT.dup${runtimeVersion}
      AI_AGENT_ENV_VARS.each do |env_var, slug|
        if ENV[env_var] && !ENV[env_var].empty?
          ua = ua + " agent/" + slug
          break
        end
      end
      ua
    end

    def stringify(value)
      return "true" if value == true
      return "false" if value == false
      return JSON.generate(value) if value.is_a?(Hash) || value.is_a?(Array)
      value.to_s
    end
  end
end
`;
}
