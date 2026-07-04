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

async function reg<T>(path: string): Promise<T | null> {
  const r = await fetch(`${config.registryApiUrl}${path}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`registry ${path} -> HTTP ${r.status}`);
  return (await r.json()) as T;
}

/** Server-to-server client for the lower-layer registry-api. */
export const registryClient = {
  async listApis(): Promise<RegistryCore[]> {
    return (await reg<RegistryCore[]>("/apis")) ?? [];
  },

  getApi(id: string): Promise<RegistryCore | null> {
    return reg<RegistryCore>(`/apis/${encodeURIComponent(id)}`);
  },

  async register(
    body: unknown,
  ): Promise<
    { ok: true; entry: RegistryCore } | { ok: false; message: string }
  > {
    const r = await fetch(`${config.registryApiUrl}/apis`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await r.json()) as RegistryCore & { message?: string };
    if (!r.ok)
      return {
        ok: false,
        message: json.message ?? `registry HTTP ${r.status}`,
      };
    return { ok: true, entry: json };
  },

  async setDistTag(
    apiId: string,
    body: { tag: string; version: string },
  ): Promise<
    { ok: true; entry: RegistryCore } | { ok: false; message: string }
  > {
    const r = await fetch(
      `${config.registryApiUrl}/apis/${encodeURIComponent(apiId)}/dist-tags`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const json = (await r.json()) as RegistryCore & { message?: string };
    if (!r.ok)
      return {
        ok: false,
        message: json.message ?? `registry HTTP ${r.status}`,
      };
    return { ok: true, entry: json };
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
