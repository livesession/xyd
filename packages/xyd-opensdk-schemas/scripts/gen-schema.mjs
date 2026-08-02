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

const str = (description) => ({ type: 'string', description });

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

// PublishTarget (opensdk-core/src/config.ts) — package identity threaded onto
// spec.info + registry mechanics consumed by `opensdk publish`. Kept in sync
// with the PublishTarget interface.
$defs.PublishTarget = {
  type: 'object',
  description: 'How this SDK is published: package identity (merged onto spec.info) + registry mechanics.',
  properties: {
    author: str('Package author (spec.info.contact.name).'),
    license: str('SPDX license id (spec.info.license.identifier), e.g. "MIT".'),
    repository: str('Source repository URL (spec.info.repository).'),
    homepage: str('Project homepage URL (spec.info.homepage).'),
    version: str('Package version override (else spec.info.version).'),
    registry: str('Registry URL to publish to (npm registry, PyPI repository-url, NuGet source, ...).'),
    tokenEnv: str('Env var name holding the auth token (read at publish time; never stored).'),
    packageName: str("Registry package name override (else the emitter's derived name)."),
  },
  additionalProperties: false,
};

// Per-language emitter options — mirror each emitter's Opensdk<Lang>Options
// (packages/xyd-opensdk-<lang>/src/types.ts). Keep in sync when an option is
// added there. Every section also gets the shared `output`/`behavior`/`baseURL`/
// `tests` fields below.
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
  // packages/xyd-opensdk-rust/src/types.ts
  rust: {
    aliases: ['rust', 'rs'],
    options: {
      packageName: str('The Cargo package + lib crate name (snake_case; default: crate_name of info.title).'),
      moduleName: str('Alias kept for cross-emitter symmetry — same value as the crate/lib name.'),
      edition: str('Rust edition written to Cargo.toml (default: "2021").'),
    },
  },
};

// Shared fields on every language section (from the emitters' common options).
const sharedSectionProps = {
  output: str("Output directory for this language's generated SDK."),
  behavior: { $ref: '#/$defs/SdkBehavior', description: 'Per-language behavior, deep-merged over the global `behavior`.' },
  baseURL: str('Default API base URL baked into the runtime (default: the first `servers` entry).'),
  tests: { type: 'boolean', description: "Emit the SDK's own test suite (default: true)." },
  publish: { $ref: '#/$defs/PublishTarget', description: 'Per-language publish target, merged over the global `publish`.' },
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

// ── CLI OUTPUT targets — the OpenCLI pipeline (openapi2opencli → opencli2go /
// opencli2rust) surfaced as go-cli / rust-cli target ids. A section is one FLAT
// bag: converter keys (shared) + that backend's own keys; the CLI splits them by
// allowlist (packages/xyd-opensdk-cli/src/cli/cli-targets.ts — keep in sync). ──
const CLI_CONVERTER_PROPS = {
  cliName: str('The CLI name (root command; default: the sdkName / spec title).'),
  version: str('CLI version override (default: the spec info.version; a `publish.version` also flows in).'),
  grouping: {
    type: 'string',
    enum: ['path', 'tag', 'operationId'],
    description: 'How operations group into the command tree (default: path).',
  },
  bodyStrategy: {
    type: 'string',
    enum: ['flatten', 'json', 'hybrid'],
    description: 'Request-body flags: flatten top-level props, one JSON flag, or hybrid (default: flatten).',
  },
  includeMethods: { type: 'array', items: { type: 'string' }, description: 'Only these HTTP methods.' },
  includeHeaders: { type: 'boolean', description: 'Emit flags for header parameters (default: false).' },
  flagCase: { type: 'string', enum: ['kebab', 'camel'], description: 'Flag naming style (default: kebab).' },
  actionAliases: { type: 'boolean', description: 'Emit action-verb aliases (e.g. `get` for `retrieve`).' },
  verbMap: {
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'Override the derived action verbs (listCollection/getItem/createCollection/updateItem/deleteItem).',
  },
  customActionVerbs: { type: 'array', items: { type: 'string' }, description: 'Extra trailing-verb path segments treated as actions.' },
  includePaths: { type: 'array', items: { type: 'string' }, description: 'Only operations under these path prefixes.' },
  maxBodyDepth: { type: 'number', description: 'Flatten body properties up to this depth; deeper ones become JSON flags.' },
  authEnvVar: str('Env var the generated CLI reads credentials from (default: from the spec security scheme).'),
};
const CLI_LANG_OPTIONS = {
  // packages/xyd-opencli2go/src/types.ts
  'go-cli': {
    options: {
      modulePath: str('Go module path (default: example.com/<binName>).'),
      binName: str('Binary name (default: slug of the CLI name).'),
      goVersion: str('`go` directive in go.mod (default: "1.22").'),
      baseURL: str('Default API base URL baked into the runtime (overridable via <BIN>_BASE_URL).'),
    },
  },
  // packages/xyd-opencli2rust/src/types.ts
  'rust-cli': {
    options: {
      crateName: str('Cargo package name (default: crate_name of the CLI name).'),
      binName: str('Binary name (default: slug of the CLI name).'),
      edition: str('Rust edition in Cargo.toml (default: "2021").'),
      baseURL: str('Default API base URL baked into the runtime (overridable via <BIN>_BASE_URL).'),
    },
  },
};
for (const [lang, { options }] of Object.entries(CLI_LANG_OPTIONS)) {
  const defName = `${lang
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('')}Section`;
  $defs[defName] = {
    type: 'object',
    description: `Options for the ${lang} CLI output target (the OpenCLI pipeline — a command-line tool, not an SDK).`,
    properties: {
      output: str("Output directory for this target's generated CLI project."),
      publish: {
        $ref: '#/$defs/PublishTarget',
        description: 'Only `version` is consumed (the emitted CLI version); `opensdk publish` skips CLI targets.',
      },
      ...CLI_CONVERTER_PROPS,
      ...options,
    },
    additionalProperties: false,
  };
  patternProperties[`^(${lang})$`] = { $ref: `#/$defs/${defName}` };
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
    spec: {
      type: 'string',
      description:
        'Path to the OpenAPI spec (yaml/json) or a pre-parsed OpenSDK IR (.json), relative to this file. Used by `opensdk generate` when --spec is omitted; --spec overrides it.',
    },
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
    publish: { $ref: '#/$defs/PublishTarget', description: 'Global publish target (defaults; a language section `publish` overrides it).' },
  },
  patternProperties,
  additionalProperties: true,
  $defs,
};

