import type { Auth } from "../../../generated/src/generated/models/all/platform-api";
import { bearerToken } from "../../auth";
import * as authQ from "../../db/generated/auth_sql";
import { pool } from "../../db/pool";

/** POST /auth/logout — revoke the presented session token (idempotent). */
export const logout: Auth["logout"] = async (ctx) => {
  const token = bearerToken(ctx);
  if (token) await authQ.deleteSession(pool, { token });
};
