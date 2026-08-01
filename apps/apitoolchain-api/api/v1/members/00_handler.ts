import type { Members } from "../../openapi/v1/src/generated/models/all/platform-api";
import { inviteMember } from "./invite_member";
import { listMembers } from "./list_members";
import { removeMember } from "./remove_member";
import { updateMemberRole } from "./update_member_role";

/** `/members` — org membership list + invite/remove/role. */
export const members: Members = {
  list: listMembers,
  invite: inviteMember,
  remove: removeMember,
  updateRole: updateMemberRole,
};
