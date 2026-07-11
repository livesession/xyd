import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";
import "../../components/models/errors.tsp";

using Http;
using Apitoolchain;

namespace PlatformApi;

@route("/context")
interface Context {
  @get read(): CurrentContext;
  @patch update(@body input: UpdateContextInput): CurrentContext;

  /** Switch the caller's current project (persisted per-user). */
  @route("/select")
  @post
  selectProject(@body input: SelectProjectInput): CurrentContext | NotFoundError;
}
