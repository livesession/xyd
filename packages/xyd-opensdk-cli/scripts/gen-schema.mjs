#!/usr/bin/env node
// Generate sdk.schema.json (editor validation for sdk.json) by lifting the
// SdkBehavior sub-schemas from @xyd-js/opensdk-core's opensdk-spec.json — the
// single source of truth for the behavior shape. Run: pnpm gen:schema.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const corePath = resolve(here, '../../xyd-opensdk-core/opensdk-spec.json');
const outPath = resolve(here, '../sdk.schema.json');

const core = JSON.parse(readFileSync(corePath, 'utf8'));
const BEHAVIOR_DEFS = [
  'SdkBehavior',
  'RetryPolicy',
  'BackoffStrategy',
  'TimeoutPolicy',
  'ErrorPolicy',
  'UserAgentPolicy',
  'TelemetryPolicy',
  'LoggingPolicy',
  'IdempotencyPolicy',
  'PaginationPolicy',
  'RequestGuardPolicy',
];

const $defs = {};
for (const name of BEHAVIOR_DEFS) {
  if (!core.$defs?.[name]) throw new Error(`opensdk-spec.json is missing $defs.${name}`);
  $defs[name] = core.$defs[name];
}

// Per-language emitter options — mirror each emitter's Opensdk<Lang>Options
// (packages/xyd-opensdk-<lang>/src/types.ts). Keep in sync when an option is
// added there. Every section also gets the shared `output`/`behavior`/`baseURL`/
// `tests` fields below.
const str = (description) => ({ type: 'string', description });
const LANG_OPTIONS = {
  // packages/xyd-opensdk-go/src/types.ts
  go: {
    aliases: ['go', 'golang'],
    options: {
      modulePath: str('Go module path (default: github.com/example/<packageName>).'),
      packageName: str('Go package name for the SDK root (default: from info.title).'),
      goVersion: str('`go` directive in go.mod (default: "1.22").'),
    },
  },
  // packages/xyd-opensdk-python/src/types.ts
  python: {
    aliases: ['python', 'py'],
    options: { packageName: str('The Python package name (default: snake_case of info.title).') },
  },
  // packages/xyd-opensdk-node/src/types.ts (canonical id: node; alias: typescript)
  node: {
    aliases: ['typescript', 'ts', 'javascript', 'js', 'node'],
    options: {
      packageName: str('npm package name (default: kebab-case of info.title).'),
      envVar: str('Env var the client reads the credential from (default: the scheme envVar / <PKG>_API_KEY).'),
    },
  },
  // packages/xyd-opensdk-ruby/src/types.ts
  ruby: {
    aliases: ['ruby', 'rb'],
    options: {
      packageName: str('The Ruby gem / package name (default: snake_case of info.title).'),
      moduleName: str('The top-level Ruby module/namespace (default: PascalCase of info.title).'),
    },
  },
  // packages/xyd-opensdk-java/src/types.ts
  java: {
    aliases: ['java'],
    options: {
      packageName: str('The leaf Java package segment (default: from info.title).'),
      basePackage: str('The Java package prefix the SDK nests under (default: "com.example").'),
    },
  },
  // packages/xyd-opensdk-dotnet/src/types.ts
  dotnet: {
    aliases: ['csharp', 'cs', 'c#', 'dotnet', '.net'],
    options: {
      sdkName: str('The SDK name — drives the .csproj filename and the <Sdk>Client class (default: PascalCase of info.title).'),
      namespace: str('Root namespace for every emitted type (default: Example.<Sdk>).'),
      targetFramework: str('The .csproj target framework moniker (default: "net8.0").'),
    },
  },
};

// Shared fields on every language section (from the emitters' common options).
const sharedSectionProps = {
  output: str("Output directory for this language's generated SDK."),
  behavior: { $ref: '#/$defs/SdkBehavior', description: 'Per-language behavior, deep-merged over the global `behavior`.' },
  baseURL: str('Default API base URL baked into the runtime (default: the first `servers` entry).'),
  tests: { type: 'boolean', description: "Emit the SDK's own test suite (default: true)." },
};

const patternProperties = {};
for (const [lang, { aliases, options }] of Object.entries(LANG_OPTIONS)) {
  const defName = `${lang[0].toUpperCase()}${lang.slice(1)}Section`;
  $defs[defName] = {
    type: 'object',
    description: `Options for the ${lang} SDK target.`,
    properties: { ...sharedSectionProps, ...options },
    additionalProperties: false,
  };
  const pattern = `^(${aliases.map((a) => a.replace(/[.^$*+?()[\]{}|\\]/g, '\\$&')).join('|')})$`;
  patternProperties[pattern] = { $ref: `#/$defs/${defName}` };
}

const schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://unpkg.com/@xyd-js/opensdk-cli/sdk.schema.json',
  title: 'OpenSDK sdk.json',
  description: 'Declarative configuration for generating SDKs with the OpenSDK CLI.',
  type: 'object',
  required: ['version'],
  properties: {
    $schema: { type: 'string' },
    version: { description: 'Config schema version.', anyOf: [{ type: 'number' }, { type: 'string' }] },
    sdkName: { type: 'string', description: 'Default SDK name passed to the converter.' },
    behavior: { $ref: '#/$defs/SdkBehavior', description: 'Global runtime behavior (deep-merged over the canonical defaults).' },
    grouping: {
      type: 'object',
      description: 'Spec-external resource grouping (Stainless-style beta/admin namespacing).',
      properties: {
        mountRules: { type: 'object', additionalProperties: { type: 'string' } },
        operationHints: { type: 'object', additionalProperties: true },
      },
      additionalProperties: false,
    },
  },
  patternProperties,
  additionalProperties: true,
  $defs,
};

writeFileSync(outPath, `${JSON.stringify(schema, null, 2)}\n`);
console.log(
  `Wrote ${outPath} (${BEHAVIOR_DEFS.length} behavior defs + ${Object.keys(LANG_OPTIONS).length} language sections)`,
);
