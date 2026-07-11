import { Command, Option } from 'commander';

import { mergeBehaviorOverrides, mergePublishTargets } from '@xyd-js/opensdk-core';
import { registerEmitter, resolveLanguage } from '@xyd-js/opensdk-framework';
import { dotnetEmitter } from '@xyd-js/opensdk-dotnet';
import { goEmitter } from '@xyd-js/opensdk-go';
import { javaEmitter } from '@xyd-js/opensdk-java';
import { nodeEmitter } from '@xyd-js/opensdk-node';
import { pythonEmitter } from '@xyd-js/opensdk-python';
import { rubyEmitter } from '@xyd-js/opensdk-ruby';

import { resolveConfig } from './config/source';
import type { ResolvedConfig } from './config/types';
import { type DiffFailOn, diffCommand } from './diff';
import { generateCommand, generateTargets } from './generate';
import { initCommand } from './init';
import { parseCommand } from './parse';
import { applyConfig } from './plugin-loader';
import { detectChain } from '@xyd-js/opensdk-chain';
import { publishCommand } from './publish';
import { runChain } from './run';

function handleError(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  if (message) console.error(message);
  process.exit(1);
}

/** Register the emitters that ship with the CLI (a config can add or override). */
export function registerBuiltinEmitters(): void {
  registerEmitter(goEmitter);
  registerEmitter(pythonEmitter);
  registerEmitter(nodeEmitter);
  registerEmitter(rubyEmitter);
  registerEmitter(javaEmitter);
  registerEmitter(dotnetEmitter);
}

