import * as http from "node:http";
import { createPlatformApiRouter } from "../generated/src/generated/http/router";
import { config } from "./config";
import * as sdkQ from "./db/generated/sdk_targets_sql";
import { pool } from "./db/pool";
import {
  apis,
  context,
  docsProjects,
  gitProviders,
  mcpServers,
  notifications,
  overview,
  repoConnections,
  sdks,
  sdkTargets,
  usage,
} from "./handlers";
import { ensureBucket, storage } from "./storage";

const router = createPlatformApiRouter(
  apis,
  sdks,
  sdkTargets,
  docsProjects,
  mcpServers,
  notifications,
  overview,
  usage,
  context,
  gitProviders,
  repoConnections,
);

// Owned binary route: download the generated SDK zip (the future "Download SDK"
// button). Streamed through the service so it works for every storage driver.
const ARTIFACT_RE = /^\/sdk-targets\/([^/]+)\/artifact(?:\?.*)?$/;

async function serveArtifact(
  res: http.ServerResponse,
  targetId: string,
): Promise<void> {
  const row = await sdkQ.getSdkTarget(pool, { id: targetId });
  if (!row?.artifactRef) {
    res
      .writeHead(404, { "content-type": "text/plain" })
      .end("artifact not found");
    return;
  }
  try {
    const buf = await storage.readToBuffer(row.artifactRef);
    res
      .writeHead(200, {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="${targetId}.zip"`,
      })
      .end(buf);
  } catch {
    res
      .writeHead(500, { "content-type": "text/plain" })
      .end("artifact read error");
  }
}

const server = http.createServer((req, res) => {
  const url = req.url ?? "/";
  if (url === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain" }).end("ok");
    return;
  }
  const m = url.match(ARTIFACT_RE);
  if (m && req.method === "GET") {
    void serveArtifact(res, decodeURIComponent(m[1]));
    return;
  }
  router.dispatch(req, res);
});

await ensureBucket();
server.listen(config.port, () => {
  console.log(`[platform-api] listening on http://localhost:${config.port}`);
});
