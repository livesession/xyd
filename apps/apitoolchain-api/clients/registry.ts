import ApitoolchainRegistry, {
  type ApisCreateParams,
  type ApitoolchainRegistryEntryCore,
  apiErrMessage,
  errMessage,
  isNotFound,
} from "@apitoolchain/registry-api-node";
import { config } from "../config";

/** The registry-api entry wire shape — the generated SDK model is the single
 * source of truth (kept as `RegistryCore` for the handlers). If the shape is
 * wrong, fix the opensdk generation / registry-api TypeSpec, not a mirror here. */
export type RegistryCore = ApitoolchainRegistryEntryCore;

const apitoolchainRegistry = new ApitoolchainRegistry({
  baseURL: config.registryApiUrl,
});

// isNotFound / errMessage / apiErrMessage now ship IN the generated SDK's
// "busybox" (opensdk `busybox: "flat"` in sdk-chain/chain.json) and are imported
// above — no hand-rolled mirror here. apiErrMessage still recovers registry-api's
// real `message` from the APIError body (the SDK's own message is "failed with
// status N").

/** Server-to-server client for the lower-layer registry-api, fully backed by the
 * opensdk-generated @apitoolchain/registry-api-node SDK (including the raw spec
 * bytes — modeled in TypeSpec as a `*​/​*` body op that the client returns raw). */
export const registryClient = {
  async listApis(projectId?: string): Promise<RegistryCore[]> {
    return apitoolchainRegistry.apis.list(
      projectId ? { projectId } : undefined,
    );
  },

  async getApi(id: string): Promise<RegistryCore | null> {
    try {
      return await apitoolchainRegistry.apis.retrieve(id);
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
  },

  async register(
    body: unknown,
    projectId?: string,
  ): Promise<
    { ok: true; entry: RegistryCore } | { ok: false; message: string }
  > {
    try {
      const entry = await apitoolchainRegistry.apis.create({
        ...(body as Record<string, unknown>),
        ...(projectId ? { projectId } : {}),
      } as ApisCreateParams);
      return { ok: true, entry };
    } catch (err) {
      // apiErrMessage recovers registry-api's real `message` from the APIError
      // body — the SDK's own message is just "failed with status N".
      return { ok: false, message: apiErrMessage(err) };
    }
  },

  async setDistTag(
    apiId: string,
    body: { tag: string; version: string },
  ): Promise<
    { ok: true; entry: RegistryCore } | { ok: false; message: string }
  > {
    try {
      const entry = await apitoolchainRegistry.apis.distTags.create(
        apiId,
        body,
      );
      return { ok: true, entry };
    } catch (err) {
      return { ok: false, message: errMessage(err) };
    }
  },

  /** Rename an entry via the registry-api SDK's typed `PATCH /apis/{id}`
   * (now regenerated into the SDK as `apis.update`). */
  async updateApi(
    apiId: string,
    body: { name?: string; description?: string },
  ): Promise<
    { ok: true; entry: RegistryCore } | { ok: false; message: string }
  > {
    try {
      const entry = await apitoolchainRegistry.apis.update(apiId, body);
      return { ok: true, entry };
    } catch (err) {
      return { ok: false, message: apiErrMessage(err) };
    }
  },

  /** Raw spec bytes for a version — via the SDK's typed `apis.spec` op. Modeled
   * in TypeSpec as a `*​/​*` body, so opensdk returns the raw `Response` (no JSON
   * round-trip that would rewrite the doc). 404/500 → null (logged). */
  async fetchSpecRaw(
    apiId: string,
    version: string,
  ): Promise<{ text: string; contentType: string } | null> {
    try {
      const res = await apitoolchainRegistry.apis.versions.spec(apiId, version);
      return {
        text: await res.text(),
        contentType: res.headers.get("content-type") ?? "application/yaml",
      };
    } catch (err) {
      // 404 = version/spec row missing, 500 = storage read error.
      console.warn(
        `[registry] spec fetch ${apiId}@${version} → ${apiErrMessage(err)}`,
      );
      return null;
    }
  },
};
