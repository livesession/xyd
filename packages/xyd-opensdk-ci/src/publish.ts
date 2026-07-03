import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import * as path from 'node:path';

import type { OpensdkSpecJson } from '@xyd-js/opensdk-core';
import { writeProject } from '@xyd-js/opensdk-framework';
import type { ProjectFileMap } from '@xyd-js/opensdk-framework';

import { fullIR } from './e2e';
import { hasCommand } from './golden';
import { MockServer } from './mock';

// Per-language PUBLISH e2e: generate → package → publish to an ISOLATED local
// registry → install it back into a scratch consumer → load/reference it. A
// green run proves the whole publish path works. The registries are supplied
// out-of-band (docker-compose locally, native services in CI) and located via
// env vars, so this harness is registry-agnostic; the emitter package injects
// only its `generate` fn (no emitter import here — opensdk-ci is a dependency OF
// the emitters, never the reverse).

/** True when publish e2e is opted in (`E2E_SDK_PUBLISH=1`). */
export function publishE2EEnabled(): boolean {
  return process.env.E2E_SDK_PUBLISH === '1';
}

/** Poll an HTTP registry until it answers (or time out). File-feed registries resolve immediately. */
export async function waitFor(url: string, { timeoutMs = 60_000, intervalMs = 500 } = {}): Promise<void> {
  if (!/^https?:\/\//.test(url)) return; // folder / file:// feed — nothing to wait for
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const res = await fetch(url);
      // any HTTP answer (even 404) means the daemon is up
      if (res.status > 0) return;
    } catch {
      // not up yet
    }
    if (Date.now() > deadline) throw new Error(`Registry ${url} not ready after ${timeoutMs}ms`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

/** The scratch context an adapter's publish/consume steps operate on. */
export interface PublishCtx {
  /** The generated SDK on disk. */
  projectDir: string;
  /** A fresh consumer project that installs the SDK from the registry. */
  consumerDir: string;
  /** The unique version published this run (also stamped onto every manifest). */
  version: string;
  /** Registry URL (npm/PyPI/gem host) or a folder/file feed path/URL. */
  registry: string;
  /** MockServer base URL a smoke can point the client at. */
  mockBaseUrl: string;
  /** Package coordinate(s) read from the generated manifest (name/module/class/...). */
  coord: Record<string, string>;
}

/** A language's publish/consume mechanics. Emitter-agnostic — lives here, not in the emitter package. */
export interface PublishAdapter {
  lang: string;
  /** Env var naming the registry URL/dir (absent → the test skips). */
  registryEnv: string;
  /** Toolchain probe passed to hasCommand() as a gate. */
  toolchainProbe: string;
  /** Read the package coordinate(s) from the generated manifest. */
  coord(projectDir: string): Record<string, string>;
  /** Package + push to the registry. */
  publish(ctx: PublishCtx): void;
  /** Install the SDK from the registry into the consumer and load/reference it (throws on failure). */
  consume(ctx: PublishCtx): void;
}

/** Whether an adapter can run: opted-in + toolchain present + its registry configured. */
export function adapterReady(adapter: PublishAdapter): boolean {
  return publishE2EEnabled() && hasCommand(adapter.toolchainProbe) && !!process.env[adapter.registryEnv];
}

/** Run a child synchronously (cwd + inherited stdio); throw on non-zero. */
function run(cmd: string, args: string[], cwd: string, env?: NodeJS.ProcessEnv): void {
  const res = spawnSync(cmd, args, { cwd, stdio: 'inherit', env: env ?? process.env });
  if (res.error) throw new Error(`${cmd} failed to start: ${res.error.message}`);
  if (res.status !== 0) throw new Error(`${cmd} ${args.join(' ')} exited with ${res.status ?? 'signal'} (cwd ${cwd})`);
}

function firstFile(dir: string, re: RegExp): string {
  const hit = fs.existsSync(dir) ? fs.readdirSync(dir).find((f) => re.test(f)) : undefined;
  if (!hit) throw new Error(`No file matching ${re} in ${dir}`);
  return path.join(dir, hit);
}

export interface PublishRoundTripConfig {
  /** Per-method fixtures dir (<slug>/input.json OpenSDK IR). */
  fixturesDir: string;
  /** SDK name passed to fullIR. */
  sdkName: string;
  /** The emitter's generate fn (injected: opensdk<Lang>). */
  generate: (spec: OpensdkSpecJson) => ProjectFileMap;
  /** The language's publish/consume mechanics. */
  adapter: PublishAdapter;
}

/**
 * Drive one language's full publish round-trip. Throws on any failure so a
 * vitest `it()` in the emitter package can await it. Skips (no-op) if the
 * adapter isn't ready — callers should gate with `adapterReady(adapter)`.
 */
export async function publishRoundTrip(cfg: PublishRoundTripConfig): Promise<void> {
  const { adapter } = cfg;
  const registry = process.env[adapter.registryEnv];
  if (!registry) throw new Error(`${adapter.registryEnv} is not set (no registry to publish to).`);

  const spec = fullIR(cfg.fixturesDir, cfg.sdkName);
  // A unique version per run avoids 409/403 on a warm/persistent registry, and is
  // stamped onto every manifest (Go reads it for the git tag). It must be valid
  // across EVERY ecosystem at once — npm semver, PEP 440, NuGet (Int32 parts),
  // Maven, Go semver — so a plain release `0.0.<seconds>` (no prerelease suffix,
  // patch < 2^31) is used rather than an npm-only `0.0.0-e2e.x` prerelease.
  const version = `0.0.${Math.floor(Date.now() / 1000)}`;
  spec.info = {
    ...spec.info,
    version,
    contact: { ...spec.info.contact, name: spec.info.contact?.name ?? 'opensdk-e2e' },
    license: { ...spec.info.license, identifier: spec.info.license?.identifier ?? 'MIT' },
    repository: spec.info.repository ?? 'https://github.com/opensdk/e2e',
  };

  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), `o2s-pub-${adapter.lang}-`));
  const consumerDir = fs.mkdtempSync(path.join(os.tmpdir(), `o2s-pub-${adapter.lang}-consumer-`));
  const mock = new MockServer(spec);
  await mock.start();
  try {
    await writeProject(cfg.generate(spec), projectDir);
    await waitFor(registry);
    const ctx: PublishCtx = {
      projectDir,
      consumerDir,
      version,
      registry,
      mockBaseUrl: `http://127.0.0.1:${mock.port}`,
      coord: adapter.coord(projectDir),
    };
    adapter.publish(ctx);
    adapter.consume(ctx);
  } finally {
    mock.stop();
    fs.rmSync(projectDir, { recursive: true, force: true });
    fs.rmSync(consumerDir, { recursive: true, force: true });
  }
}

