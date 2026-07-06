import type { Members } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import * as membersQ from "../../db/generated/members_sql";
import { pool } from "../../db/pool";
import { invalid, notFound } from "../errors";

/** DELETE /members/{userId} — remove a member (not yourself, not the last owner). */
export const removeMember: Members["remove"] = async (ctx, userId) => {
  const auth = await requireAuth(ctx);
  if (userId === auth.userId) return invalid("you can't remove yourself");
  const member = await membersQ.getMember(pool, { orgId: auth.orgId, userId });
  if (!member) return notFound(`member ${userId} not found`);
  if (member.role === "owner") {
    const owners = await membersQ.countOwners(pool, { orgId: auth.orgId });
    if ((owners?.n ?? 0) <= 1) {
      return invalid("an org must keep at least one owner");
    }
  }
  await membersQ.deleteMembership(pool, { orgId: auth.orgId, userId });
};
