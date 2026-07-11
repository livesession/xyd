import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";
import "../../components/models/errors.tsp";

using Http;
using Apitoolchain;

namespace PlatformApi;

@route("/docs-projects")
interface DocsProjects {
  @get list(@query apiId?: string): DocsProject[];
  @post create(@body input: CreateDocsProjectInput): DocsProject | NotFoundError;
}
