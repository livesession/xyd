import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export interface InitOptions {
  project?: string;
  /** 'json' (default) scaffolds sdk.json; 'mjs' scaffolds the opensdk.config.mjs plugin bundle. */
  format?: 'json' | 'mjs';
  /** Write sdk.json under a subdir (e.g. `.sdk`) instead of the project root. */
  dir?: string;
  /** Seed the scaffolded language section (default `typescript`). */
  lang?: string;
}

/** `opensdk init` — scaffold a config: sdk.json by default, or the opensdk.config.mjs plugin bundle. */
export async function initCommand(opts: InitOptions): Promise<void> {
  const projectDir = resolve(opts.project ?? '.');

  if (opts.format === 'mjs') {
    const configPath = resolve(projectDir, 'opensdk.config.mjs');
    if (existsSync(configPath)) throw new Error('Project already initialized — opensdk.config.mjs exists');
    writeFileSync(configPath, mjsTemplate());
    console.log(`Created ${configPath}`);
    return;
  }

  const configPath = resolve(projectDir, opts.dir ?? '.', 'sdk.json');
  if (existsSync(configPath)) throw new Error('Project already initialized — sdk.json exists');
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, sdkJsonTemplate(opts.lang ?? 'typescript'));
  console.log(`Created ${configPath}`);
}

function sdkJsonTemplate(lang: string): string {
  const section: Record<string, unknown> = { packageName: 'acme', output: `./sdk/${lang}` };
  const doc = {
    $schema: 'https://unpkg.com/@xyd-js/opensdk-cli/sdk.schema.json',
    version: 1,
    sdkName: 'acme',
    // Global runtime behavior, deep-merged over @xyd-js/opensdk-core
    // defaultSdkBehavior() (arrays replace entirely). A per-language `behavior`
    // block overrides this for that language.
    behavior: { retry: { maxRetries: 3 }, timeout: { defaultTimeoutMs: 30000 } },
    // Per-language sections: emitter options + `output` + optional `behavior`.
    // Keys accept aliases (typescript->node, csharp->dotnet, py, rb, ...).
    [lang]: section,
  };
  return `${JSON.stringify(doc, null, 2)}\n`;
}

function mjsTemplate(): string {
  return `// opensdk plugin bundle. The built-in emitters (go/python/node/ruby/java/dotnet)
// are registered automatically; register your OWN emitter here — it must
// implement the @xyd-js/opensdk-framework Emitter contract. (For declarative
// config without custom emitters, prefer sdk.json — run \`opensdk init\`.)
//
// import { myEmitter } from './src/my-emitter.mjs';

/** @type {import('@xyd-js/opensdk-cli').OpensdkCliConfig} */
export default {
  emitters: [
    // myEmitter,
  ],
  emitterOptions: {
    // go: { modulePath: 'github.com/acme/acme-go' },
    // python: { packageName: 'acme' },
    // Generated SDKs ship a self-test suite by default. Opt a language out with
    // <lang>.tests: false (same effect as \`generate --no-tests\`):
    // go: { tests: false },
  },
  // Declarative runtime behavior, deep-merged over the canonical defaults
  // (@xyd-js/opensdk-core defaultSdkBehavior()); arrays replace entirely.
  //
  // sdk: {
  //   retry: { maxRetries: 3 },
  //   timeout: { defaultTimeoutMs: 30000 },
  // },
  //
  // Spec-external resource grouping (Stainless-style beta/admin namespacing).
  // mountRules: { assistants: 'beta/assistants' },
  // operationHints: { 'POST /assistants': { mountOn: 'beta/assistants' } },
};
`;
}