// ── adapters ─────────────────────────────────────────────────────────────────
// Each reads the published coordinate back from the generated manifest (so the
// consumer references exactly what was published), publishes to the env-provided
// registry, then installs it into the scratch consumer and loads/references it.

/** npm → verdaccio. Registry env: PUBLISH_NPM_REGISTRY. */
export function nodePublishAdapter(): PublishAdapter {
  return {
    lang: 'node',
    registryEnv: 'PUBLISH_NPM_REGISTRY',
    toolchainProbe: 'npm --version',
    coord(dir) {
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
      return { pkg: pkg.name };
    },
    publish(ctx) {
      // Install the typescript devDep so the package's `prepare` script builds
      // dist/ on publish (the tarball's exports point at ./dist). verdaccio in
      // these e2es allows anonymous publish; no token needed. Publish under an
      // `e2e` dist-tag so these throwaway versions never become `latest` (the
      // consumer installs by exact version, so the tag is irrelevant to it).
      run('npm', ['install', '--registry', ctx.registry], ctx.projectDir);
      run('npm', ['publish', '--registry', ctx.registry, '--tag', 'e2e'], ctx.projectDir);
    },
    consume(ctx) {
      run('npm', ['init', '-y'], ctx.consumerDir);
      run('npm', ['install', `${ctx.coord.pkg}@${ctx.version}`, '--registry', ctx.registry], ctx.consumerDir);
      // Proves the round-trip: the published tarball installs AND ships its built
      // entry point (`prepare: tsc` produced dist/, `files` included it, exports
      // resolves to it). We assert the entry EXISTS rather than importing it —
      // the generated ESM uses extensionless relative imports, which Node's
      // native ESM loader rejects; emitting extensioned imports (so the package
      // is `import`-able unbundled) is a tracked node-emitter follow-up.
      const installed = path.join(ctx.consumerDir, 'node_modules', ctx.coord.pkg);
      const pkg = JSON.parse(fs.readFileSync(path.join(installed, 'package.json'), 'utf8'));
      const entry = pkg.exports?.['.']?.import ?? pkg.main;
      if (!entry || !fs.existsSync(path.join(installed, entry))) {
        throw new Error(`installed ${ctx.coord.pkg}@${ctx.version} is missing its built entry (${entry})`);
      }
    },
  };
}

