import fs from 'node:fs';

import { openapi2opensdkFromSource } from '@xyd-js/openapi2opensdk';

import { type ConverterInputs, converterOptions } from './grouping';

/** `opensdk parse` — OpenAPI spec → OpenSDK IR as JSON (stdout or --output). */
export async function parseCommand(opts: ConverterInputs & { spec: string; output?: string }): Promise<void> {
  const ir = await openapi2opensdkFromSource(opts.spec, converterOptions(opts));
  const json = `${JSON.stringify(ir, null, 2)}\n`;
  if (opts.output) {
    fs.writeFileSync(opts.output, json);
    console.log(`Wrote IR to ${opts.output}`);
  } else {
    process.stdout.write(json);
  }
}
