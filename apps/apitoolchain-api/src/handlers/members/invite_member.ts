import type { Members } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import * as authQ from "../../db/generated/auth_sql";
import * as membersQ from "../../db/generated/members_sql";
import { pool } from "../../db/pool";
import { toMember } from "../../mappers";
import { invalid } from "../errors";

/**
 * POST /members — add an existing account to the org by email. (No email-invite
 * flow yet: the person must already have registered.)
 */
export const inviteMember: Members["invite"] = async (ctx, input) => {
  const auth = await requireAuth(ctx);
  const email = input.email.trim().toLowerCase();
  if (!email) return invalid("an email is required");
  const user = await authQ.getUserByEmail(pool, { email });
  if (!user) {
    return invalid("no account with that email — they need to sign up first");
  }
  await authQ.insertMembership(pool, {
    orgId: auth.orgId,
    userId: user.id,
    role: input.role?.trim() || "member",
  });
  const member = await membersQ.getMember(pool, {
    orgId: auth.orgId,
    userId: user.id,
  });
  if (!member) return invalid("could not add the member");
  return toMember(member);
};
