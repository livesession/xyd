import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";
import "../../components/models/errors.tsp";

using Http;
using Apitoolchain;

namespace PlatformApi;

@route("/sdk-targets")
interface SdkTargets {
  @get list(@query apiId?: string): SdkTarget[];
  @get read(@path id: string): SdkTarget | NotFoundError;
  @delete remove(@path id: string): void | NotFoundError;
}
