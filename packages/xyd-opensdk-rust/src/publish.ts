import fs from 'node:fs';

import { type EmitterPublishOptions, firstFile, runCommand } from '@xyd-js/opensdk-framework';

/**
 * Publish the generated Rust SDK: `cargo publish` to crates.io (or a named
 * registry). A dry run — or a registry that resolves to a local directory (the
 * publish e2e's reduced-fidelity feed) — only runs `cargo package`, proving the
 * crate packages without pushing. crates.io auth comes from an explicit `--token`
 * or an ambient `cargo login`.
 */
export function publishRust(dir: string, opts: EmitterPublishOptions = {}): void {
  const manifest = firstFile(dir, /^Cargo\.toml$/);
  if (!manifest) throw new Error(`No Cargo.toml in ${dir}.`);

  const registry = opts.registry;
  const localDir = !!registry && fs.existsSync(registry) && fs.statSync(registry).isDirectory();

  if (opts.dryRun || localDir) {
    runCommand('cargo', ['package', '--allow-dirty', '--no-verify'], { cwd: dir });
    return;
  }

  const args = ['publish', '--allow-dirty', '--no-verify'];
  if (registry) args.push('--registry', registry);
  if (opts.token) args.push('--token', opts.token);
  runCommand('cargo', args, { cwd: dir });
}
