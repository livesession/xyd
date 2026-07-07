import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { type ApplyCtx, applyProfile } from "./apply-profile";
import type { DevProfile } from "./profiles";

/**
 * Profile snapshots. Applying a profile the first time runs the full (slow)
 * seed — register specs, generate SDKs, create + connect Gitea repos — then
 * captures the resulting state: a `pg_dump` of Postgres and a copy of MinIO's
 * object store. Every later apply of that profile just RESTORES the snapshot
 * (load the SQL + drop MinIO's data back + restart it), so it comes up in
 * seconds instead of minutes.
 *
 * Snapshots live in a gitignored cache dir (they're machine-local container
 * data). Restore is best-effort: any failure falls back to a full rebuild.
 */

export interface SnapshotCtx {
  pgId: string;
  minioId: string;
  /** Snapshot cache dir (per-profile subdirs live under here). */
  dir: string;
  log: (m: string) => void;
  restartMinio: () => Promise<void>;
  /** Re-apply migrations after a restore so an older snapshot's schema is
   * upgraded to what the running code expects (forward-only, idempotent). */
  migrate?: () => Promise<void>;
}

const PG = ["-U", "apitoolchain", "-d", "apitoolchain"];
const PG_ENV = { ...process.env, PGPASSWORD: "apitoolchain" };
const MAX = 256 * 1024 * 1024;
const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

export function hasSnapshot(id: string, dir: string): boolean {
  return existsSync(resolve(dir, id, "db.sql"));
}

export function clearSnapshots(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

/** Wait until no SDK target is still generating (so the snapshot captures the
 * finished artifacts). Best-effort, capped. */
async function waitGenerationDone(
  pgId: string,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    let building = "";
    try {
      building = execFileSync(
        "docker",
        [
          "exec",
          pgId,
          "psql",
          ...PG,
          "-tAc",
          "SELECT count(*) FROM sdk_targets WHERE status = 'building'",
        ],
        { env: PG_ENV, encoding: "utf8" },
      ).trim();
    } catch {
      return; // table missing / psql hiccup — nothing to wait for
    }
    if (building === "" || building === "0") return;
    await sleep(1000);
  }
}

/** Capture the current DB + object store as this profile's snapshot. */
export async function buildSnapshot(
  id: string,
  ctx: SnapshotCtx,
): Promise<void> {
  await waitGenerationDone(ctx.pgId, 180000);
  const out = resolve(ctx.dir, id);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  // A PLAIN dump (no --clean): pure CREATE + COPY + constraints. Restore wipes
  // the schema first, so the dump must NOT carry per-object DROPs — those drop
  // one-by-one WITHOUT cascade and fail on FK deps against the live DB.
  const dump = execFileSync("docker", ["exec", ctx.pgId, "pg_dump", ...PG], {
    env: PG_ENV,
    maxBuffer: MAX,
  });
  writeFileSync(resolve(out, "db.sql"), dump);

  // `docker cp <id>:/data <out>/` creates <out>/data (no tar needed in-image).
  execFileSync("docker", ["cp", `${ctx.minioId}:/data`, `${out}/`]);
}

// Drop every table in the public schema with CASCADE — clears the migrated +
// seeded DB (and all FK deps) so the dump's CREATE/COPY load into a clean slate.
// Table ownership (not schema ownership) is enough: the service user created them.
const RESET_PUBLIC =
  "DO $$ DECLARE r RECORD; BEGIN " +
  "FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP " +
  "EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE'; " +
  "END LOOP; END $$;";

/** Restore a profile's snapshot into the running stack (fast path). */
export async function restoreSnapshot(
  id: string,
  ctx: SnapshotCtx,
): Promise<void> {
  const out = resolve(ctx.dir, id);
  // Wipe + load in ONE transaction (--single-transaction + ON_ERROR_STOP): on
  // ANY error the wipe rolls back too, so a failed restore leaves the
  // migrated+seeded DB intact for the fallback rebuild — never a wiped, empty
  // schema. An older --clean snapshot self-heals this way: its non-cascading
  // per-object DROPs abort the txn → rollback → rebuild → re-snapshot (plain).
  const input = Buffer.concat([
    Buffer.from(`${RESET_PUBLIC}\n`, "utf8"),
    readFileSync(resolve(out, "db.sql")),
  ]);
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      ctx.pgId,
      "psql",
      ...PG,
      "--single-transaction",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    { input, env: PG_ENV, maxBuffer: MAX },
  );
  // Drop the snapshot's object store back over MinIO's, then restart it so the
  // single-node drive re-reads /data.
  execFileSync("docker", ["cp", `${out}/data/.`, `${ctx.minioId}:/data`]);
  await ctx.restartMinio();
}

/** Restore from snapshot if one exists, else run the full apply and snapshot
 * it for next time. `rebuild` forces the slow path + a fresh snapshot. */
export async function applyOrRestore(
  profile: DevProfile,
  applyCtx: ApplyCtx,
  snapCtx: SnapshotCtx,
  rebuild: boolean,
): Promise<void> {
  // Trivial profiles (scratch) are already fast — no snapshot needed. Publish
  // profiles also skip snapshotting: verdaccio's storage is NOT part of the
  // snapshot, so a restore would show a "published" SDK that isn't actually in
  // the (ephemeral) registry — and a snapshot taken mid-publish freezes
  // `building` forever. Always re-apply so the publish really happens.
  const trivial = profile.apis.length === 0 && profile.sdks.length === 0;
  if (trivial || profile.publish) {
    await applyProfile(profile, applyCtx);
    return;
  }
  if (!rebuild && hasSnapshot(profile.id, snapCtx.dir)) {
    try {
      snapCtx.log(`restoring snapshot for "${profile.id}"…`);
      await restoreSnapshot(profile.id, snapCtx);
      // The dump carries the schema + migration ledger AS OF snapshot time —
      // upgrade it to the current schema so a snapshot built before a later
      // migration doesn't 500 on the new tables/columns (forward-only migrate
      // applies only what the snapshot's ledger is missing).
      if (snapCtx.migrate) {
        snapCtx.log("upgrading restored schema to current…");
        await snapCtx.migrate();
      }
      snapCtx.log("snapshot restored — up in seconds.");
      return;
    } catch (e) {
      snapCtx.log(
        `snapshot restore failed (${(e as Error).message}); rebuilding…`,
      );
    }
  }
  // Rebuild path. A partial restore above may have left an older schema behind,
  // so bring it to current before seeding — the gateway writes new columns and
  // would otherwise 500 (a no-op when the schema is already up to date).
  if (snapCtx.migrate) {
    try {
      await snapCtx.migrate();
    } catch (e) {
      snapCtx.log(
        `schema upgrade before rebuild failed (${(e as Error).message}).`,
      );
    }
  }
  snapCtx.log(`building "${profile.id}" (first run; will snapshot it)…`);
  await applyProfile(profile, applyCtx);
  try {
    snapCtx.log(`snapshotting "${profile.id}"…`);
    await buildSnapshot(profile.id, snapCtx);
    snapCtx.log("snapshot saved — this profile now loads instantly.");
  } catch (e) {
    snapCtx.log(
      `snapshot build failed (${(e as Error).message}); profile still applied.`,
    );
  }
}
