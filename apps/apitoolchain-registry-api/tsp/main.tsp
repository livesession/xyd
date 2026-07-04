import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";

using Http;
using Apitoolchain;

@service(#{ title: "apitoolchain registry api" })
namespace RegistryApi;

@error
model NotFoundError {
  @statusCode statusCode: 404;
  code: "not_found";
  message: string;
}

@error
model ValidationError {
  @statusCode statusCode: 422;
  code: "invalid_spec";
  message: string;
}

/**
 * The registry: registered API specs + their versions. Lower layer — returns
 * `RegistryEntryCore` (no platform rollups). RAW spec bytes are served by a
 * hand-written route in server.ts (binary, outside the generated JSON router).
 */
@route("/apis")
interface Apis {
  @get list(): RegistryEntryCore[];
  @get read(@path apiId: string): RegistryEntryCore | NotFoundError;
  @post register(@body input: RegisterApiInput): RegistryEntryCore | ValidationError;

  /** Create or move a dist-tag (`latest`, `canary`, …) to an existing version. */
  @route("/{apiId}/dist-tags")
  @post
  setDistTag(
    @path apiId: string,
    @body input: SetDistTagInput,
  ): RegistryEntryCore | NotFoundError | ValidationError;
}
