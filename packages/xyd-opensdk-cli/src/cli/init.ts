import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** `opensdk init` — scaffold an opensdk.config.mjs plugin bundle in the project. */
export async function initCommand(opts: { project?: string }): Promise<void> {
  const projectDir = resolve(opts.project ?? '.');
  const configPath = resolve(projectDir, 'opensdk.config.mjs');
  if (existsSync(configPath)) {
    throw new Error('Project already initialized — opensdk.config.mjs exists');
  }
  writeFileSync(configPath, configTemplate());
  console.log(`Created ${configPath}`);
}

function configTemplate(): string {
  return `// opensdk plugin bundle. The go/python emitters are built in; register your
// own emitter here — it must implement the @xyd-js/opensdk-framework Emitter
// contract (pure capability methods: IR in -> GeneratedFile[] out).
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
  // Declarative runtime behavior of the generated SDKs, deep-merged over the
  // canonical defaults (@xyd-js/opensdk-core defaultSdkBehavior()); arrays
  // replace entirely. Stamped on the IR as spec.sdk for every emitter.
  //
  // sdk: {
  //   retry: { maxRetries: 3 },
  //   timeout: { defaultTimeoutMs: 30000 },
  // },
  //
  // Spec-external resource grouping (Stainless-style beta/admin namespacing).
  // A JSON file passed via --grouping ({mountRules, operationHints}) overrides these.
  //
  // mountRules: { assistants: 'beta/assistants' },
  // operationHints: { 'POST /assistants': { mountOn: 'beta/assistants' } },
};
`;
}
