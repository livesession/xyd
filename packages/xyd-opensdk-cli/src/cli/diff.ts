import type { IrChange, IrDiff, IrSeverity } from '@xyd-js/opensdk-core';
import { diffIR } from '@xyd-js/opensdk-core';

import { loadIR } from './generate';
import { type ConverterInputs, converterOptions } from './grouping';

/** Which severity gates a nonzero exit (see `exitCode`). */
export type DiffFailOn = 'breaking' | 'risky' | 'any';

const FAIL_ON_VALUES: DiffFailOn[] = ['breaking', 'risky', 'any'];

export interface DiffCommandOptions extends ConverterInputs {
  /** The published/old spec: OpenAPI (yaml/json) or pre-parsed OpenSDK IR (.json). */
  base: string;
  /** The new spec: OpenAPI (yaml/json) or pre-parsed OpenSDK IR (.json). */
  head: string;
  /** Print the machine-readable IrDiff JSON instead of the grouped report. */
  json?: boolean;
  /** Failure gate (default `breaking`); see `exitCode` for the 0/1/2 table. */
  failOn?: DiffFailOn;
}

const SEVERITY_ORDER: IrSeverity[] = ['breaking', 'risky', 'safe'];

/**
 * `opensdk diff <base> <head>` — convert both spec versions through the SAME
 * converter options (grouping/mount rules apply to both sides, so spec-external
 * remounts never show up as false method renames), diff the IRs with
 * opensdk-core's `diffIR`, and report changes grouped by SDK-consumer impact.
 * Returns the process exit code — the caller assigns it to `process.exitCode`.
 */
export async function diffCommand(opts: DiffCommandOptions): Promise<number> {
  const failOn = opts.failOn ?? 'breaking';
  if (!FAIL_ON_VALUES.includes(failOn)) {
    throw new Error(`Invalid --fail-on value: ${failOn}. Expected one of: ${FAIL_ON_VALUES.join(', ')}.`);
  }

  const options = converterOptions(opts);
  const base = await loadIR(opts.base, options);
  const head = await loadIR(opts.head, options);
  const diff = diffIR(base, head);

  if (opts.json) {
    process.stdout.write(`${JSON.stringify(diff, null, 2)}\n`);
  } else {
    printReport(diff);
  }
  return exitCode(diff, failOn);
}

/**
 * The 0/1/2 trichotomy (oagen's diff contract): 2 = breaking present,
 * 1 = risky present, 0 = safe only or no changes. `--fail-on any` additionally
 * exits 1 when only safe changes exist; `risky` matches the default table
 * (risky already exits nonzero).
 */
function exitCode(diff: IrDiff, failOn: DiffFailOn): number {
  const has = (severity: IrSeverity) => diff.changes.some((c) => c.severity === severity);
  if (has('breaking')) return 2;
  if (has('risky')) return 1;
  if (failOn === 'any' && diff.changes.length > 0) return 1;
  return 0;
}

/** Grouped human-readable report: breaking first, then risky, then safe, then a counts line. */
function printReport(diff: IrDiff): void {
  if (diff.changes.length === 0) {
    console.log('No changes.');
    return;
  }

  const bySeverity = new Map<IrSeverity, IrChange[]>(SEVERITY_ORDER.map((s) => [s, []]));
  for (const change of diff.changes) bySeverity.get(change.severity)?.push(change);

  for (const severity of SEVERITY_ORDER) {
    const changes = bySeverity.get(severity) ?? [];
    if (changes.length === 0) continue;
    console.log(`${severity.toUpperCase()} (${changes.length})`);
    for (const c of changes) console.log(`  ${c.kind}  ${c.path} — ${c.detail}`);
    console.log('');
  }

  const count = (severity: IrSeverity) => bySeverity.get(severity)?.length ?? 0;
  const total = diff.changes.length;
  console.log(
    `${count('breaking')} breaking, ${count('risky')} risky, ${count('safe')} safe (${total} change${total === 1 ? '' : 's'})`,
  );
}
