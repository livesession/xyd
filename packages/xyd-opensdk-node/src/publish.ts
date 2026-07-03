import fs from 'node:fs';
import os from 'node:os';
import * as path from 'node:path';

import { type EmitterPublishOptions, runCommand } from '@xyd-js/opensdk-framework';

/**
 * Publish the generated node SDK to an npm registry. Installs first so the
 * package's `prepare` script (tsc) has typescript available to build `dist/` —
 * the published tarball's exports point at `./dist`. Auth (when a token is given)
 * goes through a throwaway userconfig so it never lands in the package dir.
 */
export function publishNode(dir: string, opts: EmitterPublishOptions = {}): void {
  const registry = opts.registry ?? 'https://registry.npmjs.org';
  // Install deps from the DEFAULT registry (the devDep `typescript` for `prepare`);
  // only `npm publish` targets `--registry` — pinning the install to the publish
  // registry would break a private registry that doesn't proxy npmjs.
  runCommand('npm', ['install'], { cwd: dir });
  const args = ['publish', '--registry', registry];
  if (opts.tag) args.push('--tag', opts.tag);
  if (opts.dryRun) args.push('--dry-run');
  let userconfig: string | undefined;
  try {
    if (opts.token && !opts.dryRun) {
      const host = registry.replace(/^https?:/, '').replace(/\/$/, '');
      userconfig = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'opensdk-npmrc-')), '.npmrc');
      fs.writeFileSync(userconfig, `${host}/:_authToken=${opts.token}\n`);
      args.push('--userconfig', userconfig);
    }
    runCommand('npm', args, { cwd: dir });
  } finally {
    if (userconfig) fs.rmSync(path.dirname(userconfig), { recursive: true, force: true });
  }
}
