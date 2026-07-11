import * as authQ from "../../../dbnode/auth";
import { pool } from "../../../dbnode/pool";
import { HttpResponderError } from "../../openapi/v1/src/generated/helpers/http";
import type { Auth } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { toUser } from "../__kit/mappers";

/** GET /auth/me — the authenticated account (401 if the bearer is invalid). */
export const me: Auth["me"] = async (ctx) => {
  const info = await requireAuth(ctx);
  const user = await authQ.getUserById(pool, { id: info.userId });
  if (!user) throw new HttpResponderError(401, "unauthorized");
  return toUser(user);
};
