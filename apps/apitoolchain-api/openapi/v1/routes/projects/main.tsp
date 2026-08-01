import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";
import "../../components/models/errors.tsp";

using Http;
using Apitoolchain;

namespace PlatformApi;

/** Projects in the caller's current org — the sidebar switcher's data. */
@route("/projects")
interface Projects {
  @get list(): Project[];
  @post create(@body input: CreateProjectInput): Project | ValidationError;

  @patch
  update(
    @path id: string,
    @body input: UpdateProjectInput,
  ): Project | NotFoundError | ValidationError;

  @delete remove(@path id: string): void | NotFoundError | ValidationError;
}
