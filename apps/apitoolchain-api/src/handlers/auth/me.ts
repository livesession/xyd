import { HttpResponderError } from "../../../generated/src/generated/helpers/http";
import type { Auth } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import * as authQ from "../../db/generated/auth_sql";
import { pool } from "../../db/pool";
import { toUser } from "../../mappers";

/** GET /auth/me — the authenticated account (401 if the bearer is invalid). */
export const me: Auth["me"] = async (ctx) => {
  const info = await requireAuth(ctx);
  const user = await authQ.getUserById(pool, { id: info.userId });
  if (!user) throw new HttpResponderError(401, "unauthorized");
  return toUser(user);
};
