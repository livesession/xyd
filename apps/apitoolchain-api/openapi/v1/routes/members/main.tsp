import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";
import "../../components/models/errors.tsp";

using Http;
using Apitoolchain;

namespace PlatformApi;

/** Members of the caller's current org. */
@route("/members")
interface Members {
  @get list(): Member[];
  @post invite(@body input: InviteMemberInput): Member | ValidationError;
  @delete remove(@path userId: string): void | NotFoundError | ValidationError;

  @route("/{userId}/role")
  @patch
  updateRole(
    @path userId: string,
    @body input: UpdateMemberRoleInput,
  ): Member | NotFoundError | ValidationError;
}
