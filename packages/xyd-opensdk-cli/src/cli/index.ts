import { Command, Option } from 'commander';

import { registerEmitter } from '@xyd-js/opensdk-framework';
import { goEmitter } from '@xyd-js/opensdk-go';
import { pythonEmitter } from '@xyd-js/opensdk-python';

import { type OpensdkCliConfig, loadConfig } from './config-loader';
import { type DiffFailOn, diffCommand } from './diff';
import { generateCommand } from './generate';
import { initCommand } from './init';
import { parseCommand } from './parse';
import { applyConfig } from './plugin-loader';

function handleError(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  if (message) console.error(message);
  process.exit(1);
}

/** Register the emitters that ship with the CLI (a config can add or override). */
export function registerBuiltinEmitters(): void {
  registerEmitter(goEmitter);
  registerEmitter(pythonEmitter);
}

export async function main(argv: string[] = process.argv): Promise<void> {
  registerBuiltinEmitters();

  // Parse --config before Commander runs so user emitters are registered
  // before any command executes (same startup order as oagen).
  const configArgIdx = argv.indexOf('--config');
  const explicitConfigPath = configArgIdx !== -1 ? argv[configArgIdx + 1] : undefined;

  let config: OpensdkCliConfig | null = null;
  try {
    config = await loadConfig(explicitConfigPath);
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
    .description('Generate an SDK from an OpenAPI spec (or a pre-parsed IR json)')
    .requiredOption('--spec <path>', 'Path to the OpenAPI spec (yaml/json) or OpenSDK IR (.json)')
    .requiredOption('--lang <language>', 'Registered emitter language (built-in: go, python)')
    .option('--output <dir>', 'Output directory', './sdk')
    .option('--sdk-name <name>', 'SDK name for the converter')
    .option('--grouping <path>', 'JSON grouping file ({mountRules, operationHints}); overrides the config values')
    .option('--dry-run', 'Print the files that would be generated without writing')
    .option('--no-tests', "Don't emit the generated SDK's self-test suite (sets emitterOptions.<lang>.tests=false)")
    .action(async (opts) => {
      try {
        await generateCommand({
          spec: opts.spec,
          lang: opts.lang,
          output: opts.output,
          sdkName: opts.sdkName ?? config?.sdkName,
          mountRules: config?.mountRules,
          operationHints: config?.operationHints,
          grouping: opts.grouping,
          sdk: config?.sdk,
          dryRun: opts.dryRun,
          // Commander maps `--no-tests` to opts.tests === false (default true).
          noTests: opts.tests === false,
          emitterOptions: config?.emitterOptions?.[opts.lang],
        });
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
    .command('init')
    .description('Scaffold an opensdk.config.mjs plugin bundle')
    .option('--project <dir>', 'Project directory (default: cwd)')
    .action(async (opts) => {
      try {
        await initCommand({ project: opts.project });
      } catch (err) {
        handleError(err);
      }
    });

  await program.parseAsync(argv);
}
