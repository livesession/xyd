// Regenerate the generated command tree for the Rust `xyd` CLI from its OpenCLI
// document. The source of truth is `opencli.json` (produced by
// `xyd completion opencli` = cliToOpencli(cliSpec)); this script turns it into
// the `src/gen/**` tree via @xyd-js/opencli2rust's non-API "runnable-leaf" mode,
// then writes it through the regen-safe framework `writeProject` lifecycle.
//
// Hand-owned files (Cargo.toml, src/main.rs, src/custom/**, opencli.json,
// regen.mjs, .sdkignore) are protected by `.sdkignore` and never clobbered.
//
// Usage: `node crates/xyd_cli/regen.mjs`

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { opencli2rust } from '@xyd-js/opencli2rust';
import { writeProject } from '@xyd-js/opensdk-framework';

const here = dirname(fileURLToPath(import.meta.url));
const specPath = join(here, 'opencli.json');

const spec = JSON.parse(readFileSync(specPath, 'utf8'));

const files = opencli2rust(spec, { binName: 'xyd', crateName: 'xyd_cli' });

const result = await writeProject(files, here, { generator: 'opencli2rust' });

const summarize = (label, list) => {
    if (list.length) console.log(`${label} (${list.length}): ${list.join(', ')}`);
};
summarize('written', result.written);
summarize('unchanged', result.unchanged);
summarize('skipped', result.skipped);
summarize('conflicts', result.conflicts);
summarize('pruned', result.pruned);
summarize('keptModified', result.keptModified);
console.log('regen complete.');