/** PyPI → pypiserver. Registry env: PUBLISH_PYPI_URL (upload URL; simple index at <url>/simple). */
export function pythonPublishAdapter(): PublishAdapter {
  return {
    lang: 'python',
    registryEnv: 'PUBLISH_PYPI_URL',
    toolchainProbe: 'python3 --version',
    coord(dir) {
      const toml = fs.readFileSync(path.join(dir, 'pyproject.toml'), 'utf8');
      const name = toml.match(/^name\s*=\s*"([^"]+)"/m)?.[1] ?? 'sdk';
      return { pkg: name };
    },
    publish(ctx) {
      run('python3', ['-m', 'build'], ctx.projectDir);
      run('twine', ['upload', '--repository-url', ctx.registry, 'dist/*'], ctx.projectDir, {
        ...process.env,
        TWINE_USERNAME: process.env.TWINE_USERNAME ?? '__token__',
        TWINE_PASSWORD: process.env.TWINE_PASSWORD ?? 'e2e',
      });
    },
    consume(ctx) {
      const index = `${ctx.registry.replace(/\/$/, '')}/simple/`;
      const target = path.join(ctx.consumerDir, 'site');
      run('python3', ['-m', 'pip', 'install', '--index-url', index, `${ctx.coord.pkg}==${ctx.version}`, '--target', target], ctx.consumerDir);
      fs.writeFileSync(path.join(ctx.consumerDir, 'smoke.py'), `import ${ctx.coord.pkg}\nprint("ok")\n`);
      run('python3', ['smoke.py'], ctx.consumerDir, { ...process.env, PYTHONPATH: target });
    },
  };
}

/** RubyGems → gemstash. Registry env: PUBLISH_GEM_HOST (gemstash /private path). */
export function rubyPublishAdapter(): PublishAdapter {
  return {
    lang: 'ruby',
    registryEnv: 'PUBLISH_GEM_HOST',
    toolchainProbe: 'gem --version',
    coord(dir) {
      const gemspec = fs.readFileSync(firstFile(dir, /\.gemspec$/), 'utf8');
      const name = gemspec.match(/spec\.name\s*=\s*"([^"]+)"/)?.[1] ?? 'sdk';
      return { pkg: name };
    },
    publish(ctx) {
      run('gem', ['build', path.basename(firstFile(ctx.projectDir, /\.gemspec$/))], ctx.projectDir);
      run('gem', ['push', '--host', ctx.registry, path.basename(firstFile(ctx.projectDir, /\.gem$/))], ctx.projectDir, {
        ...process.env,
        ...(process.env.GEM_HOST_API_KEY ? {} : { GEM_HOST_API_KEY: 'e2e' }),
      });
    },
    consume(ctx) {
      const home = path.join(ctx.consumerDir, 'gems');
      run('gem', ['install', ctx.coord.pkg, '-v', ctx.version, '--clear-sources', '-s', ctx.registry, '--install-dir', home], ctx.consumerDir);
      fs.writeFileSync(path.join(ctx.consumerDir, 'smoke.rb'), `require ${JSON.stringify(ctx.coord.pkg)}\nputs "ok"\n`);
      run('ruby', ['smoke.rb'], ctx.consumerDir, { ...process.env, GEM_HOME: home, GEM_PATH: home });
    },
  };
}

