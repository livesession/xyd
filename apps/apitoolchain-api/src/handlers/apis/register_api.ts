import type { Apis } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import { registryClient } from "../../clients/registry";
import * as notifQ from "../../db/generated/notifications_sql";
import { pool } from "../../db/pool";
import { enqueueReleasesForApi } from "../../gen/release";
import { toRegistryEntry } from "../../mappers";
import { currentVersion, randomId } from "../../util";
import { invalid } from "../errors";

/** POST /apis — proxy the registration to registry-api + record a notification. */
export const registerApi: Apis["register"] = async (ctx, input) => {
  const auth = await requireAuth(ctx);
  const res = await registryClient.register(input, auth.projectId);
  if (!res.ok) return invalid(res.message);
  await notifQ.insertNotification(pool, {
    id: randomId("ntf"),
    severity: "success",
    title: `API registered: ${res.entry.name}`,
    body: `${res.entry.ns}/${res.entry.id}`,
    source: "registry",
    apiId: res.entry.id,
    projectId: auth.projectId,
  });
  // Event-driven: a new spec version → refresh the rolling release PR for every
  // auto-release SDK connection of this API (no polling).
  void enqueueReleasesForApi(
    res.entry.id,
    currentVersion(res.entry),
    auth.projectId,
  );
  return toRegistryEntry(res.entry, { sdk: 0, docs: 0, mcp: 0 });
};
