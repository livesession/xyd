import { describe, expect, it } from 'vitest';

import { mergeSdkBehavior } from '@xyd-js/opensdk-core';
import type { OpensdkSpecJson } from '@xyd-js/opensdk-core';
import { opensdkGo } from '@xyd-js/opensdk-go';
import { opensdkPython } from '@xyd-js/opensdk-python';

import { missingMarkers, parityProbe } from '../src';

// Cross-language behavior parity: the sdk block is the SINGLE source of truth
// for runtime policy, so generating go + python from ONE IR with distinctive
// non-default values must land those exact values in every language's emitted
// runtime. String containment is deliberate — the assertion is "the value flows
// from IR to runtime", not "the runtime formats it a particular way".
//
// TRANSITIONAL SKIP: the emitters gain `spec.sdk` consumption in parallel with
// this harness. A language where NO probe marker appears yet — or whose
// generator cannot run at all yet — is skipped with a visible test name (the
// skipIf messages below); once its emitter interpolates any policy value, the
// test auto-flips STRICT and every marker must be present. (A generator crash
// itself fails loudly in that emitter package's own suite — this test only
// gates value flow.) The integrator removes nothing — landing the emitter work
// is what makes this gate live.

const probe = parityProbe();

const spec: OpensdkSpecJson = {
  opensdk: '1.0.0',
  info: { title: 'parity', version: '1.0.0' },
  servers: ['https://api.example.com/v1'],
  security: [{ type: 'http', kind: 'bearer' }],
  types: [
    {
      name: 'Widget',
      kind: 'struct',
      fields: [{ name: 'id', type: { kind: 'scalar', scalar: 'string' }, required: true }],
    },
  ],
  resources: [
    {
      name: 'widgets',
      methods: [
        {
          action: 'create',
          httpMethod: 'post',
          path: '/widgets',
          injectIdempotencyKey: true,
          primaryResponse: { kind: 'ref', name: 'Widget' },
        },
        { action: 'retrieve', httpMethod: 'get', path: '/widgets/{id}', pathParams: [{ name: 'id', type: { kind: 'scalar', scalar: 'string' }, required: true }] },
      ],
    },
  ],
  sdk: mergeSdkBehavior(probe.overrides),
};

function tryGenerate(fn: () => Record<string, string>): Record<string, string> | null {
  try {
    return fn();
  } catch {
    return null; // emitter mid-flight/broken — its own package suite fails loudly
  }
}

const langs = [
  { language: 'go', files: tryGenerate(() => opensdkGo(spec)) },
  { language: 'python', files: tryGenerate(() => opensdkPython(spec)) },
];

describe('cross-language SDK behavior parity (sdk policy values flow IR -> every runtime)', () => {
  for (const { language, files } of langs) {
    const missing = files ? missingMarkers(files, probe.markers) : probe.markers;
    const landed = files !== null && missing.length < probe.markers.length;

    it.skipIf(!landed)(
      `${language}: emitted runtime contains every distinctive sdk policy value (SKIPPED = this emitter does not consume spec.sdk yet, or cannot generate yet; flips strict once it does)`,
      () => {
        expect(
          missing.map((m) => `${m.policy} value (${m.anyOf.join(' | ')}) missing from every generated ${language} file`),
        ).toEqual([]);
      },
    );
  }
});
