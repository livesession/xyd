import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";
import "../../components/models/errors.tsp";

using Http;
using Apitoolchain;

namespace PlatformApi;

@route("/mcp-servers")
interface McpServers {
  @get list(@query apiId?: string): McpServer[];
  @post create(@body input: CreateMcpServerInput): McpServer | NotFoundError;
}
