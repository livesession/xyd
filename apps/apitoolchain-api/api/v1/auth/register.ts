import * as authQ from "../../../dbnode/auth";
import * as ctxQ from "../../../dbnode/context";
import { pool } from "../../../dbnode/pool";
import { randomId } from "../../../util";
import type { Auth } from "../../openapi/v1/src/generated/models/all/platform-api";
import { hashPassword, newSessionToken, sessionExpiresAt } from "../__kit/auth";
import { invalid } from "../__kit/errors";
import { toUser } from "../__kit/mappers";

/**
 * POST /auth/register — create an account with a personal org + default project,
 * then start a session. Public (no bearer required).
 */
export const register: Auth["register"] = async (_ctx, input) => {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password)
    return invalid("email and password are required");
  if (input.password.length < 8)
    return invalid("password must be at least 8 characters");

  const existing = await authQ.getUserByEmail(pool, { email });
  if (existing) return invalid("that email is already registered");

  const userId = randomId("usr");
  const name = input.name?.trim() || email.split("@")[0];
  const user = await authQ.insertUser(pool, {
    id: userId,
    email,
    name,
    passwordHash: hashPassword(input.password),
  });
  if (!user) return invalid("could not create the account");

  // Every new account owns a fresh org + default project.
  const orgId = randomId("org");
  const projectId = randomId("prj");
  await ctxQ.upsertOrg(pool, {
    id: orgId,
    name: `${name}'s org`,
    plan: "Free plan",
  });
  await ctxQ.upsertProject(pool, { id: projectId, orgId, name: "Default" });
  await authQ.insertMembership(pool, { orgId, userId, role: "owner" });
  await authQ.upsertUserSettings(pool, {
    userId,
    currentOrgId: orgId,
    currentProjectId: projectId,
  });

  const token = newSessionToken();
  await authQ.insertSession(pool, {
    token,
    userId,
    expiresAt: sessionExpiresAt(),
  });
  return { token, user: toUser(user) };
};
