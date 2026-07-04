import { mcpUrlToReferences } from "@apitoolchain/xyd-bridge";
import type { McpServers } from "../../../generated/src/generated/models/all/platform-api";
import { registryClient } from "../../clients/registry";
import * as jobQ from "../../db/generated/jobs_sql";
import * as outQ from "../../db/generated/outputs_sql";
import { pool } from "../../db/pool";
import { toMcpServer } from "../../mappers";
import { currentVersion, randomId } from "../../util";
import { notFound } from "../errors";

/**
 * POST /mcp-servers — insert the row (+ queued `mcp.start` job). `toolsCount` is
 * wired now via `mcpUrlToReferences` when a reachable URL is given; spawning a
 * long-lived MCP process is deferred.
 */
export const createMcpServer: McpServers["create"] = async (_ctx, input) => {
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
