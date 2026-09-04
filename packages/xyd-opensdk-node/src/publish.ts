import fs from 'node:fs';
import os from 'node:os';
import * as path from 'node:path';

import { type EmitterPublishOptions, commandOutput, runCommand } from '@xyd-js/opensdk-framework';

/**
 * Publish the generated node SDK to an npm registry. Installs first so the
 * package's `prepare` script (tsc) has typescript available to build `dist/` —
 * the published tarball's exports point at `./dist`. Auth (when a token is given)
 * goes through a throwaway userconfig so it never lands in the package dir.
 *
 * Token resolution (mirrors the ruby publisher): an explicit token wins; else
 * the user's ambient npm config (`npm login` / .npmrc); only when NEITHER
 * exists for a CUSTOM registry do we inject a throwaway token — npm refuses to
 * publish without one (client-side ENEEDAUTH) even when the registry itself
 * allows anonymous publish (verdaccio `$all`, which accepts any token).
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
  const host = registry.replace(/^https?:/, '').replace(/\/$/, '');
  let token = opts.token;
  if (!token && !opts.dryRun && opts.registry) {
    const ambient = commandOutput('npm', ['config', 'get', `${host}/:_authToken`], { cwd: dir }).trim();
    if (!ambient || ambient === 'undefined' || ambient === 'null') {
      token = 'opensdk-anonymous';
    }
  }
  let userconfig: string | undefined;
  try {
    if (token && !opts.dryRun) {
      userconfig = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'opensdk-npmrc-')), '.npmrc');
      fs.writeFileSync(userconfig, `${host}/:_authToken=${token}\n`);
      args.push('--userconfig', userconfig);
    }
    runCommand('npm', args, { cwd: dir });
  } finally {
    if (userconfig) fs.rmSync(path.dirname(userconfig), { recursive: true, force: true });
  }
}
