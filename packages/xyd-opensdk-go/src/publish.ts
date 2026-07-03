import { type EmitterPublishOptions, commandOutput, runCommand } from '@xyd-js/opensdk-framework';

/**
 * "Publish" the generated Go module — Go has no registry, so this is a git tag.
 * Initializes a repo + commits when the dir isn't already one (a freshly
 * generated dir isn't), tags `v<version>`, and pushes tags when a remote exists.
 */
export function publishGo(dir: string, opts: EmitterPublishOptions = {}): void {
  const version = (opts.version ?? '0.0.0').replace(/^v/, '');
  const tag = `v${version}`;
  if (opts.dryRun) {
    console.log(`[dry-run] would tag ${tag} in ${dir}`);
    return;
  }
  const git = (args: string[], tolerant = false) =>
    runCommand('git', ['-c', 'user.email=opensdk@local', '-c', 'user.name=opensdk', ...args], { cwd: dir, tolerant });
  const hasHead = commandOutput('git', ['rev-parse', '--verify', 'HEAD'], { cwd: dir }).trim() !== '';
  if (!hasHead) {
    // A freshly generated dir (or an initialized-but-empty repo): create the commit to tag.
    git(['init', '-q']); // safe to re-run on an existing repo
    git(['add', '-A']);
    git(['commit', '-q', '-m', 'opensdk publish'], true); // tolerate "nothing to commit"
  } else if (commandOutput('git', ['status', '--porcelain'], { cwd: dir }).trim()) {
    // Existing repo: tag the user's HEAD — never sweep their working tree into a
    // commit. Refuse a dirty tree so the tag points at a known, intended commit.
    throw new Error(
      `${dir} is a git repo with a dirty working tree — commit or stash before publishing so the tag points at a known commit.`,
    );
  }
  git(['tag', tag]);
  if (commandOutput('git', ['remote'], { cwd: dir }).trim()) git(['push', '--tags']);
  else console.log(`Tagged ${tag}. No git remote configured — push it to publish the module.`);
}
