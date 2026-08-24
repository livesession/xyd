import type { OpencliSpecJson } from '@xyd-js/opencli';
import type { ProjectFileMap, WriteMode } from '@xyd-js/opensdk-framework';

import { renderCli } from './cli';
import { renderResourceFile, type ResourceFile } from './command';
import { renderMain } from './main';
import { crateName as toCrateName, slug } from './naming';
import { native } from './native';
import { GENERATED_HEADER } from './rslit';
import {
  actionsRs,
  cargoToml,
  commandsRs,
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
  // The top-level generated module (`src/<moduleName>/**`) and the hand-owned impl
  // module (`src/<implModule>/mod.rs`). Defaults keep the historical `gen`/`custom`
  // layout byte-identical.
  const moduleName = options.moduleName ?? 'gen';
  const implModule = options.implModule ?? 'custom';

  const files: ProjectFileMap = {};

  const resources: ResourceFile[] = (spec.commands || []).map((top) => renderResourceFile(top, moduleName));
  // Aggregate the non-API runnable leaves; their presence gates the whole
  // `Actions` seam (main wiring, cli dispatch, runtime mod, actions.rs, scaffold).
  const actionPaths: string[][] = resources.flatMap((r) => r.actionPaths);
  const hasActions = actionPaths.length > 0;

  files['Cargo.toml'] = { content: cargoToml(spec, crate, binName, edition), writeMode: 'skipIfExists' };
  files['.gitignore'] = { content: '/target\n', writeMode: 'skipIfExists' };

  files['src/main.rs'] = renderMain(hasActions, moduleName, implModule);

  for (const r of resources) files[r.path] = r.content;
  files[`src/${moduleName}/cmd/mod.rs`] = cmdModRs(resources);
  files[`src/${moduleName}/cli.rs`] = renderCli(spec, binName, resources, actionPaths);
  files[`src/${moduleName}/mod.rs`] = genModRs();
  files[`src/${moduleName}/runtime/mod.rs`] = runtimeModRs(hasActions);
  files[`src/${moduleName}/runtime/http.rs`] = httpRs();
  files[`src/${moduleName}/runtime/config.rs`] = configRs(spec, binName, baseURL);
  files[`src/${moduleName}/runtime/overrides.rs`] = overridesRs();
  files[`src/${moduleName}/runtime/custom.rs`] = customRegistryRs();
  if (hasActions) {
    files[`src/${moduleName}/runtime/actions.rs`] = actionsRs();
    files[`src/${moduleName}/runtime/commands.rs`] = commandsRs(actionPaths);
  }

  files[`src/${implModule}/mod.rs`] = {
    content: customScaffoldRs(hasActions, moduleName, actionPaths),
    writeMode: 'skipIfExists',
  };

  return files;
}

function cmdModRs(resources: ResourceFile[]): string {
  const mods = resources.map((r) => `pub mod ${r.modName};`).join('\n');
  return `${GENERATED_HEADER}\n${mods ? `\n${mods}\n` : ''}`;
}
