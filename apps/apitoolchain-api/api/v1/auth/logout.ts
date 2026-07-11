import * as authQ from "../../../dbnode/auth";
import { pool } from "../../../dbnode/pool";
import type { Auth } from "../../openapi/v1/src/generated/models/all/platform-api";
import { bearerToken } from "../__kit/auth";

/** POST /auth/logout — revoke the presented session token (idempotent). */
export const logout: Auth["logout"] = async (ctx) => {
  const token = bearerToken(ctx);
  if (token) await authQ.deleteSession(pool, { token });
};
