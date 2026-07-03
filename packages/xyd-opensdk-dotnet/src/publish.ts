import fs from 'node:fs';
import * as path from 'node:path';

import { type EmitterPublishOptions, firstFile, runCommand } from '@xyd-js/opensdk-framework';

/**
 * Publish the generated .NET SDK: `dotnet pack` then `dotnet nuget push`. The
 * source may be a NuGet server URL or a local folder feed (created if missing).
 */
export function publishDotnet(dir: string, opts: EmitterPublishOptions = {}): void {
  runCommand('dotnet', ['pack', '-c', 'Release'], { cwd: dir });
  if (opts.dryRun) return;
  const nupkg = firstFile(path.join(dir, 'bin', 'Release'), /\.nupkg$/);
  if (!nupkg) throw new Error(`dotnet pack produced no .nupkg under ${dir}/bin/Release.`);
  const registry = opts.registry ?? 'https://api.nuget.org/v3/index.json';
  if (!/^\w+:\/\//.test(registry)) fs.mkdirSync(registry, { recursive: true }); // folder feed
  const args = ['nuget', 'push', nupkg, '-s', registry];
  if (opts.token) args.push('-k', opts.token);
  runCommand('dotnet', args, { cwd: dir });
}
