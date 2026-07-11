import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import * as authQ from "../../../dbnode/auth";
import { pool } from "../../../dbnode/pool";
import { HttpResponderError } from "../../openapi/v1/src/generated/helpers/http";
import type { HttpContext } from "../../openapi/v1/src/generated/helpers/router";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

/** scrypt password hash, stored as `salt:hash` (both hex). No external deps. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expected, "hex");
  return (
    expectedBuf.length === actual.length && timingSafeEqual(expectedBuf, actual)
  );
}

export function newSessionToken(): string {
  return `sess_${randomBytes(24).toString("hex")}`;
}

export function sessionExpiresAt(): Date {
  return new Date(Date.now() + SESSION_TTL_MS);
}

/**
 * The bearer token from `Authorization: Bearer <token>`, or undefined. Accepts
 * the handler's `unknown` ctx (the generated interface leaves `Context`
 * unparameterized) and narrows to the runtime {@link HttpContext}.
 */
export function bearerToken(ctx: unknown): string | undefined {
  const header = (ctx as HttpContext).request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice("Bearer ".length).trim() || undefined;
}

export interface AuthInfo {
  userId: string;
  email: string;
  name: string;
  /** The caller's current org + project (from `user_settings`). */
  orgId: string;
  projectId: string;
}

/** Resolve the caller from the bearer session, or null if absent/expired. */
export async function resolveAuth(ctx: unknown): Promise<AuthInfo | null> {
  const token = bearerToken(ctx);
  if (!token) return null;
  const session = await authQ.getSession(pool, { token });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await authQ.deleteSession(pool, { token });
    return null;
  }
  const settings = await authQ.getUserSettings(pool, {
    userId: session.userId,
  });
  if (!settings) return null;
  return {
    userId: session.userId,
    email: session.userEmail,
    name: session.userName,
    orgId: settings.currentOrgId,
    projectId: settings.currentProjectId,
  };
}

/**
 * Like {@link resolveAuth} but throws a 401 responder the router catches
 * (`isHttpResponder`) and emits — the cross-cutting gate for protected ops.
 */
export async function requireAuth(ctx: unknown): Promise<AuthInfo> {
  const info = await resolveAuth(ctx);
  if (!info) throw new HttpResponderError(401, "unauthorized");
  return info;
}
