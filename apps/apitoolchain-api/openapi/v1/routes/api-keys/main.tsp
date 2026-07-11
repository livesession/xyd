import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";
import "../../components/models/errors.tsp";

using Http;
using Apitoolchain;

namespace PlatformApi;

/** Workspace API keys for programmatic access. Only a hash is stored; `create`
 * returns the plaintext secret once. */
@route("/api-keys")
interface ApiKeys {
  @get list(): ApiKey[];
  @post create(@body input: CreateApiKeyInput): CreatedApiKey | ValidationError;
  @delete remove(@path id: string): void | NotFoundError;
}
