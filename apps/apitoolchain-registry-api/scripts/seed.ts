import { readFileSync } from "node:fs";
import { pool } from "../src/db/pool";
import { registerApi } from "../src/handlers/apis/register_api";
import { ensureBucket } from "../src/storage";

// The default API: the real LiveSession OpenAPI spec, vendored alongside this
// script and registered through the actual ingest path so a spec object lands
// in object storage and the dashboard isn't empty on boot.
const spec = readFileSync(
  new URL("./livesession-openapi.yaml", import.meta.url),
  "utf8",
);

await ensureBucket();
const result = await registerApi(undefined, {
  name: "LiveSession API",
  ns: "livesession",
  specText: spec,
  source: "github.com/livesession/livesession-openapi",
});
if ("statusCode" in result) {
  console.error("[seed] register failed:", result.message);
  process.exit(1);
}
console.log(
  `[seed] registered ${result.id} (${result.versions.length} version) — ok`,
);
await pool.end();
