import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";
import "../../components/models/errors.tsp";

using Http;
using Apitoolchain;

namespace PlatformApi;

@route("/overview")
interface Overview {
  @route("/stats")
  @get
  stats(): OverviewStats;
}
