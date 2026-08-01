import * as authQ from "../../../dbnode/auth";
import * as membersQ from "../../../dbnode/members";
import { pool } from "../../../dbnode/pool";
import type { Members } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { invalid } from "../__kit/errors";
import { toMember } from "../__kit/mappers";

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
