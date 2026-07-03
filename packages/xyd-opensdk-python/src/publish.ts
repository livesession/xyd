import { type EmitterPublishOptions, runCommand } from '@xyd-js/opensdk-framework';

/**
 * Publish the generated Python SDK to a PyPI-compatible index: `python -m build`
 * (needs the PyPA `build` package) then `twine upload`. Auth via TWINE_* env; the
 * token becomes TWINE_PASSWORD with the `__token__` username convention.
 */
export function publishPython(dir: string, opts: EmitterPublishOptions = {}): void {
  runCommand('python3', ['-m', 'build'], { cwd: dir });
  if (opts.dryRun) return;
  const args = ['upload'];
  if (opts.registry) args.push('--repository-url', opts.registry);
  args.push('dist/*');
  runCommand('twine', args, {
    cwd: dir,
    env: {
      ...process.env,
      TWINE_USERNAME: process.env.TWINE_USERNAME ?? '__token__',
      TWINE_PASSWORD: opts.token ?? process.env.TWINE_PASSWORD ?? 'opensdk',
    },
  });
}
