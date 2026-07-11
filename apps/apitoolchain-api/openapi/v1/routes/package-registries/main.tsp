import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";
import "../../components/models/errors.tsp";

using Http;
using Apitoolchain;

namespace PlatformApi;

@route("/package-registries")
interface PackageRegistries {
  @get list(): PackageRegistry[];
  @post create(@body input: ConnectRegistryInput): PackageRegistry | ValidationError;
  @delete remove(@path id: string): void | NotFoundError;
}
