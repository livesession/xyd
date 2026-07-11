import {
  type ChildProcess,
  execFileSync,
  spawn,
  spawnSync,
} from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
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
import { DEV_EMAIL, DEV_PASSWORD, type RegistriesInfo } from "./apply-profile";
import { loadProfiles, profileSummary } from "./profiles";
import { applyOrRestore, clearSnapshots } from "./snapshot";

type Env = Record<string, string>;

// A stable label stamped on every container this plugin starts, so a fresh
// dev-server boot can reap any containers a previous (crashed / hard-killed)
// run leaked instead of piling up a new Postgres/MinIO/Gitea stack each time.
const DEV_LABEL = "com.apitoolchain.dev";
const DEV_LABELS = { [DEV_LABEL]: "1" };

/**
 * Load dev-stack config from `packages/apitoolchain-dev/{.env.example,.env}` into
 * `process.env` — precedence: real env > `.env` > `.env.example`. Lets the seeded
 * creds + local-registry ports be configured without editing source (and gives
 * the registries STABLE ports so a published SDK's URL survives a restart).
 */
function loadDevEnv(pkgs: string): void {
  const parse = (file: string): Record<string, string> => {
    if (!existsSync(file)) return {};
    const out: Record<string, string> = {};
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
    }
    return out;
  };
  const dir = resolve(pkgs, "apitoolchain-dev");
  const defaults = parse(resolve(dir, ".env.example"));
  const overrides = parse(resolve(dir, ".env"));
  for (const k of new Set([
    ...Object.keys(defaults),
    ...Object.keys(overrides),
  ])) {
    if (process.env[k] === undefined) {
      process.env[k] = overrides[k] ?? defaults[k];
    }
  }
}

const emptyRegistries = (): RegistriesInfo => ({
  nugetFeed: "",
  mavenFeed: "",
  goproxyFeed: "",
});

/**
 * Start the local package registries the publish feature targets: verdaccio
 * (npm), pypiserver (PyPI), gemstash (RubyGems) as throwaway testcontainers, and
 * file-feed dirs for nuget/maven/go. Each daemon is best-effort — a missing
 * image or slow boot logs a warning and leaves that ecosystem unavailable, never
 * blocking the core stack. Reuses the publish-e2e verdaccio config.
 */
async function startLocalRegistries(
  pkgs: string,
  log: (m: string) => void,
): Promise<{ info: RegistriesInfo; containers: StartedTestContainer[] }> {
  const feeds = mkdtempSync(join(tmpdir(), "apitoolchain-feeds-"));
  const nugetFeed = join(feeds, "nuget");
  const mavenFeed = join(feeds, "maven");
  const goproxyFeed = join(feeds, "goproxy");
  for (const d of [nugetFeed, mavenFeed, goproxyFeed])
    mkdirSync(d, { recursive: true });

  const verdaccioCfg = resolve(
    pkgs,
    "xyd-opensdk-ci/e2e/publish/verdaccio-config.yaml",
  );
  // FIXED host ports (env-overridable) so a published SDK's registry URL stays
  // valid across dev-server restarts + snapshot restores — random ports would go
  // stale and publishes would hang against a dead port.
  const npmPort = Number(process.env.ATC_VERDACCIO_PORT || 4873);
  const pypiPort = Number(process.env.ATC_PYPI_PORT || 8081);
  const gemsPort = Number(process.env.ATC_GEMS_PORT || 9292);
  const started: StartedTestContainer[] = [];
  const tryStart = async (
    name: string,
    build: () => Promise<StartedTestContainer>,
  ): Promise<StartedTestContainer | undefined> => {
    try {
      const c = await build();
      started.push(c);
      log(`  ${name} ready`);
      return c;
    } catch (e) {
      log(`! ${name} did not start (${(e as Error).message}) — off`);
      return undefined;
    }
  };

  const [verdaccio, pypi, gems] = await Promise.all([
    tryStart("verdaccio", () =>
      new GenericContainer("verdaccio/verdaccio:6")
        .withExposedPorts({ container: 4873, host: npmPort })
        .withCopyFilesToContainer([
          { source: verdaccioCfg, target: "/verdaccio/conf/config.yaml" },
        ])
        .withLabels(DEV_LABELS)
        .withWaitStrategy(Wait.forHttp("/-/ping", 4873).forStatusCode(200))
        .start(),
    ),
    tryStart("pypiserver", () =>
      new GenericContainer("pypiserver/pypiserver:latest")
        .withExposedPorts({ container: 8080, host: pypiPort })
        .withCommand([
          "run",
          "-P",
          ".",
          "-a",
          ".",
          "--overwrite",
          "-p",
          "8080",
          "/data/packages",
        ])
        .withLabels(DEV_LABELS)
        .withWaitStrategy(Wait.forHttp("/", 8080).forStatusCode(200))
        .start(),
    ),
    tryStart("gemstash", () =>
      new GenericContainer("ruby:3.3")
        .withExposedPorts({ container: 9292, host: gemsPort })
        .withCommand([
          "sh",
          "-c",
          "gem install gemstash --no-document && gemstash start --no-daemonize",
        ])
        .withLabels(DEV_LABELS)
        .withStartupTimeout(180000)
        .withWaitStrategy(Wait.forListeningPorts())
        .start(),
    ),
  ]);

  const at = (
    c: StartedTestContainer | undefined,
    port: number,
  ): string | undefined =>
    c ? `http://localhost:${c.getMappedPort(port)}` : undefined;

  const info: RegistriesInfo = {
    npmUrl: at(verdaccio, 4873),
    pypiUrl: at(pypi, 8080),
    gemsUrl: gems ? `${at(gems, 9292)}/private` : undefined,
    nugetFeed,
    mavenFeed,
    goproxyFeed,
  };
  log(
    `local registries → npm ${info.npmUrl ?? "off"} · pypi ${info.pypiUrl ?? "off"} · gems ${info.gemsUrl ?? "off"}`,
  );
  return { info, containers: started };
}

