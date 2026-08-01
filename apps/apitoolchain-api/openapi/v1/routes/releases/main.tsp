import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";
import "../../components/models/errors.tsp";

using Http;
using Apitoolchain;

namespace PlatformApi;

/**
 * Release pipeline: a rolling, versioned PR per SDK connection. `prepare` opens
 * or force-updates it; `publish` (or a merge webhook) tags + cuts the Release.
 */
@route("/releases")
interface Releases {
  @get list(@query connectionId?: string): Release[];
  @get read(@path id: string): Release | NotFoundError;

  @route("/prepare")
  @post
  prepare(@body input: PrepareReleaseInput): Release | NotFoundError | ValidationError;

  @route("/{id}/publish")
  @post
  publish(@path id: string): Release | NotFoundError | ValidationError;
}
