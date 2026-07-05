import { config } from "../config";

/** Provider credentials the stateless gitproviderd service takes per request. */
export interface GpCreds {
  kind: string;
  baseUrl: string;
  token: string;
  login?: string;
}

export interface GpUser {
  login: string;
  name: string;
  email: string;
}

export interface GpRepo {
  fullName: string;
  namespace: string;
  name: string;
  defaultBranch: string;
  cloneUrl: string;
  htmlUrl: string;
  private: boolean;
}

export interface GpFile {
  path: string;
  contentBase64: string;
}

export interface GpSyncInput extends GpCreds {
  repo: string;
  branch: string;
  prefix: string;
  message: string;
  author: { name: string; email: string };
  files: GpFile[];
}

export interface GpSyncResult {
  commit: string;
  branch: string;
  htmlUrl: string;
  noChanges: boolean;
}

async function gp<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${config.gitProviderApiUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) {
    throw new Error(json?.error ?? `gitprovider ${path} -> HTTP ${r.status}`);
  }
  return json as T;
}

/** Server-to-server client for the Go gitproviderd service. */
export const gitProviderClient = {
  whoami(creds: GpCreds): Promise<GpUser> {
    return gp<GpUser>("/whoami", creds);
  },
  listRepos(creds: GpCreds): Promise<GpRepo[]> {
    return gp<GpRepo[]>("/repos", creds);
  },
  listBranches(input: GpCreds & { repo: string }): Promise<string[]> {
    return gp<string[]>("/branches", input);
  },
  createRepo(
    input: GpCreds & {
      name: string;
      private: boolean;
      defaultBranch?: string;
    },
  ): Promise<GpRepo> {
    return gp<GpRepo>("/repos/create", input);
  },
  sync(input: GpSyncInput): Promise<GpSyncResult> {
    return gp<GpSyncResult>("/sync", input);
  },
};
