import type { OpencliSpecJson } from '@xyd-js/opencli';
import type { ProjectFileMap, WriteMode } from '@xyd-js/opensdk-framework';

import { renderCli } from './cli';
import { renderResourceFile, type ResourceFile } from './command';
import { renderMain } from './main';
import { crateName as toCrateName, slug } from './naming';
import { native } from './native';
import { GENERATED_HEADER } from './rslit';
import {
  cargoToml,
  configRs,
  customRegistryRs,
  customScaffoldRs,
  genModRs,
  httpRs,
  overridesRs,
  runtimeModRs,
} from './runtime';
import type { Opencli2RustOptions } from './types';

/**
 * Generate a buildable Rust CLI project (clap v4, async reqwest runtime) from an
 * OpenCLI document. Pure: returns a virtual file map for the framework's
 * writeProject — generator-owned files as plain strings ('overwrite'), user-owned
 * scaffolds (Cargo.toml, .gitignore, src/custom/) as 'skipIfExists' entries.
 */
export function opencli2rust(spec: OpencliSpecJson, options: Opencli2RustOptions = {}): ProjectFileMap {
  if (native?.opencli2rust) {
    // Native returns an ORDERED array of { path, content, writeMode } to preserve
    // the ProjectFileMap shape; reconstruct it, matching the JS convention of a
    // plain string for 'overwrite' files and an entry for scaffolds.
    const entries = JSON.parse(
      native.opencli2rust(JSON.stringify(spec), JSON.stringify(options)),
    ) as { path: string; content: string; writeMode: WriteMode }[];
    const files: ProjectFileMap = {};
    for (const e of entries) {
      files[e.path] = e.writeMode === 'overwrite' ? e.content : { content: e.content, writeMode: e.writeMode };
    }
    return files;
  }

  const binName = options.binName ?? (slug(spec.info?.title || 'cli') || 'cli');
  const crate = options.crateName ?? toCrateName(spec.info?.title || binName);
  const edition = options.edition ?? '2021';
  const baseURL = options.baseURL ?? spec['x-openapi']?.servers?.[0] ?? '';

  const files: ProjectFileMap = {};

  files['Cargo.toml'] = { content: cargoToml(spec, crate, binName, edition), writeMode: 'skipIfExists' };
  files['.gitignore'] = { content: '/target\n', writeMode: 'skipIfExists' };

  files['src/main.rs'] = renderMain();

  const resources: ResourceFile[] = (spec.commands || []).map((top) => renderResourceFile(top));
  for (const r of resources) files[r.path] = r.content;
  files['src/gen/cmd/mod.rs'] = cmdModRs(resources);
  files['src/gen/cli.rs'] = renderCli(spec, binName, resources);
  files['src/gen/mod.rs'] = genModRs();
  files['src/gen/runtime/mod.rs'] = runtimeModRs();
  files['src/gen/runtime/http.rs'] = httpRs();
  files['src/gen/runtime/config.rs'] = configRs(spec, binName, baseURL);
  files['src/gen/runtime/overrides.rs'] = overridesRs();
  files['src/gen/runtime/custom.rs'] = customRegistryRs();

  files['src/custom/mod.rs'] = { content: customScaffoldRs(), writeMode: 'skipIfExists' };

  return files;
}

function cmdModRs(resources: ResourceFile[]): string {
  const mods = resources.map((r) => `pub mod ${r.modName};`).join('\n');
  return `${GENERATED_HEADER}\n${mods ? `\n${mods}\n` : ''}`;
}
