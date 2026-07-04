import * as http from "node:http";
import { createRegistryApiRouter } from "../generated/src/generated/http/router";
import { config } from "./config";
import * as q from "./db/generated/registry_sql";
import { pool } from "./db/pool";
import { apis } from "./handlers";
import { ensureBucket, storage } from "./storage";

const router = createRegistryApiRouter(apis);

// Owned binary/read-through route: the RAW spec bytes platform-api feeds to the
// SDK generator. `ref` may be a concrete version, a dist-tag, or `current`.
const SPEC_RE = /^\/apis\/([^/]+)\/versions\/([^/]+)\/spec(?:\?.*)?$/;

// Scalar-style resolvable URL: `/@{namespace}/{apis|schemas}/{id}@{ref}` -> the
// raw doc for that ref (dist-tag or version). This is the public `registryUrl`.
const RESOLVE_RE = /^\/@([^/]+)\/(apis|schemas)\/([^@/]+)@([^/?]+)(?:\?.*)?$/;

/** Resolve a version ref (dist-tag | concrete version | `current`/`latest`). */
async function resolveVersion(
  apiId: string,
  ref: string,
): Promise<Awaited<ReturnType<typeof q.getVersion>>> {
  if (ref === "current") return q.getCurrentVersion(pool, { apiId });
  // A dist-tag (incl. `latest`) shadows a same-named version.
  const tag = await q.getDistTag(pool, { apiId, tag: ref });
  if (tag) return q.getVersion(pool, { apiId, version: tag.version });
  return q.getVersion(pool, { apiId, version: ref });
}

async function serveSpecRow(
  res: http.ServerResponse,
  row: Awaited<ReturnType<typeof q.getVersion>>,
): Promise<void> {
  if (!row) {
    res.writeHead(404, { "content-type": "text/plain" }).end("spec not found");
    return;
  }
  try {
    const bytes = await storage.readToString(row.specObjectKey);
    res.writeHead(200, { "content-type": row.contentType }).end(bytes);
  } catch {
    res.writeHead(500, { "content-type": "text/plain" }).end("spec read error");
  }
}

async function serveSpec(
  res: http.ServerResponse,
  apiId: string,
  ref: string,
): Promise<void> {
  await serveSpecRow(res, await resolveVersion(apiId, ref));
}

async function serveResolved(
  res: http.ServerResponse,
  ns: string,
  collection: string,
  apiId: string,
  ref: string,
): Promise<void> {
  const a = await q.getApi(pool, { id: apiId });
  const wantSchema = collection === "schemas";
  const isSchema = a?.kind === "schema";
  if (!a || a.namespace !== ns || wantSchema !== isSchema) {
    res.writeHead(404, { "content-type": "text/plain" }).end("not found");
    return;
  }
  await serveSpecRow(res, await resolveVersion(apiId, ref));
}

const server = http.createServer((req, res) => {
  const url = req.url ?? "/";
  if (url === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain" }).end("ok");
    return;
  }
  // `decodeURIComponent` throws on malformed percent-encoding — guard the owned
  // routes so a crafted path returns 400 instead of crashing the handler.
  try {
    const m = url.match(SPEC_RE);
    if (m && req.method === "GET") {
      void serveSpec(res, decodeURIComponent(m[1]), decodeURIComponent(m[2]));
      return;
    }
    const r = url.match(RESOLVE_RE);
    if (r && req.method === "GET") {
      void serveResolved(
        res,
        decodeURIComponent(r[1]),
        r[2],
        decodeURIComponent(r[3]),
        decodeURIComponent(r[4]),
      );
      return;
    }
  } catch {
    res.writeHead(400, { "content-type": "text/plain" }).end("bad request");
    return;
  }
  router.dispatch(req, res);
});

await ensureBucket();
server.listen(config.port, () => {
  console.log(`[registry-api] listening on http://localhost:${config.port}`);
});
