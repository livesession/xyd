import { type ChildProcess, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import {
  GenericContainer,
  type StartedTestContainer,
  Wait,
} from "testcontainers";
import type { Plugin } from "vite";

type Env = Record<string, string>;

export interface ApitoolchainViteDevOptions {
  /**
   * The xyd monorepo root (contains `apps/` + `packages/`). Defaults to two
   * levels up from the Vite project root (i.e. `apps/apitoolchain-web` → xyd).
   */
  xydRoot?: string;
}

function freePort(): Promise<number> {
  return new Promise((res, rej) => {
    const srv = createServer();
    srv.on("error", rej);
    srv.listen(0, () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close(() => res(port));
    });
  });
}

/** Run a one-shot command to completion (install / migrate / seed). */
function run(
  cmd: string,
  args: string[],
  cwd: string,
  env?: Env,
): Promise<void> {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: "inherit",
    });
    p.on("error", rej);
    p.on("exit", (code) =>
      code === 0
        ? res()
        : rej(new Error(`${cmd} ${args.join(" ")} → exit ${code}`)),
    );
  });
}

/** Spawn a long-running service, prefixing its logs. */
function spawnService(name: string, cwd: string, env: Env): ChildProcess {
  const child = spawn("bun", ["src/server.ts"], {
    cwd,
    env: { ...process.env, ...env },
  });
  const prefix = `\x1b[2m[${name}]\x1b[0m `;
  child.stdout?.on("data", (d) => process.stdout.write(prefix + d));
  child.stderr?.on("data", (d) => process.stderr.write(prefix + d));
  return child;
}

async function waitHealthz(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`timed out waiting for ${url}`);
}

async function ensureDeps(dir: string): Promise<void> {
  if (!existsSync(resolve(dir, "node_modules"))) {
    await run("bun", ["install"], dir);
  }
}

/**
 * Dev-only Vite plugin: boots the whole apitoolchain backend so running the
 * `apitoolchain-web` dev server alone brings up everything. On dev-server start
 * it:
 *   1. builds the xyd bridge (if its dist is missing),
 *   2. starts Postgres + MinIO in throwaway containers (testcontainers, random
 *      host ports — no clashes with a local Postgres/MinIO),
 *   3. installs / migrates / seeds / starts registry-api + platform-api on free
 *      ports (services `ensureBucket` themselves against MinIO),
 *   4. sets `APITOOLCHAIN_API_URL` so the SSR loaders hit the live platform-api.
 * Tears everything down on shutdown (testcontainers' Ryuk reaps containers).
 * Skipped when `APITOOLCHAIN_API_URL` is already set (point at an external
 * backend) or `APITOOLCHAIN_STACK=off`.
 */
