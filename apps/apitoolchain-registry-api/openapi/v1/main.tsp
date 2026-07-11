import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";
import "./components/models/errors.tsp";
import "./routes/apis/main.tsp";

using Http;
using Apitoolchain;

@service(#{ title: "apitoolchain registry api" })
namespace RegistryApi;
