import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";
import "../../components/models/errors.tsp";

using Http;
using Apitoolchain;

namespace PlatformApi;

@route("/sdks")
interface Sdks {
  @get list(@query apiId?: string): Sdk[];
  @get read(@path id: string): Sdk | NotFoundError;
  @post create(@body input: CreateSdkInput): Sdk | NotFoundError | ValidationError;
  @delete remove(@path id: string): void | NotFoundError;

  @route("/{sdkId}/targets")
  @get
  listTargets(@path sdkId: string): SdkTarget[] | NotFoundError;

  @route("/{sdkId}/targets")
  @post
  addTarget(
    @path sdkId: string,
    @body input: AddSdkTargetInput,
  ): SdkTarget | NotFoundError | ValidationError;

  @route("/{sdkId}/build")
  @post
  build(
    @path sdkId: string,
    @body input: BuildSdkInput,
  ): SdkTarget[] | NotFoundError | ValidationError;

  /** SDK version/build history (newest first). */
  @route("/{sdkId}/versions")
  @get
  listVersions(@path sdkId: string): SdkBuild[] | NotFoundError;

  /** Create a new SDK version: bump + rebuild every target, recorded as a build. */
  @route("/{sdkId}/versions")
  @post
  createVersion(
    @path sdkId: string,
    @body input: CreateSdkVersionInput,
  ): SdkBuild | NotFoundError | ValidationError;
}
