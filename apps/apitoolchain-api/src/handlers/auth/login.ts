import type { Auth } from "../../../generated/src/generated/models/all/platform-api";
import { newSessionToken, sessionExpiresAt, verifyPassword } from "../../auth";
import * as authQ from "../../db/generated/auth_sql";
import { pool } from "../../db/pool";
import { toUser } from "../../mappers";
import { invalid } from "../errors";

/** POST /auth/login — verify the password, start a session. Public. */
export const login: Auth["login"] = async (_ctx, input) => {
  const email = input.email.trim().toLowerCase();
  const user = await authQ.getUserByEmail(pool, { email });
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    return invalid("invalid email or password");
  }

  const token = newSessionToken();
  await authQ.insertSession(pool, {
    token,
    userId: user.id,
    expiresAt: sessionExpiresAt(),
  });
  return { token, user: toUser(user) };
};