export function apitoolchainViteDev(
  options: ApitoolchainViteDevOptions = {},
): Plugin {
  let pg: StartedPostgreSqlContainer | undefined;
  let minio: StartedTestContainer | undefined;
  let registry: ChildProcess | undefined;
  let platform: ChildProcess | undefined;
  let started = false;

  async function boot(
    apps: string,
    pkgs: string,
    log: (m: string) => void,
  ): Promise<string> {
    // 1. xyd bridge (self-contained dist of the opensdk/openapi surface)
    const bridge = resolve(pkgs, "apitoolchain-xyd-bridge");
    if (!existsSync(resolve(bridge, "dist/index.js"))) {
      log("building xyd bridge…");
      await ensureDeps(bridge);
      await run("bun", ["run", "build"], bridge);
    }

    // 2. containers (random host ports → no conflict with a local Postgres/MinIO)
    log("starting Postgres + MinIO (testcontainers)…");
    [pg, minio] = await Promise.all([
      new PostgreSqlContainer("postgres:16")
        .withDatabase("apitoolchain")
        .withUsername("apitoolchain")
        .withPassword("apitoolchain")
        .start(),
      new GenericContainer("minio/minio:latest")
        .withExposedPorts(9000)
        .withEnvironment({
          MINIO_ROOT_USER: "apitoolchain",
          MINIO_ROOT_PASSWORD: "apitoolchain-secret",
        })
        .withCommand(["server", "/data"])
        .withWaitStrategy(
          Wait.forHttp("/minio/health/live", 9000).forStatusCode(200),
        )
        .start(),
    ]);

    const storage: Env = {
      DATABASE_URL: pg.getConnectionUri(),
      STORAGE_DRIVER: "s3",
      S3_ENDPOINT_URL: `http://${minio.getHost()}:${minio.getMappedPort(9000)}`,
      S3_ACCESS_KEY: "apitoolchain",
      S3_SECRET_KEY: "apitoolchain-secret",
      S3_REGION: "us-east-1",
    };

    // 3. registry-api
    const regDir = resolve(apps, "apitoolchain-registry-api");
    const regPort = await freePort();
    const regUrl = `http://localhost:${regPort}`;
    const regEnv: Env = {
      ...storage,
      STORAGE_BUCKET_SPECS: "apitoolchain-specs",
      PORT: String(regPort),
    };
    await ensureDeps(regDir);
    log("registry-api: migrate + seed…");
    await run("bun", ["db/migrate.ts"], regDir, regEnv);
    await run("bun", ["scripts/seed.ts"], regDir, regEnv);
    registry = spawnService("registry-api", regDir, regEnv);
    await waitHealthz(`${regUrl}/healthz`, 20000);

    // 4. platform-api (gateway → registry)
    const platDir = resolve(apps, "apitoolchain-api");
    const platPort = await freePort();
    const platUrl = `http://localhost:${platPort}`;
    const platEnv: Env = {
      ...storage,
      STORAGE_BUCKET_ARTIFACTS: "apitoolchain-artifacts",
      REGISTRY_API_URL: regUrl,
      PORT: String(platPort),
    };
    await ensureDeps(platDir);
    log("platform-api: migrate + seed…");
    await run("bun", ["db/migrate.ts"], platDir, platEnv);
    await run("bun", ["scripts/seed.ts"], platDir, platEnv);
    platform = spawnService("platform-api", platDir, platEnv);
    await waitHealthz(`${platUrl}/healthz`, 20000);

    return platUrl;
  }

  async function teardown(): Promise<void> {
    registry?.kill("SIGTERM");
    platform?.kill("SIGTERM");
    await Promise.allSettled([pg?.stop(), minio?.stop()]);
  }

  return {
    name: "apitoolchain-dev-vite",
    // Dev only — never during `vite build` / preview / production serve.
    apply: (_config, env) =>
      env.command === "serve" && env.mode !== "production",
    async configureServer(server) {
      if (started) return;
      const logger = server.config.logger;
      const tag = "\x1b[36m[apitoolchain-stack]\x1b[0m";

      if (process.env.APITOOLCHAIN_STACK === "off") {
        logger.info(`${tag} disabled (APITOOLCHAIN_STACK=off)`);
        return;
      }
      if (process.env.APITOOLCHAIN_API_URL) {
        logger.info(
          `${tag} using external backend ${process.env.APITOOLCHAIN_API_URL}`,
        );
        return;
      }
      started = true;

      // Derive the monorepo layout from the Vite project root (the web app),
      // NOT from this file's location — as a `file:` dep it's a copy under
      // node_modules and `import.meta.url` wouldn't point into the repo.
      const xydRoot = options.xydRoot ?? resolve(server.config.root, "../..");
      const apps = resolve(xydRoot, "apps");
      const pkgs = resolve(xydRoot, "packages");

      try {
        const platUrl = await boot(apps, pkgs, (m) =>
          logger.info(`${tag} ${m}`),
        );
        process.env.APITOOLCHAIN_API_URL = platUrl;
        logger.info(`${tag} ready → ${platUrl}`);
      } catch (e) {
        logger.error(`${tag} boot failed: ${(e as Error).message}`);
        await teardown();
        throw e;
      }

      const stop = () => {
        void teardown();
      };
      server.httpServer?.once("close", stop);
      process.once("exit", () => {
        registry?.kill();
        platform?.kill();
      });
      for (const sig of ["SIGINT", "SIGTERM"] as const) {
        process.once(sig, async () => {
          await teardown();
          process.exit(0);
        });
      }
    },
  };
}
