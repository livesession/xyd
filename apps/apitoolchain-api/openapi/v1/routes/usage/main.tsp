import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";
import "../../components/models/errors.tsp";

using Http;
using Apitoolchain;

namespace PlatformApi;

@route("/usage")
interface Usage {
  // `range` is a plain string (the http-server-js glue doesn't narrow query
  // params to enums); the handler validates it against UsageRange.
  @get list(@query range: string): UsageSeries[];
}
