import { mcpUrlToReferences } from "@xyd-js/mcp-uniform";
import { registryClient } from "../../../clients/registry";
import * as jobQ from "../../../dbnode/jobs";
import * as outQ from "../../../dbnode/outputs";
import { pool } from "../../../dbnode/pool";
import { currentVersion, randomId } from "../../../util";
import type { McpServers } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { notFound } from "../__kit/errors";
import { toMcpServer } from "../__kit/mappers";

/**
 * POST /mcp-servers — insert the row (+ queued `mcp.start` job). `toolsCount` is
 * wired now via `mcpUrlToReferences` when a reachable URL is given; spawning a
 * long-lived MCP process is deferred.
 */
export const createMcpServer: McpServers["create"] = async (ctx, input) => {
  const auth = await requireAuth(ctx);
  const core = await registryClient.getApi(input.apiId);
  if (!core) return notFound(`api ${input.apiId} not found`);

  let toolsCount = 0;
  let status = "building";
  if (input.url) {
    try {
      const refs = await mcpUrlToReferences(input.url);
      toolsCount = refs.length;
      status = "ready";
    } catch {
      // unreachable now → stays 'building' (worker will start it later)
    }
  }
  const id = randomId("mcp");
  const row = await outQ.insertMcpServer(pool, {
    id,
    apiId: input.apiId,
    name: input.name,
    sourceSpec: `${core.ns}/${core.id}@${currentVersion(core)}`,
    toolsCount,
    transport: input.transport ?? "http",
    status,
    url: input.url ?? null,
    projectId: auth.projectId,
  });
  await jobQ.insertJob(pool, {
    id: randomId("job"),
    kind: "mcp.start",
    targetRef: id,
    status: status === "ready" ? "done" : "queued",
    payload: { apiId: input.apiId },
  });
  return toMcpServer(row as NonNullable<typeof row>);
};
