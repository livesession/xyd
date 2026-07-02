import { describe, expect, it } from 'vitest';

import { opensdkPython } from '../index';
import { PY_SMOKE, pyBehaviorSmoke, pyCompileSmoke, readIR, testFixture } from './utils';

const fixtures = [
  { name: '1.basic', description: 'client, resources, methods, dataclasses/enums, dep-free transport' },
  {
    name: '2.wire',
    description:
      'wire correctness: multipart/form bodies, header params, wireName + explode query arrays, cursor pagination, binary download, idempotency-key injection',
  },
];

describe('opensdk-python', () => {
  for (const f of fixtures) {
    it(f.description, () => {
      testFixture(f.name);
    });
  }

  if (PY_SMOKE) {
    for (const f of fixtures) {
      it(`py_compile: ${f.name}`, () => {
        pyCompileSmoke(f.name);
      });
    }

    it('runtime behavior probe (retry-after, backoff, error kinds, guard, UA)', () => {
      pyBehaviorSmoke();
    });
  }
});

// The runtime is policy-driven: every behavior constant in _transport.py is
// interpolated from the IR's `sdk` block (opensdk-core's sdkBehavior(spec)),
// so the canonical defaults — and any override — are assertable as text.
describe('opensdk-python sdk behavior', () => {
  it('interpolates the canonical defaults into _transport.py', () => {
    const transport = opensdkPython(readIR('1.basic'))['petstore/_transport.py'];

    // retry policy
    expect(transport).toContain('MAX_RETRIES = 2');
    expect(transport).toContain('RETRYABLE_STATUS_CODES = frozenset({408, 429, 500, 502, 503, 504})');
    expect(transport).toContain('RETRY_CONNECTION_ERRORS = True');
    expect(transport).toContain('HONOR_RETRY_AFTER_HEADER = True');
    expect(transport).toContain('BACKOFF_INITIAL_DELAY = 0.5');
    expect(transport).toContain('BACKOFF_MAX_DELAY = 8.0');
    expect(transport).toContain('BACKOFF_MULTIPLIER = 2.0');
    expect(transport).toContain('BACKOFF_JITTER = 0.25');
    // timeout policy (60000ms -> urlopen seconds), no env override by default
    expect(transport).toContain('DEFAULT_TIMEOUT: Optional[float] = 60.0');
    expect(transport).toContain('urllib.request.urlopen(request, timeout=self.timeout)');
    expect(transport).not.toContain('TIMEOUT_ENV_VAR');
    // user-agent policy ({package}-{language}/{version} + AI-agent sniff; no runtime version by default)
    expect(transport).toContain('USER_AGENT = "petstore-python/1.2.0"');
    expect(transport).toContain('"CLAUDE_CODE": "claude-code"');
    expect(transport).toContain('"COPILOT_AGENT": "copilot"');
    expect(transport).not.toContain('import platform');
    // error policy: per-kind exception classes + dispatch + request id; no doc URL by default
    expect(transport).toContain('class BadRequestError(APIError):');
    expect(transport).toContain('class NotFoundError(APIError):');
    expect(transport).toContain('class RateLimitedError(APIError):');
    expect(transport).toContain('class InternalError(APIError):');
    expect(transport).toContain('404: NotFoundError,');
    expect(transport).toContain('REQUEST_ID_HEADER = "X-Request-ID"');
    expect(transport).not.toContain('ERROR_DOC_URL_TEMPLATE');
    // idempotency + request guard policies
    expect(transport).toContain('IDEMPOTENCY_HEADER = "Idempotency-Key"');
    expect(transport).toContain(
      'GUARDED_OPTION_KEYS = frozenset({"api_key", "apiKey", "idempotency_key", "idempotencyKey", "extra_headers", "extraHeaders", "max_retries", "maxRetries", "base_url", "baseUrl", "timeout"})',
    );
  });

  it('interpolates sdk overrides (retry/timeout/errors/userAgent) into _transport.py', () => {
    const ir = readIR('1.basic');
    ir.sdk = {
      retry: {
        maxRetries: 5,
        retryableStatusCodes: [429],
        backoff: { initialDelayMs: 250, maxDelayMs: 2000, multiplier: 3, jitter: 0.5 },
      },
      timeout: { defaultTimeoutMs: 5000, timeoutEnvVar: 'PETSTORE_TIMEOUT_MS' },
      errors: { errorDocUrlTemplate: 'https://docs.petstore.io/errors/{kind}' },
      userAgent: { includeRuntimeVersion: true },
    };
    const transport = opensdkPython(ir)['petstore/_transport.py'];

    expect(transport).toContain('MAX_RETRIES = 5');
    expect(transport).toContain('RETRYABLE_STATUS_CODES = frozenset({429})');
    expect(transport).toContain('BACKOFF_INITIAL_DELAY = 0.25');
    expect(transport).toContain('BACKOFF_MAX_DELAY = 2.0');
    expect(transport).toContain('BACKOFF_MULTIPLIER = 3.0');
    expect(transport).toContain('BACKOFF_JITTER = 0.5');
    expect(transport).toContain('DEFAULT_TIMEOUT: Optional[float] = 5.0');
    expect(transport).toContain('TIMEOUT_ENV_VAR = "PETSTORE_TIMEOUT_MS"');
    expect(transport).toContain('ERROR_DOC_URL_TEMPLATE = "https://docs.petstore.io/errors/{kind}"');
    expect(transport).toContain('def __str__(self) -> str:');
    expect(transport).toContain('import platform');
    expect(transport).toContain('ua += " python/" + platform.python_version()');
    // unmapped statusCodeMap keeps the canonical error classes
    expect(transport).toContain('class NotFoundError(APIError):');
  });

  it('passes idempotency=True only for injectIdempotencyKey-flagged methods', () => {
    const files = opensdkPython(readIR('2.wire'));
    const resources = files['wire_service/resources.py'];
    // 2.wire flags exactly one method (tokens.create).
    expect(resources.match(/idempotency=True/g)).toHaveLength(1);
    expect(resources).toContain('"POST", "/token"');
    // The transport generates ONE uuid4 key per logical call, before the retry loop.
    expect(files['wire_service/_transport.py']).toContain(
      'request_headers.setdefault(IDEMPOTENCY_HEADER, str(uuid.uuid4()))',
    );
  });

  it('prepends the ownership header to every generated .py file (and never to pyproject.toml)', () => {
    const files = opensdkPython(readIR('1.basic'));
    for (const [rel, content] of Object.entries(files)) {
      if (rel.endsWith('.py')) {
        expect(content.startsWith('# Code generated by opensdk. DO NOT EDIT.\n\n'), rel).toBe(true);
      }
    }
    expect(files['pyproject.toml']).not.toContain('DO NOT EDIT');
  });

  it('exports the error-kind classes from the package __init__', () => {
    const init = opensdkPython(readIR('1.basic'))['petstore/__init__.py'];
    expect(init).toContain(
      'from ._transport import APIError, BadRequestError, ConflictError, InternalError, NotFoundError, PermissionDeniedError, RateLimitedError, UnauthorizedError, UnprocessableEntityError',
    );
    expect(init).toContain('"Client"');
  });
});
