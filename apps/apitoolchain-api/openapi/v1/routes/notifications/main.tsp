import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";
import "../../components/models/errors.tsp";

using Http;
using Apitoolchain;

namespace PlatformApi;

@route("/notifications")
interface Notifications {
  @get list(): Notification[];

  @route("/read")
  @post
  markRead(@body input: MarkReadInput): MarkReadResult;
}