export async function main(argv: string[] = process.argv): Promise<void> {
  registerBuiltinEmitters();

  // Parse --config before Commander runs so user emitters are registered
  // before any command executes (same startup order as oagen).
  const configArgIdx = argv.indexOf('--config');
  const explicitConfigPath = configArgIdx !== -1 ? argv[configArgIdx + 1] : undefined;

  let config: ResolvedConfig | null = null;
  try {
    config = await resolveConfig(process.cwd(), explicitConfigPath);
    if (config) applyConfig(config);
  } catch (err) {
    handleError(err);
  }

  const program = new Command()
    .name('opensdk')
    .description('Generate SDKs from OpenAPI specs through OpenSDK emitter plugins')
    .option('--config <path>', 'Path to opensdk config file (default: opensdk.config.{ts,js,mjs} in cwd)');

  program
    .command('parse')
    .description('Parse an OpenAPI spec and output the OpenSDK IR as JSON')
    .requiredOption('--spec <path>', 'Path to the OpenAPI spec (yaml/json)')
    .option('--output <path>', 'Write the IR to a file instead of stdout')
    .option('--sdk-name <name>', 'SDK name for the converter')
    .option('--grouping <path>', 'JSON grouping file ({mountRules, operationHints}); overrides the config values')
    .action(async (opts) => {
      try {
        await parseCommand({
          spec: opts.spec,
          output: opts.output,
          sdkName: opts.sdkName ?? config?.sdkName,
          mountRules: config?.mountRules,
          operationHints: config?.operationHints,
          grouping: opts.grouping,
          sdk: config?.sdk,
        });
      } catch (err) {
        handleError(err);
      }
    });

  program
    .command('generate')
    .description('Generate an SDK from an OpenAPI spec (or a pre-parsed IR json). With no --lang, every language declared in sdk.json is generated.')
    .option('--spec <path>', 'Path to the OpenAPI spec (yaml/json) or OpenSDK IR (.json); omit to use the "spec" field in sdk.json')
    .option('--lang <language>', 'Emitter language/alias (go|python|typescript|ruby|java|csharp|...); omit to build every language in sdk.json')
    .option('--output <dir>', 'Output directory (single --lang), or the base dir for per-language subfolders (multi-target)')
    .option('--sdk-name <name>', 'SDK name for the converter')
    .option('--grouping <path>', 'JSON grouping file ({mountRules, operationHints}); overrides the config values')
    .option('--dry-run', 'Print the files that would be generated without writing')
    .option('--no-tests', "Don't emit the generated SDK's self-test suite (sets emitterOptions.<lang>.tests=false)")
    .action(async (opts) => {
      try {
        const shared = {
          sdkName: opts.sdkName ?? config?.sdkName,
          mountRules: config?.mountRules,
          operationHints: config?.operationHints,
          grouping: opts.grouping,
          dryRun: opts.dryRun,
          // Commander maps `--no-tests` to opts.tests === false (default true).
          noTests: opts.tests === false,
        };
        // --spec wins; else fall back to the config's predefined `spec` (already
        // resolved absolute against the config dir).
        const spec = opts.spec ?? config?.spec;
        if (!spec) {
          throw new Error('No spec — pass --spec, or add a "spec" field to your sdk.json.');
        }
        if (opts.lang) {
          // Single target: merge the language's behavior over the global one.
          const lang = resolveLanguage(opts.lang);
          const target = config?.targets?.[lang];
          await generateCommand({
            ...shared,
            spec,
            lang: opts.lang,
            output: opts.output ?? target?.output ?? './sdk',
            sdk: mergeBehaviorOverrides(config?.sdk, target?.behavior),
            publish: mergePublishTargets(config?.publish, target?.publish),
            emitterOptions: config?.emitterOptions?.[lang],
          });
        } else {
          // Multi target: build every language declared in the config.
          if (!config) {
            throw new Error('No config found — pass --lang, or add a sdk.json with language sections.');
          }
          await generateTargets({ ...shared, spec, output: opts.output ?? './sdk', sdk: config.sdk, config });
        }
      } catch (err) {
        handleError(err);
      }
    });

  program
    .command('diff')
    .description('Diff two spec versions by SDK-consumer impact (exit 2 = breaking, 1 = risky, 0 = safe/none)')
    .argument('<base>', 'The published/old spec: OpenAPI (yaml/json) or pre-parsed OpenSDK IR (.json)')
    .argument('<head>', 'The new spec: OpenAPI (yaml/json) or pre-parsed OpenSDK IR (.json)')
    .addOption(
      new Option(
        '--fail-on <severity>',
        'Failure gate: breaking|risky exit per the 0/1/2 table; any also exits 1 on safe-only changes',
      )
        .choices(['breaking', 'risky', 'any'])
        .default('breaking'),
    )
    .option('--json', 'Print the machine-readable IrDiff JSON to stdout instead of the grouped report')
    .option('--sdk-name <name>', 'SDK name for the converter (applied to both sides)')
    .option('--grouping <path>', 'JSON grouping file ({mountRules, operationHints}); applied to BOTH sides so remounts never diff as renames')
    .action(async (base, head, opts) => {
      try {
        process.exitCode = await diffCommand({
          base,
          head,
          json: opts.json,
          failOn: opts.failOn as DiffFailOn,
          sdkName: opts.sdkName ?? config?.sdkName,
          mountRules: config?.mountRules,
          operationHints: config?.operationHints,
          grouping: opts.grouping,
          sdk: config?.sdk,
        });
      } catch (err) {
        handleError(err);
      }
    });

  program
    .command('publish')
    .description('Publish already-generated SDK(s) to their language registries (npm/PyPI/RubyGems/NuGet/Maven; Go = git tag). Run `generate` first.')
    .option('--lang <language>', 'Emitter language/alias; omit to publish every language declared in sdk.json')
    .option('--output <dir>', 'Generated SDK dir (single --lang), or the base dir of per-language subfolders (multi)')
    .option('--registry <url>', 'Registry URL override (wins over the config publish.registry)')
    .option('--dry-run', 'Package only (npm pack / build / gem build / dotnet pack) without pushing')
    .action(async (opts) => {
      try {
        await publishCommand({
          lang: opts.lang,
          output: opts.output ?? (opts.lang ? './sdk' : './sdk'),
          registry: opts.registry,
          dryRun: opts.dryRun,
          config,
        });
      } catch (err) {
        handleError(err);
      }
    });

  program
    .command('run')
    .description('Run a chain.json pipeline: process sources (merge + overlays) then generate every target SDK (add --publish to publish each).')
    .option('--chain <path>', 'Path to the chain file (default: chain.json or .chain/chain.json in cwd)')
    .option('--target <name>', 'Only run this target (else every target in the chain)')
    .option('--source <name>', 'Only run targets bound to this source')
    .option('--publish', 'Also publish each generated target to its registry')
    .option('--dry-run', 'Process + print without writing SDKs or pushing')
    .action(async (opts) => {
      try {
        const chain = opts.chain ?? detectChain(process.cwd()) ?? 'chain.json';
        await runChain({
          chain,
          target: opts.target,
          source: opts.source,
          publish: opts.publish,
          dryRun: opts.dryRun,
        });
      } catch (err) {
        handleError(err);
      }
    });

  program
    .command('init')
    .description('Scaffold a config file (sdk.json by default, or an opensdk.config.mjs plugin bundle)')
    .option('--project <dir>', 'Project directory (default: cwd)')
    .addOption(new Option('--format <format>', 'Config format').choices(['json', 'mjs']).default('json'))
    .option('--dir <subdir>', 'Write the config under a subdir (e.g. .sdk / .chain)')
    .option('--lang <language>', 'Seed this language (default: typescript)')
    .option('--chain', 'Scaffold a chain.json pipeline (sources → targets) instead of sdk.json')
    .action(async (opts) => {
      try {
        await initCommand({ project: opts.project, format: opts.format, dir: opts.dir, lang: opts.lang, chain: opts.chain });
      } catch (err) {
        handleError(err);
      }
    });

  await program.parseAsync(argv);
}
