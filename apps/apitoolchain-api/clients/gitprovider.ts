import ApitoolchainGitprovider, {
  type BranchCreateParams,
  type CreateReleaseCreateParams,
  type CreateReleaseResult,
  type CreateRepoCreateParams,
  type CreateTagCreateParams,
  type CreateTagResult,
  type ParseWebhookCreateParams,
  type ParseWebhookResult,
  type ProviderKind,
  type PrStatusCreateParams,
  type PrStatusResult,
  type RegisterWebhookCreateParams,
  type RegisterWebhookResult,
  type Repo,
  type RepoCreateParams,
  type SyncCreateParams,
  type SyncResult,
  type UpsertPrCreateParams,
  type UpsertPrResult,
  type User,
  type WhoamiCreateParams,
} from "@apitoolchain/gitprovider-node";
import { config } from "../config";

// The gitprovider-node SDK's own request/response types are the single source of
// truth — no hand-rolled mirror here. `FileEntry` is re-exported for the release
// pipeline, which assembles the files to push.
export type { FileEntry } from "@apitoolchain/gitprovider-node";

/** The SDK request bodies type `kind` as the {@link ProviderKind} union, but at
 * this server-to-server boundary `kind` arrives as a raw string (a DB column), so
 * relax it here and narrow via `kind()` right before the SDK call. */
type RawKind<T extends { kind: ProviderKind }> = Omit<T, "kind"> & {
  kind: string;
};

const apitoolchainGitprovider = new ApitoolchainGitprovider({
  baseURL: config.gitProviderApiUrl,
});

const kind = (k: string) => k as ProviderKind;

/** Server-to-server client for the Go gitproviderd service — typed directly with
 * the opensdk-generated @apitoolchain/gitprovider-node request/response types (only
 * `kind` is relaxed to a string at the boundary; see {@link RawKind}). */
export const gitProviderClient = {
  whoami(creds: RawKind<WhoamiCreateParams>): Promise<User> {
    return apitoolchainGitprovider.whoami.create({
      ...creds,
      kind: kind(creds.kind),
    });
  },
  listRepos(input: RawKind<RepoCreateParams>): Promise<Repo[]> {
    return apitoolchainGitprovider.repos.create({
      ...input,
      kind: kind(input.kind),
    });
  },
  listBranches(input: RawKind<BranchCreateParams>): Promise<string[]> {
    return apitoolchainGitprovider.branches.create({
      ...input,
      kind: kind(input.kind),
    });
  },
  createRepo(input: RawKind<CreateRepoCreateParams>): Promise<Repo> {
    return apitoolchainGitprovider.createRepo.create({
      ...input,
      kind: kind(input.kind),
    });
  },
  sync(input: RawKind<SyncCreateParams>): Promise<SyncResult> {
    return apitoolchainGitprovider.sync.create({
      ...input,
      kind: kind(input.kind),
    });
  },
  upsertPr(input: RawKind<UpsertPrCreateParams>): Promise<UpsertPrResult> {
    return apitoolchainGitprovider.upsertPr.create({
      ...input,
      kind: kind(input.kind),
    });
  },
  createTag(input: RawKind<CreateTagCreateParams>): Promise<CreateTagResult> {
    return apitoolchainGitprovider.createTag.create({
      ...input,
      kind: kind(input.kind),
    });
  },
  createRelease(
    input: RawKind<CreateReleaseCreateParams>,
  ): Promise<CreateReleaseResult> {
    return apitoolchainGitprovider.createRelease.create({
      ...input,
      kind: kind(input.kind),
    });
  },
  registerWebhook(
    input: RawKind<RegisterWebhookCreateParams>,
  ): Promise<RegisterWebhookResult> {
    return apitoolchainGitprovider.registerWebhook.create({
      ...input,
      kind: kind(input.kind),
    });
  },
  prStatus(input: RawKind<PrStatusCreateParams>): Promise<PrStatusResult> {
    return apitoolchainGitprovider.prStatus.create({
      ...input,
      kind: kind(input.kind),
    });
  },
  parseWebhook(
    input: RawKind<ParseWebhookCreateParams>,
  ): Promise<ParseWebhookResult> {
    return apitoolchainGitprovider.parseWebhook.create({
      ...input,
      kind: kind(input.kind),
    });
  },
};
