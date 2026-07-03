import { describe, expect, it } from 'vitest';

import { mergePublishTargets } from '../src';

describe('mergePublishTargets', () => {
  it('layers left-to-right; later defined fields win', () => {
    expect(
      mergePublishTargets(
        { author: 'Acme', license: 'MIT', repository: 'https://github.com/acme/x' },
        { license: 'Apache-2.0', registry: 'https://npm.acme.dev' },
      ),
    ).toEqual({
      author: 'Acme',
      license: 'Apache-2.0',
      repository: 'https://github.com/acme/x',
      registry: 'https://npm.acme.dev',
    });
  });

  it('skips undefined layers and undefined fields (no clobber)', () => {
    expect(mergePublishTargets(undefined, { author: 'Acme' }, undefined)).toEqual({ author: 'Acme' });
    expect(mergePublishTargets({ author: 'Acme', license: 'MIT' }, { license: undefined })).toEqual({
      author: 'Acme',
      license: 'MIT',
    });
  });

  it('returns undefined when nothing contributes (callers can skip identity threading)', () => {
    expect(mergePublishTargets(undefined, undefined)).toBeUndefined();
    expect(mergePublishTargets()).toBeUndefined();
  });
});
