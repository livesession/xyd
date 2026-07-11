import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";
import "../../components/models/errors.tsp";

using Http;
using Apitoolchain;

namespace RegistryApi;

/**
 * Raw spec bytes for a version — served as-stored (yaml or json). `@body bytes`
 * makes the primary 2xx content NOT application/json, so opensdk generates a
 * method that returns the raw `Response` (the platform-api streams it to the SDK
 * generator). `contentType` is a settable response header so the stored media
 * type is preserved.
 */
model RawSpec {
  @header contentType: string;
  @body spec: bytes;
}

/**
 * The registry: registered API specs + their versions. Lower layer — returns
 * `RegistryEntryCore` (no platform rollups).
 */
@route("/apis")
interface Apis {
  @get list(@query projectId?: string): RegistryEntryCore[];
  @get read(@path apiId: string): RegistryEntryCore | NotFoundError;
  @post register(@body input: RegisterApiInput): RegistryEntryCore | ValidationError;

  /** Raw spec bytes for a version ref (concrete version | dist-tag | `current`).
   * Non-JSON — served as-stored; the SDK returns the raw Response. */
  @route("/{apiId}/versions/{ref}/spec")
  @get
  spec(@path apiId: string, @path ref: string): RawSpec | NotFoundError;

  /** Rename an entry (display name + description). id/ns/format/kind immutable. */
  @patch update(
    @path apiId: string,
    @body input: UpdateApiInput,
  ): RegistryEntryCore | NotFoundError | ValidationError;

  /** Create or move a dist-tag (`latest`, `canary`, …) to an existing version. */
  @route("/{apiId}/dist-tags")
  @post
  setDistTag(
    @path apiId: string,
    @body input: SetDistTagInput,
  ): RegistryEntryCore | NotFoundError | ValidationError;
}