writeFileSync(outPath, `${JSON.stringify(schema, null, 2)}\n`);
console.log(
  `Wrote ${outPath} (${BEHAVIOR_DEFS.length} behavior defs + ${Object.keys(LANG_OPTIONS).length} language sections + ${Object.keys(CLI_LANG_OPTIONS).length} CLI target sections)`,
);

// ── chain.schema.json — the `opensdk run` pipeline config (sources → targets),
// reusing the same SdkBehavior + PublishTarget $defs. ─────────────────────────
const groupingDef = {
  type: 'object',
  description: 'Spec-external resource grouping (mountRules/operationHints).',
  properties: {
    mountRules: { type: 'object', additionalProperties: { type: 'string' } },
    operationHints: { type: 'object', additionalProperties: true },
  },
  additionalProperties: false,
};
const inputDef = {
  type: 'object',
  required: ['location'],
  properties: { location: str('A spec/overlay file path or URL.') },
  additionalProperties: false,
};
const chainSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://unpkg.com/@xyd-js/opensdk-cli/chain.schema.json',
  title: 'OpenSDK chain.json',
  description: 'A multi-source/multi-target SDK pipeline run by `opensdk run`.',
  type: 'object',
  required: ['version', 'sources', 'targets'],
  properties: {
    $schema: { type: 'string' },
    version: { description: 'Config schema version.', anyOf: [{ type: 'number' }, { type: 'string' }] },
    behavior: { $ref: '#/$defs/SdkBehavior', description: 'Global runtime behavior default (deep-merged under each target).' },
    publish: { $ref: '#/$defs/PublishTarget', description: 'Global publish default (merged under each target `publish`).' },
    sources: {
      type: 'object',
      description: 'Named sources; each produces one processed spec (inputs merged, overlays applied).',
      additionalProperties: {
        type: 'object',
        required: ['inputs'],
        properties: {
          inputs: { type: 'array', items: inputDef, minItems: 1, description: 'Spec inputs; multiple are merged.' },
          overlays: { type: 'array', items: inputDef, description: 'OpenAPI Overlay 1.0.0 docs, applied in order.' },
          output: str('Where to write the processed spec (json/yaml by extension); a temp file if omitted.'),
        },
        additionalProperties: false,
      },
    },
    targets: {
      type: 'object',
      description: 'Named targets; each generates (and optionally publishes) one SDK from a source.',
      additionalProperties: {
        type: 'object',
        required: ['target', 'source'],
        properties: {
          target: str('Emitter language or alias (typescript, go, csharp, ...) — or a CLI output target (go-cli, rust-cli).'),
          source: str('Name of the `sources` entry this target generates from.'),
          output: str('SDK output directory (default ./sdk/<target-name>).'),
          sdkName: str('SDK name passed to the converter.'),
          behavior: { $ref: '#/$defs/SdkBehavior', description: "Behavior override over the chain's global behavior." },
          grouping: groupingDef,
          options: { type: 'object', description: 'Emitter options for this language (packageName, modulePath, ...).', additionalProperties: true },
          publish: { $ref: '#/$defs/PublishTarget', description: "Publish target merged over the chain's global publish." },
          tests: { type: 'boolean', description: "Emit the SDK's own test suite (default true)." },
        },
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
  $defs,
};
const chainOut = resolve(here, '../chain.schema.json');
writeFileSync(chainOut, `${JSON.stringify(chainSchema, null, 2)}\n`);
console.log(`Wrote ${chainOut} (chain pipeline schema)`);
