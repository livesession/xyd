import * as membersQ from "../../../dbnode/members";
import { pool } from "../../../dbnode/pool";
import type { Members } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { toMember } from "../__kit/mappers";

/** GET /members — members of the caller's current org. */
export const listMembers: Members["list"] = async (ctx) => {
  const auth = await requireAuth(ctx);
  const rows = await membersQ.listMembers(pool, { orgId: auth.orgId });
  return rows.map(toMember);
};
