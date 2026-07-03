import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { resolveLanguage } from '@xyd-js/opensdk-framework';

import { generateCommand, generateTargets, registerBuiltinEmitters, resolveConfig } from '../src';

// The petstore OpenAPI doc vendored as the converter's 1.basic fixture.
const SPEC = path.join(__dirname, '../../xyd-openapi2opensdk/__fixtures__/1.basic/input.json');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'opensdk-sdkjson-'));
const write = (dir: string, rel: string, body: unknown) => {
  const p = path.join(dir, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof body === 'string' ? body : JSON.stringify(body, null, 2));
  return p;
};

beforeAll(() => registerBuiltinEmitters());

describe('language aliases (framework registry)', () => {
  it('maps human names to canonical emitter ids', () => {
    expect(resolveLanguage('typescript')).toBe('node');
    expect(resolveLanguage('TS')).toBe('node');
    expect(resolveLanguage('csharp')).toBe('dotnet');
    expect(resolveLanguage('py')).toBe('python');
    expect(resolveLanguage('golang')).toBe('go');
    expect(resolveLanguage('go')).toBe('go');
    expect(resolveLanguage('cobol')).toBe('cobol'); // unknown passes through
  });
});

describe('resolveConfig — sdk.json', () => {
  it('normalizes behavior, grouping and per-language sections (aliases -> canonical)', async () => {
    const dir = tmp();
    try {
      write(dir, 'sdk.json', {
        version: 1,
        sdkName: 'acme',
        behavior: { retry: { maxRetries: 4 } },
        grouping: { mountRules: { assistants: 'beta/assistants' } },
        typescript: { packageName: 'acme', output: './out/ts', behavior: { retry: { maxRetries: 9 } } },
        go: { modulePath: 'github.com/acme/acme' },
      });
      const config = await resolveConfig(dir);
      expect(config?.source?.kind).toBe('sdk-json');
      expect(config?.sdk).toEqual({ retry: { maxRetries: 4 } });
      expect(config?.sdkName).toBe('acme');
      expect(config?.mountRules).toEqual({ assistants: 'beta/assistants' });
      // typescript -> node; output/behavior split into targets, the rest into emitterOptions
      expect(config?.emitterOptions?.node).toEqual({ packageName: 'acme' });
      expect(config?.targets?.node).toEqual({ output: './out/ts', behavior: { retry: { maxRetries: 9 } } });
      expect(config?.emitterOptions?.go).toEqual({ modulePath: 'github.com/acme/acme' });
      expect(config?.targets?.go).toBeUndefined(); // go has no output/behavior
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('normalizes global + per-language publish targets', async () => {
    const dir = tmp();
    try {
      write(dir, 'sdk.json', {
        version: 1,
        publish: { author: 'Acme', license: 'MIT', repository: 'https://github.com/acme/acme' },
        typescript: { packageName: 'acme', publish: { registry: 'https://npm.acme.dev', tokenEnv: 'NPM_TOKEN' } },
        python: { packageName: 'acme', publish: { license: 'Apache-2.0' } },
      });
      const config = await resolveConfig(dir);
      expect(config?.publish).toEqual({ author: 'Acme', license: 'MIT', repository: 'https://github.com/acme/acme' });
      expect(config?.targets?.node?.publish).toEqual({ registry: 'https://npm.acme.dev', tokenEnv: 'NPM_TOKEN' });
      expect(config?.targets?.python?.publish).toEqual({ license: 'Apache-2.0' });
      // publish is a reserved key, not an emitter option
      expect(config?.emitterOptions?.node).toEqual({ packageName: 'acme' });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('finds .sdk/sdk.json', async () => {
    const dir = tmp();
    try {
      write(dir, path.join('.sdk', 'sdk.json'), { version: 1, python: { packageName: 'x' } });
      const config = await resolveConfig(dir);
      expect(config?.source?.filePath).toBe(path.join(dir, '.sdk', 'sdk.json'));
      expect(config?.emitterOptions?.python).toEqual({ packageName: 'x' });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('sdk.json takes precedence over opensdk.config.mjs; --config forces one', async () => {
    const dir = tmp();
    try {
      write(dir, 'sdk.json', { version: 1, go: {} });
      write(dir, 'opensdk.config.mjs', 'export default { sdkName: "from-mjs" };');
      expect((await resolveConfig(dir))?.source?.kind).toBe('sdk-json');
      const forced = await resolveConfig(dir, path.join(dir, 'opensdk.config.mjs'));
      expect(forced?.source?.kind).toBe('opensdk-config');
      expect(forced?.sdkName).toBe('from-mjs');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('sdk.schema.json (editor validation)', () => {
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'sdk.schema.json'), 'utf8'));

  it('has a strict per-language section for each emitter with its option keys', () => {
    const expected: Record<string, string[]> = {
      GoSection: ['modulePath', 'packageName', 'goVersion'],
      PythonSection: ['packageName'],
      NodeSection: ['packageName', 'envVar'],
      RubySection: ['packageName', 'moduleName'],
      JavaSection: ['packageName', 'basePackage'],
      DotnetSection: ['sdkName', 'namespace', 'targetFramework'],
    };
    for (const [def, keys] of Object.entries(expected)) {
      const section = schema.$defs[def];
      expect(section, def).toBeDefined();
      expect(section.additionalProperties).toBe(false); // typos flagged
      for (const k of [...keys, 'output', 'behavior', 'baseURL', 'tests']) {
        expect(section.properties[k], `${def}.${k}`).toBeDefined();
      }
    }
  });

  it('exposes a PublishTarget def wired onto every section + the top level', () => {
    expect(schema.$defs.PublishTarget).toBeDefined();
    expect(schema.$defs.PublishTarget.additionalProperties).toBe(false);
    for (const key of ['author', 'license', 'repository', 'homepage', 'version', 'registry', 'tokenEnv', 'packageName']) {
      expect(schema.$defs.PublishTarget.properties[key], `PublishTarget.${key}`).toBeDefined();
    }
    // global publish + a publish field on each language section
    expect(schema.properties.publish?.$ref).toBe('#/$defs/PublishTarget');
    for (const def of ['NodeSection', 'PythonSection', 'JavaSection', 'DotnetSection', 'RubySection', 'GoSection']) {
      expect(schema.$defs[def].properties.publish?.$ref, `${def}.publish`).toBe('#/$defs/PublishTarget');
    }
  });

  it('maps language aliases to the right section', () => {
    const patterns = schema.patternProperties as Record<string, { $ref: string }>;
    const refFor = (lang: string) =>
      Object.entries(patterns).find(([re]) => new RegExp(re).test(lang))?.[1].$ref;
    expect(refFor('typescript')).toBe('#/$defs/NodeSection');
    expect(refFor('csharp')).toBe('#/$defs/DotnetSection');
    expect(refFor('golang')).toBe('#/$defs/GoSection');
    expect(refFor('py')).toBe('#/$defs/PythonSection');
  });
});

describe('generate via sdk.json', () => {
  it('single target: --lang typescript emits through the node emitter to the config output', async () => {
    const dir = tmp();
    try {
      const out = path.join(dir, 'ts-sdk');
      await generateCommand({
        spec: SPEC,
        lang: 'typescript',
        output: out,
        sdkName: 'petstore',
        emitterOptions: { packageName: 'petstore' },
      });
      expect(fs.existsSync(path.join(out, 'src', 'client.ts'))).toBe(true);
      expect(fs.existsSync(path.join(out, 'package.json'))).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('multi target: builds every declared language, per-language behavior re-stamped', async () => {
    const dir = tmp();
    try {
      write(dir, 'sdk.json', {
        version: 1,
        sdkName: 'petstore',
        behavior: { retry: { maxRetries: 3 } },
        typescript: { output: path.join(dir, 'out/ts'), behavior: { retry: { maxRetries: 7 } } },
        go: { modulePath: 'github.com/acme/petstore', output: path.join(dir, 'out/go') },
      });
      const config = await resolveConfig(dir);
      await generateTargets({ spec: SPEC, output: path.join(dir, 'out'), sdkName: 'petstore', sdk: config!.sdk, config: config! });

      expect(fs.existsSync(path.join(dir, 'out/ts/src/client.ts'))).toBe(true);
      expect(fs.existsSync(path.join(dir, 'out/go/client.go'))).toBe(true);
      // per-language behavior: ts overrides to 7, go keeps the global 3
      const tsReq = fs.readFileSync(path.join(dir, 'out/ts/src/core/request.ts'), 'utf8');
      expect(tsReq).toContain('MAX_RETRIES = 7');
      const goCfg = fs.readFileSync(path.join(dir, 'out/go/internal/requestconfig/config.go'), 'utf8');
      expect(goCfg).toMatch(/MaxRetries\s*=\s*3/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('threads publish identity onto every manifest; per-language publish overrides the global', async () => {
    const dir = tmp();
    try {
      write(dir, 'sdk.json', {
        version: 1,
        sdkName: 'petstore',
        publish: { author: 'Acme', license: 'MIT', repository: 'https://github.com/acme/petstore' },
        typescript: { output: path.join(dir, 'out/ts') },
        python: { packageName: 'petstore', output: path.join(dir, 'out/py'), publish: { license: 'Apache-2.0' } },
      });
      const config = await resolveConfig(dir);
      await generateTargets({ spec: SPEC, output: path.join(dir, 'out'), sdkName: 'petstore', sdk: config!.sdk, config: config! });

      // node package.json carries the global identity (author/license/repository)
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'out/ts/package.json'), 'utf8'));
      expect(pkg.author).toBe('Acme');
      expect(pkg.license).toBe('MIT');
      expect(pkg.repository).toEqual({ type: 'git', url: 'https://github.com/acme/petstore' });
      // python pyproject overrides license to Apache-2.0 (per-language publish wins), keeps the global author
      const pyproject = fs.readFileSync(path.join(dir, 'out/py/pyproject.toml'), 'utf8');
      expect(pyproject).toContain('license = { text = "Apache-2.0" }');
      expect(pyproject).toContain('authors = [{ name = "Acme" }]');
      expect(pyproject).toContain('[build-system]');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('multi target with an unknown language throws', async () => {
    const dir = tmp();
    try {
      write(dir, 'sdk.json', { version: 1, kotlin: { output: './k' } });
      const config = await resolveConfig(dir);
      await expect(
        generateTargets({ spec: SPEC, output: path.join(dir, 'out'), config: config! }),
      ).rejects.toThrow(/Unknown opensdk language: kotlin/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
