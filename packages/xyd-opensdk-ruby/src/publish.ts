import fs from 'node:fs';
import os from 'node:os';
import * as path from 'node:path';

import { type EmitterPublishOptions, firstFile, runCommand } from '@xyd-js/opensdk-framework';

/**
 * Publish the generated Ruby SDK: `gem build` then `gem push` to the host. Modern
 * rubygems reads the api key from GEM_HOST_API_KEY (gem servers like gemstash
 * accept any key; rubygems.org requires a real one).
 */
export function publishRuby(dir: string, opts: EmitterPublishOptions = {}): void {
  const gemspec = firstFile(dir, /\.gemspec$/);
  if (!gemspec) throw new Error(`No .gemspec in ${dir}.`);
  runCommand('gem', ['build', path.basename(gemspec)], { cwd: dir });
  if (opts.dryRun) return;
  const gem = firstFile(dir, /\.gem$/);
  if (!gem) throw new Error(`gem build produced no .gem in ${dir}.`);
  const args = ['push'];
  if (opts.registry) args.push('--host', opts.registry);
  args.push(path.basename(gem));
  // Auth resolution: an explicit token wins; else an ambient GEM_HOST_API_KEY; else
  // fall back to the user's ~/.gem/credentials (`gem signin`). Only when NONE of
  // those exist do we inject a throwaway key so `gem push` to a local gem server
  // (which accepts any key) still works — GEM_HOST_API_KEY takes precedence over
  // the credentials file, so we must never set it when real creds are present.
  const hasCreds = !process.env.GEM_HOST_API_KEY && fs.existsSync(path.join(os.homedir(), '.gem', 'credentials'));
  const key = opts.token ?? process.env.GEM_HOST_API_KEY ?? (hasCreds ? undefined : 'opensdk');
  runCommand('gem', args, {
    cwd: dir,
    env: { ...process.env, ...(key ? { GEM_HOST_API_KEY: key } : {}) },
  });
}
