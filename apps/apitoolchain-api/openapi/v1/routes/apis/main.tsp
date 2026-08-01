import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";
import "../../components/models/errors.tsp";

using Http;
using Apitoolchain;

namespace PlatformApi;

/**
 * The platform API is the single origin the frontend talks to. It owns the
 * SDK/docs/mcp/notification/usage/context data and acts as the gateway for the
 * registry (proxying + filling rollup counts).
 */
@route("/apis")
interface Apis {
  @get list(): RegistryEntry[];
  @get read(@path apiId: string): RegistryEntry | NotFoundError;
  @post register(@body input: RegisterApiInput): RegistryEntry | ValidationError;

  /** Proxy: rename an entry (display name + description). id/ns immutable. */
  @patch update(
    @path apiId: string,
    @body input: UpdateApiInput,
  ): RegistryEntry | NotFoundError | ValidationError;

  /** Proxy: create or move a dist-tag (`latest`, `canary`, …) to a version. */
  @route("/{apiId}/dist-tags")
  @post
  setDistTag(
    @path apiId: string,
    @body input: SetDistTagInput,
  ): RegistryEntry | NotFoundError | ValidationError;
}
