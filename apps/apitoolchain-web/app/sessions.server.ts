import { createCookieSessionStorage } from "react-router";

/**
 * The web holds the platform-api session token in an httpOnly cookie. It's set
 * at login/register (`commitToken`), read into the request-scoped token store
 * by the root middleware, and cleared on logout.
 */
const sessionStorage = createCookieSessionStorage<{ token: string }>({
  cookie: {
    name: "atc_session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET ?? "apitoolchain-dev-secret"],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days, matching the backend session TTL
  },
});

/** The stored platform-api token for a request, or undefined. */
export async function getSessionToken(
  request: Request,
): Promise<string | undefined> {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );
  return session.get("token");
}

/** A `Set-Cookie` value that stores `token` (used after login/register). */
export async function commitToken(token: string): Promise<string> {
  const session = await sessionStorage.getSession();
  session.set("token", token);
  return sessionStorage.commitSession(session);
}

/** A `Set-Cookie` value that clears the session (used on logout). */
export async function destroySessionCookie(request: Request): Promise<string> {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );
  return sessionStorage.destroySession(session);
}
