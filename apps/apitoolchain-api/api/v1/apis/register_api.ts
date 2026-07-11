import { registryClient } from "../../../clients/registry";
import * as notifQ from "../../../dbnode/notifications";
import { pool } from "../../../dbnode/pool";
import { enqueueReleasesForApi } from "../../../genframework/release";
import { currentVersion, randomId } from "../../../util";
import type { Apis } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { invalid } from "../__kit/errors";
import { toRegistryEntry } from "../__kit/mappers";

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
  // Event-driven: a new spec version → refresh the rolling release PR, but only
  // for auto-release connections configured for the dist-tag it published under
  // (default `latest`). The version is the one that tag now points at. A version
  // registered with NO dist-tag (`none`) has nothing to trigger on — skip it.
  const rawTag = (input.distTag ?? "").trim();
  if (rawTag !== "none") {
    const tag = rawTag || "latest";
    const taggedVersion =
      res.entry.distTags.find((d) => d.tag === tag)?.version ??
      currentVersion(res.entry);
    void enqueueReleasesForApi(
      res.entry.id,
      taggedVersion,
      tag,
      auth.projectId,
    );
  }
  return toRegistryEntry(res.entry, { sdk: 0, docs: 0, mcp: 0 });
};