/** NuGet → folder feed. Registry env: PUBLISH_NUGET_FEED (a directory). */
export function dotnetPublishAdapter(): PublishAdapter {
  return {
    lang: 'dotnet',
    registryEnv: 'PUBLISH_NUGET_FEED',
    toolchainProbe: 'dotnet --version',
    coord(dir) {
      const csproj = fs.readFileSync(firstFile(dir, /\.csproj$/), 'utf8');
      const id = csproj.match(/<PackageId>([^<]+)<\/PackageId>/)?.[1] ?? 'Sdk';
      return { pkg: id };
    },
    publish(ctx) {
      run('dotnet', ['pack', '-c', 'Release'], ctx.projectDir);
      const nupkg = firstFile(path.join(ctx.projectDir, 'bin', 'Release'), /\.nupkg$/);
      fs.mkdirSync(ctx.registry, { recursive: true });
      run('dotnet', ['nuget', 'push', nupkg, '-s', ctx.registry], ctx.projectDir);
    },
    consume(ctx) {
      // A console consumer that RESTORES the package from the folder feed — restore
      // succeeding proves the .nupkg published and is fetchable + linkable.
      const csproj = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <RestoreSources>${ctx.registry};https://api.nuget.org/v3/index.json</RestoreSources>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="${ctx.coord.pkg}" Version="${ctx.version}" />
  </ItemGroup>
</Project>
`;
      fs.writeFileSync(path.join(ctx.consumerDir, 'consumer.csproj'), csproj);
      fs.writeFileSync(path.join(ctx.consumerDir, 'Program.cs'), 'System.Console.WriteLine("ok");\n');
      run('dotnet', ['build', '-c', 'Release'], ctx.consumerDir);
    },
  };
}

/** Maven → file:// repo. Registry env: PUBLISH_MAVEN_REPO (a directory; used as file://<dir>). */
export function javaPublishAdapter(): PublishAdapter {
  return {
    lang: 'java',
    registryEnv: 'PUBLISH_MAVEN_REPO',
    toolchainProbe: 'mvn -v',
    coord(dir) {
      const pom = fs.readFileSync(path.join(dir, 'pom.xml'), 'utf8');
      const groupId = pom.match(/<groupId>([^<]+)<\/groupId>/)?.[1] ?? 'com.example';
      const artifactId = pom.match(/<artifactId>([^<]+)<\/artifactId>/)?.[1] ?? 'sdk-java';
      // Emitter convention: artifactId is `<pkg>-java`; the client is <groupId>.<pkg>.Client.
      const pkg = artifactId.replace(/-java$/, '');
      return { groupId, artifactId, pkg, importClass: `${groupId}.${pkg}.Client` };
    },
    publish(ctx) {
      const repoUrl = `file://${path.resolve(ctx.registry)}`;
      run('mvn', ['-q', '-DskipTests', 'deploy', `-DaltDeploymentRepository=opensdk::default::${repoUrl}`], ctx.projectDir);
    },
    consume(ctx) {
      const repoUrl = `file://${path.resolve(ctx.registry)}`;
      const pom = `<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example.consumer</groupId>
  <artifactId>consumer</artifactId>
  <version>0.0.0</version>
  <repositories>
    <repository><id>opensdk</id><url>${repoUrl}</url></repository>
  </repositories>
  <dependencies>
    <dependency>
      <groupId>${ctx.coord.groupId}</groupId>
      <artifactId>${ctx.coord.artifactId}</artifactId>
      <version>${ctx.version}</version>
    </dependency>
  </dependencies>
</project>
`;
      fs.writeFileSync(path.join(ctx.consumerDir, 'pom.xml'), pom);
      const src = path.join(ctx.consumerDir, 'src', 'main', 'java');
      fs.mkdirSync(src, { recursive: true });
      fs.writeFileSync(
        path.join(src, 'Main.java'),
        `public class Main { public static void main(String[] a) { Class<?> c = ${ctx.coord.importClass}.class; System.out.println("ok " + c.getName()); } }\n`,
      );
      // compile against the resolved dependency — proves the published jar is consumable.
      run('mvn', ['-q', '-DskipTests', 'compile'], ctx.consumerDir);
    },
  };
}

/**
 * Go → file:// GOPROXY. Registry env: PUBLISH_GOPROXY_DIR (a directory the module
 * is tagged + staged into). Go has no registry: publish = git tag; the consumer
 * `go get`s the tagged version through a local proxy.
 *
 * NOTE: reduced-fidelity — a local-path `replace` proves the module compiles +
 * imports without a full `@v/{list,info,mod,zip}` proxy. Upgrading to a real
 * file:// proxy (or a gitea remote) is a follow-up.
 */
export function goPublishAdapter(): PublishAdapter {
  return {
    lang: 'go',
    registryEnv: 'PUBLISH_GOPROXY_DIR',
    toolchainProbe: 'go version',
    coord(dir) {
      const mod = fs.readFileSync(path.join(dir, 'go.mod'), 'utf8').match(/^module\s+(\S+)/m)?.[1] ?? 'example.com/sdk';
      return { module: mod };
    },
    publish(ctx) {
      // The real Go "publish": tag the module. (Consumed below via a replace.)
      run('git', ['init', '-q'], ctx.projectDir);
      run('git', ['-c', 'user.email=e2e@opensdk', '-c', 'user.name=opensdk-e2e', 'add', '.'], ctx.projectDir);
      run('git', ['-c', 'user.email=e2e@opensdk', '-c', 'user.name=opensdk-e2e', 'commit', '-q', '-m', 'e2e'], ctx.projectDir);
      run('git', ['tag', `v${ctx.version.replace(/^v/, '')}`], ctx.projectDir);
    },
    consume(ctx) {
      const goMod = `module example.com/consumer

go 1.22

require ${ctx.coord.module} v0.0.0

replace ${ctx.coord.module} => ${ctx.projectDir}
`;
      fs.writeFileSync(path.join(ctx.consumerDir, 'go.mod'), goMod);
      fs.writeFileSync(
        path.join(ctx.consumerDir, 'main.go'),
        `package main

import _ ${JSON.stringify(ctx.coord.module)}

func main() { println("ok") }
`,
      );
      run('go', ['build', './...'], ctx.consumerDir, { ...process.env, GOFLAGS: '-mod=mod', GOSUMDB: 'off' });
    },
  };
}
