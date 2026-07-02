import fs from 'node:fs';
import * as path from 'node:path';

import type { OpenApi2OpenSdkOptions, OperationHint } from '@xyd-js/openapi2opensdk';
import type { DeepPartial, SdkBehavior } from '@xyd-js/opensdk-core';

/**
 * A grouping file's shape (oracle/openai-grouping.json): spec-external mount
 * overrides for Stainless-style beta/admin namespacing. Extra keys (`_note`)
 * are ignored.
 */
export interface GroupingOverrides {
  mountRules?: Record<string, string>;
  operationHints?: Record<string, OperationHint>;
}

/** Converter-feeding inputs shared by `parse` and `generate`. */
export interface ConverterInputs {
  sdkName?: string;
  mountRules?: Record<string, string>;
  operationHints?: Record<string, OperationHint>;
  /** Path to a `{mountRules, operationHints}` JSON file; wins over the fields above. */
  grouping?: string;
  /**
   * Runtime-behavior overrides (config `sdk`); the converter deep-merges them
   * over opensdk-core's `defaultSdkBehavior()` and stamps the result as `spec.sdk`.
   */
  sdk?: DeepPartial<SdkBehavior>;
}

/** Load a `{mountRules, operationHints}` grouping JSON file. */
export function loadGrouping(groupingPath: string, cwd: string = process.cwd()): GroupingOverrides {
  const resolved = path.resolve(cwd, groupingPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Grouping file not found: ${resolved}. Check the path passed to --grouping.`);
  }
  let doc: GroupingOverrides;
  try {
    doc = JSON.parse(fs.readFileSync(resolved, 'utf8')) as GroupingOverrides;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to load grouping file ${resolved}: ${message}`);
  }
  return { mountRules: doc.mountRules, operationHints: doc.operationHints };
}

/**
 * Resolve the converter options for a command: a `--grouping` file's rules
 * override the config-level ones, field by field.
 */
export function converterOptions(inputs: ConverterInputs): OpenApi2OpenSdkOptions {
  const grouping = inputs.grouping ? loadGrouping(inputs.grouping) : undefined;
  const options: OpenApi2OpenSdkOptions = {};
  if (inputs.sdkName) options.sdkName = inputs.sdkName;
  const mountRules = grouping?.mountRules ?? inputs.mountRules;
  if (mountRules) options.mountRules = mountRules;
  const operationHints = grouping?.operationHints ?? inputs.operationHints;
  if (operationHints) options.operationHints = operationHints;
  if (inputs.sdk) options.sdkBehavior = inputs.sdk;
  return options;
}
