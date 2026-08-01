import * as authQ from "../../../dbnode/auth";
import { pool } from "../../../dbnode/pool";
import type { Auth } from "../../openapi/v1/src/generated/models/all/platform-api";
import {
  newSessionToken,
  sessionExpiresAt,
  verifyPassword,
} from "../__kit/auth";
import { invalid } from "../__kit/errors";
import { toUser } from "../__kit/mappers";

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
