import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";
import "../../components/models/errors.tsp";

using Http;
using Apitoolchain;

namespace PlatformApi;

/** Connected git-provider accounts (GitHub/GitLab/Bitbucket/Gitea via gitproviderd). */
@route("/git-providers")
interface GitProviders {
  @get list(): GitProvider[];
  @post create(@body input: ConnectGitProviderInput): GitProvider | ValidationError;
  @delete remove(@path id: string): void | NotFoundError;

  /** Repos the provider's token can access (for the connect picker). */
  @route("/{id}/repos")
  @get
  listRepos(@path id: string): GitRepoOption[] | NotFoundError | ValidationError;

  /** Branch names of one repo (for the branch picker after a repo is chosen). */
  @route("/{id}/branches")
  @get
  listBranches(
    @path id: string,
    @query repo: string,
  ): string[] | NotFoundError | ValidationError;
}
