import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";
import "../../components/models/errors.tsp";

using Http;
using Apitoolchain;

namespace PlatformApi;

/** Spec/SDK ↔ repo links; `sync` pushes the artifact into the repo. */
@route("/repo-connections")
interface RepoConnections {
  @get list(@query targetKind?: string, @query targetId?: string): RepoConnection[];

  @post
  create(
    @body input: CreateRepoConnectionInput,
  ): RepoConnection | NotFoundError | ValidationError;

  @delete remove(@path id: string): void | NotFoundError;

  @route("/{id}/sync")
  @post
  sync(@path id: string): RepoConnection | NotFoundError | ValidationError;

  /** Switch a connection between direct-push and PR-based release mode. */
  @route("/{id}/release-config")
  @post
  setReleaseConfig(
    @path id: string,
    @body input: SetReleaseConfigInput,
  ): RepoConnection | NotFoundError | ValidationError;
}
