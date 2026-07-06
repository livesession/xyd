import { Client, type ProviderKind } from "@apitoolchain/gitprovider-node";
import { config } from "../config";

// Backed by the opensdk-generated @apitoolchain/gitprovider-node SDK. The wire
// types below mirror its generated models (kept as a stable local surface for
// the handlers). gitproviderd takes provider credentials per request; `kind` is
// a plain string here (it arrives from the DB) and is narrowed to the generated
// ProviderKind union only at the SDK boundary.
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

export interface GpUpsertPrInput extends GpCreds {
  repo: string;
  headBranch: string;
  baseBranch: string;
  prefix: string;
  title: string;
  body: string;
  author: { name: string; email: string };
  files: GpFile[];
  replaceSubtree: boolean;
}

export interface GpUpsertPrResult {
  number: number;
  url: string;
  branch: string;
  commit: string;
  created: boolean;
  noChanges: boolean;
}

export interface GpCreateTagInput extends GpCreds {
  repo: string;
  tag: string;
  ref: string;
  author: { name: string; email: string };
}

export interface GpCreateReleaseInput extends GpCreds {
  repo: string;
  tag: string;
  name: string;
  body: string;
  commitish: string;
  prerelease: boolean;
}

export interface GpCreateReleaseResult {
  url: string;
  tag: string;
}

export interface GpRegisterWebhookInput extends GpCreds {
  repo: string;
  target: string;
  secret: string;
}

export interface GpPrStatusInput extends GpCreds {
  repo: string;
  number: number;
}

export interface GpPrStatusResult {
  number: number;
  merged: boolean;
  closed: boolean;
  mergeSha: string;
  baseBranch: string;
}

export interface GpParseWebhookInput {
  kind: string;
  secret: string;
  headers: Record<string, string>;
  bodyBase64: string;
}

export interface GpParseWebhookResult {
  event: string;
  action: string;
  number: number;
  merged: boolean;
  baseBranch: string;
  mergeSha: string;
  verified: boolean;
}

const client = new Client({ baseURL: config.gitProviderApiUrl });

const kind = (k: string) => k as ProviderKind;

/** Server-to-server client for the Go gitproviderd service. */
export const gitProviderClient = {
  whoami(creds: GpCreds): Promise<GpUser> {
    return client.whoami.create({ ...creds, kind: kind(creds.kind) });
  },
  listRepos(creds: GpCreds): Promise<GpRepo[]> {
    return client.repos.create({ ...creds, kind: kind(creds.kind) });
  },
  listBranches(input: GpCreds & { repo: string }): Promise<string[]> {
    return client.branches.create({ ...input, kind: kind(input.kind) });
  },
  createRepo(
    input: GpCreds & {
      name: string;
      private: boolean;
      defaultBranch?: string;
    },
  ): Promise<GpRepo> {
    return client.createRepo.create({ ...input, kind: kind(input.kind) });
  },
  sync(input: GpSyncInput): Promise<GpSyncResult> {
    return client.sync.create({ ...input, kind: kind(input.kind) });
  },
  upsertPr(input: GpUpsertPrInput): Promise<GpUpsertPrResult> {
    return client.upsertPr.create({ ...input, kind: kind(input.kind) });
  },
  createTag(input: GpCreateTagInput): Promise<{ tag: string; sha: string }> {
    return client.createTag.create({ ...input, kind: kind(input.kind) });
  },
  createRelease(input: GpCreateReleaseInput): Promise<GpCreateReleaseResult> {
    return client.createRelease.create({ ...input, kind: kind(input.kind) });
  },
  registerWebhook(input: GpRegisterWebhookInput): Promise<{ id: string }> {
    return client.registerWebhook.create({ ...input, kind: kind(input.kind) });
  },
  prStatus(input: GpPrStatusInput): Promise<GpPrStatusResult> {
    return client.prStatus.create({ ...input, kind: kind(input.kind) });
  },
  parseWebhook(input: GpParseWebhookInput): Promise<GpParseWebhookResult> {
    return client.parseWebhook.create({ ...input, kind: kind(input.kind) });
  },
};