// Force-remove any containers left over from a previous run (identified by the
// dev label). testcontainers has no Ryuk reaper here, so without this each
// restart leaks a new stack. Best-effort: never let a docker hiccup block boot.
function reapStaleContainers(log: (m: string) => void): void {
  try {
    const ids = execFileSync(
      "docker",
      ["ps", "-aq", "--filter", `label=${DEV_LABEL}`],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    )
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return;
    log(`reaping ${ids.length} stale container(s) from a previous run…`);
    execFileSync("docker", ["rm", "-f", ...ids], {
      stdio: ["ignore", "ignore", "ignore"],
    });
  } catch {
    // docker missing / daemon down / nothing to reap — ignore.
  }
}

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
  // `--watch` so backend edits (handlers, gen/*, mappers) hot-reload the running
  // service — otherwise a code fix looks "not applied" until the whole dev stack
  // is restarted.
  const child = spawn("bun", ["--watch", "api/main.ts"], {
    cwd,
    env: { ...process.env, ...env },
  });
  const prefix = `\x1b[2m[${name}]\x1b[0m `;
  child.stdout?.on("data", (d) => process.stdout.write(prefix + d));
  child.stderr?.on("data", (d) => process.stderr.write(prefix + d));
  return child;
}

/** Spawn the Go git-provider service (`go run`), prefixing its logs. */
function spawnGo(name: string, cwd: string, env: Env): ChildProcess {
  const child = spawn("go", ["run", "./cmd/gitproviderd"], {
    cwd,
    env: { ...process.env, GOTOOLCHAIN: "auto", ...env },
  });
  const prefix = `\x1b[2m[${name}]\x1b[0m `;
  child.stdout?.on("data", (d) => process.stdout.write(prefix + d));
  child.stderr?.on("data", (d) => process.stderr.write(prefix + d));
  return child;
}

/** Is a Go toolchain available? (git-provider dev is skipped without it.) */
function hasGo(): boolean {
  const r = spawnSync("go", ["version"], { stdio: "ignore" });
  return !r.error && r.status === 0;
}

interface GiteaSeed {
  url: string;
  token: string;
  user: string;
  repo: string;
}

/**
 * Seed a fresh Gitea container: create an admin user, mint a raw access token,
 * and create one auto-initialised demo repo. Runs the Gitea CLI as the `git`
 * user (Gitea refuses to run as root). Returns everything the platform seed
 * needs to register a local git provider + demo connection.
 */
