import type { Members } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import * as membersQ from "../../db/generated/members_sql";
import { pool } from "../../db/pool";
import { toMember } from "../../mappers";

/** GET /members — members of the caller's current org. */
export const listMembers: Members["list"] = async (ctx) => {
  const auth = await requireAuth(ctx);
  const rows = await membersQ.listMembers(pool, { orgId: auth.orgId });
  return rows.map(toMember);
};
