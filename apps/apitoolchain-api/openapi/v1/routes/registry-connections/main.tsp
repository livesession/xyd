import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";
import "../../components/models/errors.tsp";

using Http;
using Apitoolchain;

namespace PlatformApi;

/**
 * Registry connections: link an SDK target to a package registry and publish it.
 * `publish` regenerates + pushes the package (reusing opensdk `publishTarget`).
 */
@route("/registry-connections")
interface RegistryConnections {
  @get list(@query targetId?: string): RegistryConnection[];

  @post
  create(
    @body input: CreateRegistryConnectionInput,
  ): RegistryConnection | NotFoundError | ValidationError;

  @delete remove(@path id: string): void | NotFoundError;

  @route("/{id}/publish")
  @post
  publish(@path id: string): RegistryConnection | NotFoundError | ValidationError;
}
