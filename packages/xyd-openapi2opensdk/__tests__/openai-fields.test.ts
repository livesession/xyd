import fs from 'node:fs';
import path from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import type { NamedType, OpensdkSpecJson } from '@xyd-js/opensdk-core';

import { openapi2opensdkFromSource } from '../index';

// Field-level guard against the vendored OpenAI spec (offline, committed). The
// L0/L1 method-surface oracle can't see MISSING FIELDS inside a body struct —
// this caught nothing while allOf inheritance was silently dropped and the
// generated chat.completions.create params lacked temperature/top_p/user.

const SPEC = path.join(__dirname, '../oracle/openai-openapi.yaml');
// The vendored spec lives in the gitignored/encrypted oracle dir. Skip these
// guards when the plaintext is absent (CI without XYD_CONTENT_SECRET, fresh
// clones) instead of ENOENT-ing; they run in the decrypted opensdk pipeline.
const hasOracle = fs.existsSync(SPEC);

describe.skipIf(!hasOracle)('openai field-level guards', () => {
  let byName: Map<string, NamedType>;

  beforeAll(async () => {
    const ir: OpensdkSpecJson = await openapi2opensdkFromSource(SPEC, { sdkName: 'openai' });
    byName = new Map((ir.types || []).map((t) => [t.name, t]));
  }, 60000);

  const fieldNames = (type: string) => (byName.get(type)?.fields || []).map((f) => f.name);

  it('CreateChatCompletionRequest keeps its allOf-inherited base fields', () => {
    const fields = fieldNames('CreateChatCompletionRequest');
    for (const f of ['model', 'messages', 'temperature', 'top_p', 'user', 'metadata', 'service_tier', 'safety_identifier', 'prompt_cache_key']) {
      expect(fields, `missing ${f}`).toContain(f);
    }
  });

  it('CreateResponse keeps fields from BOTH allOf base components', () => {
    const fields = fieldNames('CreateResponse');
    for (const f of ['model', 'input', 'temperature', 'metadata', 'previous_response_id', 'tools']) {
      expect(fields, `missing ${f}`).toContain(f);
    }
  });

  it('allOf [$ref, nullable] wrappers stay refs instead of empty structs', () => {
    const create = byName.get('CreateChatCompletionRequest');
    const truncation = create?.fields?.find((f) => f.name === 'truncation' || f.name === 'tool_choice');
    expect(truncation, 'wrapper field present').toBeTruthy();
    expect(truncation?.type.kind, 'wrapper resolves to a reference type').toBe('ref');
  });
});
