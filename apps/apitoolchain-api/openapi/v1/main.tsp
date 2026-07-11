import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";
import "./components/models/errors.tsp";
import "./routes/apis/main.tsp";
import "./routes/sdks/main.tsp";
import "./routes/sdk-targets/main.tsp";
import "./routes/docs-projects/main.tsp";
import "./routes/mcp-servers/main.tsp";
import "./routes/notifications/main.tsp";
import "./routes/overview/main.tsp";
import "./routes/usage/main.tsp";
import "./routes/auth/main.tsp";
import "./routes/projects/main.tsp";
import "./routes/context/main.tsp";
import "./routes/members/main.tsp";
import "./routes/git-providers/main.tsp";
import "./routes/repo-connections/main.tsp";
import "./routes/releases/main.tsp";
import "./routes/package-registries/main.tsp";
import "./routes/registry-connections/main.tsp";
import "./routes/api-keys/main.tsp";

using Http;
using Apitoolchain;

@service(#{ title: "apitoolchain platform api" })
namespace PlatformApi;
