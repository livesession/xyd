import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

/**
 * apitoolchain gitproviderd — the HTTP wire contract for the Go git-provider
 * service. Provider credentials are inlined into every request body (kind,
 * baseUrl, token, login); there is no shared auth scheme.
 */
@service(#{ title: "apitoolchain gitproviderd" })
@info(#{ version: "v1" })
namespace GitProviderd;

enum ProviderKind {
  github,
  gitlab,
  bitbucket,
  gitea,
}

/** Per-request provider credentials, inlined into every body. */
model Creds {
  kind: ProviderKind;
  baseUrl: string;
  token: string;
  login?: string;
}

model User {
  login: string;
  name: string;
  email: string;
}

model Repo {
  fullName: string;
  `namespace`: string;
  name: string;
  defaultBranch: string;
  cloneUrl: string;
  htmlUrl: string;
  `private`: boolean;
}

model Signature {
  name: string;
  email: string;
}

/** A file to push; content is base64-encoded on the wire. */
model FileEntry {
  path: string;
  contentBase64: string;
}

model SyncResult {
  commit: string;
  branch: string;
  htmlUrl: string;
  noChanges: boolean;
}

model ErrorResponse {
  error: string;
}

model BranchesRequest {
  ...Creds;
  repo: string;
}

model CreateRepoBody {
  ...Creds;
  name: string;
  `private`: boolean;
  defaultBranch?: string;
}

model SyncBody {
  ...Creds;
  repo: string;
  branch: string;
  prefix: string;
  message: string;
  author: Signature;
  files: FileEntry[];
}

// ── release pipeline ─────────────────────────────────────────────────────────

/** Open or force-update a rolling release PR (push files to head, PR head→base). */
model UpsertPrBody {
  ...Creds;
  repo: string;
  headBranch: string;
  baseBranch: string;
  prefix: string;
  title: string;
  body: string;
  author: Signature;
  files: FileEntry[];
  replaceSubtree: boolean;
}

model UpsertPrResult {
  number: int32;
  url: string;
  branch: string;
  commit: string;
  created: boolean;
  noChanges: boolean;
}

model CreateTagBody {
  ...Creds;
  repo: string;
  tag: string;
  ref: string;
  author: Signature;
}

model CreateTagResult {
  tag: string;
  sha: string;
}

model CreateReleaseBody {
  ...Creds;
  repo: string;
  tag: string;
  name: string;
  body: string;
  commitish: string;
  prerelease: boolean;
}

model CreateReleaseResult {
  url: string;
  tag: string;
}

model RegisterWebhookBody {
  ...Creds;
  repo: string;
  target: string;
  secret: string;
}

model RegisterWebhookResult {
  id: string;
}

model PrStatusBody {
  ...Creds;
  repo: string;
  number: int32;
}

model PrStatusResult {
  number: int32;
  merged: boolean;
  closed: boolean;
  mergeSha: string;
  baseBranch: string;
}

/** Verify + parse a raw webhook delivery. No token — the secret authenticates it. */
model ParseWebhookBody {
  kind: ProviderKind;
  secret: string;
  headers: Record<string>;
  bodyBase64: string;
}

model ParseWebhookResult {
  event: string;
  action: string;
  number: int32;
  merged: boolean;
  baseBranch: string;
  mergeSha: string;
  verified: boolean;
}

/** 200 OK with a JSON body of `T`. */
model Ok<T> {
  @statusCode statusCode: 200;
  @body body: T;
}

/** Bad request — invalid config/kind/token or a malformed body. */
model BadRequest {
  @statusCode statusCode: 400;
  @body body: ErrorResponse;
}

/** Upstream provider op failed. */
model BadGateway {
  @statusCode statusCode: 502;
  @body body: ErrorResponse;
}

@route("/whoami")
@post
op whoami(@body body: Creds): Ok<User> | BadRequest | BadGateway;

@route("/repos")
@post
op listRepos(@body body: Creds): Ok<Repo[]> | BadRequest | BadGateway;

@route("/branches")
@post
op listBranches(@body body: BranchesRequest): Ok<string[]> | BadRequest | BadGateway;

// NB: a top-level path (not /repos/create) so generated SDKs don't collide a
// "create" sub-resource with the POST /repos "create" method.
@route("/create-repo")
@post
op createRepo(@body body: CreateRepoBody): Ok<Repo> | BadRequest | BadGateway;

@route("/sync")
@post
op sync(@body body: SyncBody): Ok<SyncResult> | BadRequest | BadGateway;

@route("/upsert-pr")
@post
op upsertPr(@body body: UpsertPrBody): Ok<UpsertPrResult> | BadRequest | BadGateway;

@route("/create-tag")
@post
op createTag(@body body: CreateTagBody): Ok<CreateTagResult> | BadRequest | BadGateway;

@route("/create-release")
@post
op createRelease(@body body: CreateReleaseBody): Ok<CreateReleaseResult> | BadRequest | BadGateway;

@route("/register-webhook")
@post
op registerWebhook(
  @body body: RegisterWebhookBody,
): Ok<RegisterWebhookResult> | BadRequest | BadGateway;

@route("/pr-status")
@post
op prStatus(@body body: PrStatusBody): Ok<PrStatusResult> | BadRequest | BadGateway;

@route("/parse-webhook")
@post
op parseWebhook(
  @body body: ParseWebhookBody,
): Ok<ParseWebhookResult> | BadRequest | BadGateway;

@route("/healthz")
@get
op healthz(): {
  @statusCode statusCode: 200;
  @header contentType: "text/plain";
  @body body: string;
};
