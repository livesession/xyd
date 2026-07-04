import * as rollupQ from "../../db/generated/rollups_sql";
import { pool } from "../../db/pool";

function countMap(rows: { apiId: string; n: number }[]): Map<string, number> {
  return new Map(rows.map((r) => [r.apiId, r.n]));
}

/** The per-API output counts the gateway folds onto each registry entry. */
export async function rollups(): Promise<{
  sdk: Map<string, number>;
  docs: Map<string, number>;
  mcp: Map<string, number>;
}> {
  const [sdk, docs, mcp] = await Promise.all([
    rollupQ.sdkCountsByApi(pool),
    rollupQ.docsCountsByApi(pool),
    rollupQ.mcpCountsByApi(pool),
  ]);
  return { sdk: countMap(sdk), docs: countMap(docs), mcp: countMap(mcp) };
}
