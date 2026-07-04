import type { Apis } from "../../../generated/src/generated/models/all/platform-api";
import { registryClient } from "../../clients/registry";
import * as notifQ from "../../db/generated/notifications_sql";
import { pool } from "../../db/pool";
import { toRegistryEntry } from "../../mappers";
import { randomId } from "../../util";
import { invalid } from "../errors";

/** POST /apis — proxy the registration to registry-api + record a notification. */
export const registerApi: Apis["register"] = async (_ctx, input) => {
  const res = await registryClient.register(input);
  if (!res.ok) return invalid(res.message);
  await notifQ.insertNotification(pool, {
    id: randomId("ntf"),
    severity: "success",
    title: `API registered: ${res.entry.name}`,
    body: `${res.entry.ns}/${res.entry.id}`,
    source: "registry",
    apiId: res.entry.id,
  });
  return toRegistryEntry(res.entry, { sdk: 0, docs: 0, mcp: 0 });
};
