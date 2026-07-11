import * as membersQ from "../../../dbnode/members";
import { pool } from "../../../dbnode/pool";
import type { Members } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { invalid, notFound } from "../__kit/errors";
import { toMember } from "../__kit/mappers";

/** PATCH /members/{userId}/role — change a member's role (keep ≥1 owner). */
export const updateMemberRole: Members["updateRole"] = async (
  ctx,
  userId,
  input,
) => {
  const auth = await requireAuth(ctx);
  const role = input.role.trim();
  if (!role) return invalid("a role is required");
  const member = await membersQ.getMember(pool, { orgId: auth.orgId, userId });
  if (!member) return notFound(`member ${userId} not found`);
  if (member.role === "owner" && role !== "owner") {
    const owners = await membersQ.countOwners(pool, { orgId: auth.orgId });
    if ((owners?.n ?? 0) <= 1) {
      return invalid("an org must keep at least one owner");
    }
  }
  await membersQ.updateMemberRole(pool, { orgId: auth.orgId, userId, role });
  const updated = await membersQ.getMember(pool, { orgId: auth.orgId, userId });
  if (!updated) return notFound(`member ${userId} not found`);
  return toMember(updated);
};
