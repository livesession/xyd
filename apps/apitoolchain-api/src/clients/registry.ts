import { APIError, Client } from "@apitoolchain/registry-api-node";
import { config } from "../config";

/** The registry-api `RegistryEntryCore` wire shape (no platform rollups). */
export interface RegistryCoreVersion {
  version: string;
  specUrl: string;
  updatedAt: string;
  current: boolean;
}
export interface RegistryCoreDistTag {
  tag: string;
  version: string;
}
export interface RegistryCore {
  id: string;
  name: string;
  description: string;
  format: string;
  kind: string;
  ns: string;
  source: string;
  versions: RegistryCoreVersion[];
  distTags: RegistryCoreDistTag[];
  registryUrl: string;
  updatedAt: string;
}

const client = new Client({ baseURL: config.registryApiUrl });

const isNotFound = (err: unknown) =>
  err instanceof APIError && err.status === 404;
const errMessage = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

/** Server-to-server client for the lower-layer registry-api. Backed by the
 * opensdk-generated @apitoolchain/registry-api-node SDK — except `fetchSpecRaw`,
 * which hits registry-api's raw-bytes route that lives outside the TypeSpec. */
export const registryClient = {
  async listApis(projectId?: string): Promise<RegistryCore[]> {
    return (await client.apis.list(
      projectId ? { projectId } : undefined,
    )) as RegistryCore[];
  },

  async getApi(id: string): Promise<RegistryCore | null> {
    try {
      return (await client.apis.retrieve(id)) as RegistryCore;
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
      const entry = (await client.apis.create({
        ...(body as Record<string, unknown>),
        ...(projectId ? { projectId } : {}),
      } as never)) as RegistryCore;
      return { ok: true, entry };
    } catch (err) {
      return { ok: false, message: errMessage(err) };
    }
  },

  async setDistTag(
    apiId: string,
    body: { tag: string; version: string },
  ): Promise<
    { ok: true; entry: RegistryCore } | { ok: false; message: string }
  > {
    try {
      const entry = (await client.apis.distTags.create(
        apiId,
        body,
      )) as RegistryCore;
      return { ok: true, entry };
    } catch (err) {
      return { ok: false, message: errMessage(err) };
    }
  },

  async fetchSpecRaw(
    apiId: string,
    version: string,
  ): Promise<{ text: string; contentType: string } | null> {
    const r = await fetch(
      `${config.registryApiUrl}/apis/${encodeURIComponent(apiId)}/versions/${encodeURIComponent(version)}/spec`,
    );
    if (!r.ok) return null;
    return {
      text: await r.text(),
      contentType: r.headers.get("content-type") ?? "application/yaml",
    };
  },
};
