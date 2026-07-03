import * as path from 'node:path';

import { type EmitterPublishOptions, runCommand } from '@xyd-js/opensdk-framework';

/**
 * Publish the generated Java SDK via `mvn deploy`. The registry may be a Maven
 * repository URL or a local directory (used as a `file://` repo). A bare
 * `mvn deploy` (no registry) requires `<distributionManagement>` in the pom.
 */
export function publishJava(dir: string, opts: EmitterPublishOptions = {}): void {
  if (opts.dryRun) {
    runCommand('mvn', ['-q', '-DskipTests', 'package'], { cwd: dir });
    return;
  }
  const args = ['-q', '-DskipTests', 'deploy'];
  if (opts.registry) {
    const repo = /^\w+:\/\//.test(opts.registry) ? opts.registry : `file://${path.resolve(opts.registry)}`;
    args.push(`-DaltDeploymentRepository=opensdk::default::${repo}`);
  }
  runCommand('mvn', args, { cwd: dir });
}