async function seedGitea(container: StartedTestContainer): Promise<GiteaSeed> {
  const user = "apitoolchain";
  const pass = "apitoolchain-secret";
  const name = "livesession-sdk";
  const url = `http://${container.getHost()}:${container.getMappedPort(3000)}`;

  // Seed via the Docker CLI (`docker exec -u git`) rather than testcontainers'
  // `.exec()` — the latter's output stream can hang in some Docker setups, and
  // Gitea refuses to run its admin CLI as root.
  const id = container.getId();
  const dexec = (args: string[]): string =>
    execFileSync("docker", ["exec", "-u", "git", id, ...args], {
      encoding: "utf8",
    });

  dexec([
    "gitea",
    "admin",
    "user",
    "create",
    "--admin",
    "--username",
    user,
    "--password",
    pass,
    "--email",
    "dev@apitoolchain.local",
    "--must-change-password=false",
  ]);
  const raw = dexec([
    "gitea",
    "admin",
    "user",
    "generate-access-token",
    "--username",
    user,
    "--raw",
    "--scopes",
    "all",
  ]);
  const token = (raw.match(/[0-9a-f]{40}/) ?? [""])[0];
  if (!token) {
    throw new Error("gitea: could not read access token from CLI output");
  }

  const created = await fetch(`${url}/api/v1/user/repos`, {
    method: "POST",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      auto_init: true,
      private: false,
      default_branch: "main",
    }),
  });
  if (!created.ok && created.status !== 409) {
    throw new Error(`gitea: create repo → HTTP ${created.status}`);
  }

  return { url, token, user, repo: `${user}/${name}` };
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
 *   1. starts Postgres + MinIO in throwaway containers (testcontainers, random
 *      host ports — no clashes with a local Postgres/MinIO),
 *   2. installs / migrates / seeds / starts registry-api + platform-api on free
 *      ports (services `ensureBucket` themselves against MinIO),
 *   3. sets `APITOOLCHAIN_API_URL` so the SSR loaders hit the live platform-api.
 * Tears everything down on shutdown (testcontainers' Ryuk reaps containers).
 * Skipped when `APITOOLCHAIN_API_URL` is already set (point at an external
 * backend) or `APITOOLCHAIN_STACK=off`.
 */
export function apitoolchainViteDev(
  options: ApitoolchainViteDevOptions = {},
): Plugin {
  let pg: StartedPostgreSqlContainer | undefined;
  let minio: StartedTestContainer | undefined;
  let gitea: StartedTestContainer | undefined;
  let registry: ChildProcess | undefined;
  let platform: ChildProcess | undefined;
  let gitprovider: ChildProcess | undefined;
  let registryContainers: StartedTestContainer[] = [];
  let started = false;
  // Set once the stack is up — the dev profile picker (middleware + overlay)
  // needs the gateway URL + the Postgres container id to reset/seed data, and
  // the service URLs for the "active services" menu.
  let stack: {
    platUrl: string;
    pgId: string;
    apps: string;
    services: { name: string; url: string }[];
    registries: RegistriesInfo;
    /** Re-run registry + platform migrations (forward-only, idempotent) — used
     * to heal schema drift after a snapshot restore loads an older dump. */
    migrate: () => Promise<void>;
  } | null = null;

  async function boot(
    apps: string,
    pkgs: string,
    log: (m: string) => void,
  ): Promise<string> {
    // 1. containers (random host ports → no conflict with a local Postgres/MinIO)
    // Gitea comes up too when a Go toolchain is present, so SDK/spec → repo sync
    // can be tested fully locally with no external tokens.
    const gitEnabled = process.env.APITOOLCHAIN_GIT !== "off" && hasGo();
    if (process.env.APITOOLCHAIN_GIT !== "off" && !gitEnabled) {
      log("git provider disabled (no `go` toolchain on PATH)");
    }
    log(
      gitEnabled
        ? "starting Postgres + MinIO + Gitea (testcontainers)…"
        : "starting Postgres + MinIO (testcontainers)…",
    );
    // Clean up any leaked containers from a previous run before starting a new
    // stack, so restarts don't pile up Postgres/MinIO/Gitea instances.
    reapStaleContainers(log);
    // MinIO gets a FIXED host port (env-overridable) so it survives the
    // container .restart() a snapshot restore performs. A random port would
    // change on restart, leaving the already-spawned registry-api/platform-api's
    // baked S3_ENDPOINT_URL pointing at a dead port → ECONNREFUSED on every spec
    // write (surfaces as "could not store spec bytes" → 422 on every register).
    const minioPort = Number(process.env.ATC_MINIO_PORT || 9000);
    const containers = await Promise.all([
      new PostgreSqlContainer("postgres:16")
        .withDatabase("apitoolchain")
        .withUsername("apitoolchain")
        .withPassword("apitoolchain")
        .withLabels(DEV_LABELS)
        .start(),
      new GenericContainer("minio/minio:latest")
        .withExposedPorts({ container: 9000, host: minioPort })
        .withEnvironment({
          MINIO_ROOT_USER: "apitoolchain",
          MINIO_ROOT_PASSWORD: "apitoolchain-secret",
        })
        .withCommand(["server", "/data"])
        .withLabels(DEV_LABELS)
        .withWaitStrategy(
          Wait.forHttp("/minio/health/live", 9000).forStatusCode(200),
        )
        .start(),
      gitEnabled
        ? new GenericContainer("gitea/gitea:1.22")
            .withExposedPorts(3000)
            .withEnvironment({
              GITEA__database__DB_TYPE: "sqlite3",
              GITEA__security__INSTALL_LOCK: "true",
              GITEA__log__LEVEL: "warn",
            })
            // So Gitea (in-container) can POST release-PR merge webhooks back to
            // the host-port gateway at http://host.docker.internal:<platPort>.
            .withExtraHosts([
              { host: "host.docker.internal", ipAddress: "host-gateway" },
            ])
            .withLabels(DEV_LABELS)
            .withWaitStrategy(
              Wait.forHttp("/api/v1/version", 3000).forStatusCode(200),
            )
            .start()
        : Promise.resolve(undefined),
    ]);
    pg = containers[0];
    minio = containers[1];
    gitea = containers[2] as StartedTestContainer | undefined;

    // Local package registries (best-effort). Kicked off here so they boot in
    // parallel with the registry-api/platform below; awaited before `stack`.
    // Off with APITOOLCHAIN_REGISTRIES=off.
    const regsEnabled = process.env.APITOOLCHAIN_REGISTRIES !== "off";
    if (regsEnabled)
      log(
        "starting local package registries: verdaccio (npm) + pypiserver + gemstash (first run pulls the images)…",
      );
    else log("local package registries disabled (APITOOLCHAIN_REGISTRIES=off)");
    const registriesPromise = regsEnabled
      ? startLocalRegistries(pkgs, log)
      : Promise.resolve({
          info: emptyRegistries(),
          containers: [] as StartedTestContainer[],
        });

    const storage: Env = {
      DATABASE_URL: pg.getConnectionUri(),
      STORAGE_DRIVER: "s3",
      S3_ENDPOINT_URL: `http://${minio.getHost()}:${minio.getMappedPort(9000)}`,
      S3_ACCESS_KEY: "apitoolchain",
      S3_SECRET_KEY: "apitoolchain-secret",
      S3_REGION: "us-east-1",
    };

    // 2. registry-api
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
    await run("bun", ["db/scripts/migrate.ts"], regDir, regEnv);
    await run("bun", ["db/scripts/seed.ts"], regDir, regEnv);
    registry = spawnService("registry-api", regDir, regEnv);
    await waitHealthz(`${regUrl}/healthz`, 20000);

    // 3. platform-api (gateway → registry)
    const platDir = resolve(apps, "apitoolchain-api");
    const platPort = await freePort();
    const platUrl = `http://localhost:${platPort}`;
    const platEnv: Env = {
      ...storage,
      STORAGE_BUCKET_ARTIFACTS: "apitoolchain-artifacts",
      REGISTRY_API_URL: regUrl,
      PORT: String(platPort),
      // The origin git providers POST release-PR webhooks to. In-container Gitea
      // reaches the host-port gateway via host.docker.internal (mapped above).
      PLATFORM_PUBLIC_URL: `http://host.docker.internal:${platPort}`,
      // PLATFORM_REGISTRY_HOST is deliberately unset in dev: sdk.json's `spec`
      // is then a clean host-less registry ref (`apis/<ns>/<api>@<ver>`) instead
      // of an ephemeral localhost:port URL. Prod sets it to registry.<domain>.
    };

    // 4b. git provider service (Go) + Gitea seed — optional. The platform seed
    // reads GITEA_* to register a local provider; the gateway calls gitproviderd
    // at GITPROVIDER_API_URL. Started before the platform migrate/seed/boot so
    // those env vars are in scope.
    let giteaWebUrl: string | undefined;
    let gpWebUrl: string | undefined;
    if (gitEnabled && gitea) {
      log("gitea: seeding admin + token + demo repo…");
      const seed = await seedGitea(gitea);
      const gpDir = resolve(apps, "apitoolchain-gitprovider");
      const gpPort = await freePort();
      const gpUrl = `http://localhost:${gpPort}`;
      log("gitproviderd: go run (first run compiles the module)…");
      gitprovider = spawnGo("gitproviderd", gpDir, { PORT: String(gpPort) });
      await waitHealthz(`${gpUrl}/healthz`, 90000);
      Object.assign(platEnv, {
        GITPROVIDER_API_URL: gpUrl,
        GITEA_URL: seed.url,
        GITEA_TOKEN: seed.token,
        GITEA_USER: seed.user,
        GITEA_REPO: seed.repo,
      });
      giteaWebUrl = seed.url;
      gpWebUrl = gpUrl;
      log(`git provider ready → ${gpUrl} (gitea ${seed.url})`);
    }

    await ensureDeps(platDir);
    log("platform-api: migrate + seed…");
    await run("bun", ["db/scripts/migrate.ts"], platDir, platEnv);
    await run("bun", ["db/scripts/seed.ts"], platDir, platEnv);
    platform = spawnService("platform-api", platDir, platEnv);
    await waitHealthz(`${platUrl}/healthz`, 20000);

    const { info: registries, containers: regCs } = await registriesPromise;
    registryContainers = regCs;

    const services: { name: string; url: string }[] = [
      { name: "platform-api", url: platUrl },
      { name: "registry-api", url: regUrl },
      { name: "minio (S3)", url: storage.S3_ENDPOINT_URL },
      { name: "postgres", url: pg.getConnectionUri() },
    ];
    if (giteaWebUrl) services.push({ name: "gitea", url: giteaWebUrl });
    if (gpWebUrl) services.push({ name: "gitproviderd", url: gpWebUrl });
    if (registries.npmUrl)
      services.push({ name: "verdaccio (npm)", url: registries.npmUrl });
    if (registries.pypiUrl)
      services.push({ name: "pypiserver", url: registries.pypiUrl });
    if (registries.gemsUrl)
      services.push({ name: "gemstash", url: registries.gemsUrl });

    // Re-runnable migrate for both services (the runner is a forward-only
    // ledger, so re-running only applies what's missing). A snapshot restore
    // reloads an OLD dump (schema + ledger); running this afterwards upgrades it
    // to the current schema so restored profiles never 500 on new columns.
    const migrate = async (): Promise<void> => {
      await run("bun", ["db/scripts/migrate.ts"], regDir, regEnv);
      await run("bun", ["db/scripts/migrate.ts"], platDir, platEnv);
    };

    stack = {
      platUrl,
      pgId: pg.getId(),
      apps,
      services,
      registries,
      migrate,
    };
    return platUrl;
  }

  async function teardown(): Promise<void> {
    registry?.kill("SIGTERM");
    platform?.kill("SIGTERM");
    gitprovider?.kill("SIGTERM");
    await Promise.allSettled([
      pg?.stop(),
      minio?.stop(),
      gitea?.stop(),
      ...registryContainers.map((c) => c.stop()),
    ]);
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
      // Config/creds from .env(.example) → process.env before anything reads them.
      loadDevEnv(pkgs);
      const profiles = loadProfiles(
        resolve(pkgs, "apitoolchain-dev", "profiles"),
      );
      const snapshotsDir = resolve(pkgs, "apitoolchain-dev", ".snapshots");
      logger.info(`${tag} ${profiles.length} dev profile(s) available`);

      // Dev profile picker API. Registered before boot so the picker can list
      // profiles immediately; applying waits until the stack is up.
      // Serialize applies — two concurrent profile applies would interleave DB
      // resets + writes (and one's in-flight SDK gen would fail against the
      // other's wipe). A second request while one runs gets a clear 409.
      let applyInFlight = false;
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/__atc-dev/")) return next();
        if (req.method === "GET" && url.startsWith("/__atc-dev/info")) {
          res.setHeader("content-type", "application/json");
          res.setHeader("cache-control", "no-store");
          res.end(JSON.stringify({ services: stack?.services ?? [] }));
          return;
        }
        if (
          req.method === "POST" &&
          url.startsWith("/__atc-dev/profiles/apply")
        ) {
          let raw = "";
          req.on("data", (c) => {
            raw += c;
          });
          req.on("end", async () => {
            res.setHeader("content-type", "application/json");
            let owned = false;
            try {
              const body = JSON.parse(raw || "{}") as {
                id?: string;
                rebuild?: boolean;
              };
              const profile = profiles.find((p) => p.id === body.id);
              if (!profile) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: "unknown profile" }));
                return;
              }
              if (!stack) {
                res.statusCode = 503;
                res.end(
                  JSON.stringify({ error: "stack still booting — try again" }),
                );
                return;
              }
              if (applyInFlight) {
                res.statusCode = 409;
                res.end(
                  JSON.stringify({
                    error:
                      "an apply is already running — wait for it to finish",
                  }),
                );
                return;
              }
              applyInFlight = true;
              owned = true;
              const log = (m: string) => logger.info(`${tag} ${m}`);
              await applyOrRestore(
                profile,
                {
                  platUrl: stack.platUrl,
                  pgId: stack.pgId,
                  apps: stack.apps,
                  registries: stack.registries,
                  log,
                },
                {
                  pgId: stack.pgId,
                  minioId: minio?.getId() ?? "",
                  dir: snapshotsDir,
                  log,
                  restartMinio: async () => {
                    if (minio) await minio.restart();
                  },
                  migrate: stack.migrate,
                },
                body.rebuild === true,
              );
              // Hand the overlay the dev owner creds so it can establish the
              // browser session (apply only seeds data server-side).
              res.end(
                JSON.stringify({
                  ok: true,
                  login: { email: DEV_EMAIL, password: DEV_PASSWORD },
                  // The overlay reseeds the web app's client-side namespace
                  // store from this, so each profile owns its namespaces.
                  namespaces: profile.namespaces,
                }),
              );
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: (e as Error).message }));
            } finally {
              if (owned) applyInFlight = false;
            }
          });
          return;
        }
        if (
          req.method === "POST" &&
          url.startsWith("/__atc-dev/snapshots/clear")
        ) {
          res.setHeader("content-type", "application/json");
          try {
            clearSnapshots(snapshotsDir);
            res.end(JSON.stringify({ ok: true }));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: (e as Error).message }));
          }
          return;
        }
        if (req.method === "GET" && url.startsWith("/__atc-dev/profiles")) {
          res.setHeader("content-type", "application/json");
          res.end(
            JSON.stringify(
              profiles.map((p) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                summary: profileSummary(p),
                namespaces: p.namespaces,
              })),
            ),
          );
          return;
        }
        next();
      });

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

      // NB: deliberately NOT tearing down on `server.httpServer` "close" — Vite
      // fires that on every dev-server *restart* (a config-adjacent edit, an env
      // change, a plugin-requested restart), not just on shutdown. Killing the
      // gateway + containers there is the bug behind "TypeError: fetch failed /
      // ECONNREFUSED in getMe after editing apitoolchain-web": the stack dies on
      // restart, then the re-instantiated plugin sees APITOOLCHAIN_API_URL already
      // set and skips re-booting, so the web keeps hitting a dead backend until a
      // manual restart. The stack now PERSISTS across restarts (the running
      // gateway is simply reused) and is reaped only on real process exit (below),
      // by testcontainers' Ryuk, and by reapStaleContainers() on the next cold boot.
      process.once("exit", () => {
        registry?.kill();
        platform?.kill();
        gitprovider?.kill();
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
