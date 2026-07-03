import { describe, expect, it } from 'vitest';

import { defaultSdkBehavior, mergeSdkBehavior, sdkBehavior } from '../src';
import type { OpensdkSpecJson } from '../src';

describe('sdk behavior defaults + merge', () => {
  it('defaultSdkBehavior returns the canonical, fully-populated contract', () => {
    const d = defaultSdkBehavior();
    expect(d.retry.maxRetries).toBe(2);
    expect(d.retry.retryableStatusCodes).toEqual([408, 429, 500, 502, 503, 504]);
    expect(d.retry.honorRetryAfterHeader).toBe(true);
    expect(d.retry.backoff).toEqual({ initialDelayMs: 500, maxDelayMs: 8000, multiplier: 2, jitter: 0.25 });
    expect(d.timeout.defaultTimeoutMs).toBe(60000);
    expect(d.errors.statusCodeMap['404']).toBe('NotFound');
    expect(d.errors.serverErrorKind).toBe('Internal');
    expect(d.userAgent.sdkIdentifierTemplate).toBe('{package}-{language}/{version}');
    expect(d.userAgent.aiAgentEnvVars.CLAUDE_CODE).toBe('claude-code');
    expect(d.telemetry.requestIdHeader).toBe('X-Request-ID');
    expect(d.logging.events).toHaveLength(6);
    expect(d.idempotency).toEqual({ headerName: 'Idempotency-Key', autoGenerateForPost: true });
    expect(d.pagination.autoPageDelayMs).toBe(0);
    expect(d.requestGuard.optionKeys).toContain('api_key');
  });

  it('returns a fresh object every call (no shared mutable state)', () => {
    const a = defaultSdkBehavior();
    a.retry.maxRetries = 99;
    a.retry.retryableStatusCodes.push(418);
    expect(defaultSdkBehavior().retry.maxRetries).toBe(2);
    expect(defaultSdkBehavior().retry.retryableStatusCodes).toHaveLength(6);
  });

  it('merges nested overrides recursively, keeping sibling defaults', () => {
    const merged = mergeSdkBehavior({ retry: { maxRetries: 7, backoff: { initialDelayMs: 100 } } });
    expect(merged.retry.maxRetries).toBe(7);
    expect(merged.retry.backoff.initialDelayMs).toBe(100);
    // untouched siblings keep their defaults
    expect(merged.retry.backoff.maxDelayMs).toBe(8000);
    expect(merged.retry.honorRetryAfterHeader).toBe(true);
    expect(merged.timeout.defaultTimeoutMs).toBe(60000);
  });

  it('arrays replace entirely, never concat', () => {
    const merged = mergeSdkBehavior({ retry: { retryableStatusCodes: [429] } });
    expect(merged.retry.retryableStatusCodes).toEqual([429]);
    const guard = mergeSdkBehavior({ requestGuard: { optionKeys: ['secret'] } });
    expect(guard.requestGuard.optionKeys).toEqual(['secret']);
  });

  it('undefined override values are ignored (the default wins)', () => {
    const merged = mergeSdkBehavior({ timeout: { defaultTimeoutMs: undefined }, retry: undefined });
    expect(merged.timeout.defaultTimeoutMs).toBe(60000);
    expect(merged.retry.maxRetries).toBe(2);
  });

  it('sdkBehavior(spec) merges spec.sdk over the defaults and never null-checks', () => {
    const spec: OpensdkSpecJson = {
      opensdk: '1.0.0',
      info: { title: 't', version: '1' },
      sdk: { timeout: { defaultTimeoutMs: 12345 } },
    };
    expect(sdkBehavior(spec).timeout.defaultTimeoutMs).toBe(12345);
    expect(sdkBehavior(spec).retry.maxRetries).toBe(2);
    // no sdk block at all -> pure defaults
    expect(sdkBehavior({ opensdk: '1.0.0', info: { title: 't', version: '1' } }).timeout.defaultTimeoutMs).toBe(60000);
  });
});
