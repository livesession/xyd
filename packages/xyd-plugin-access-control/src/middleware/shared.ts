import type { AccessControl } from "@xyd-js/core";
import type { AccessMap } from "../access";

/**
 * Generates the core middleware logic as a string, shared across all platforms.
 * Platform-specific adapters wrap this in their runtime format.
 */
export function generateMiddlewareCore(
  config: AccessControl,
  accessMap: AccessMap
): string {
  const loginUrl = "loginUrl" in config.provider ? config.provider.loginUrl : "";
  const cookieName = config.session?.cookieName || "xyd-auth-token";
  const groupsClaim =
    "groupsClaim" in config.provider
      ? config.provider.groupsClaim || "groups"
      : "groups";
  const defaultAccess = config.defaultAccess || "public";

  return `
const ACCESS_MAP = ${JSON.stringify(accessMap)};
const LOGIN_URL = ${JSON.stringify(loginUrl)};
const COOKIE_NAME = ${JSON.stringify(cookieName)};
const GROUPS_CLAIM = ${JSON.stringify(groupsClaim)};
const DEFAULT_ACCESS = ${JSON.stringify(defaultAccess)};

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach(function(c) {
    const parts = c.trim().split("=");
    if (parts.length >= 2) {
      cookies[parts[0]] = decodeURIComponent(parts.slice(1).join("="));
    }
  });
  return cookies;
}

function decodeJWTPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

function handleAuthRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Skip asset requests
  if (path.startsWith("/assets/") || path.match(/\\.[a-z0-9]+$/i)) {
    return null; // pass through
  }

  // Check access requirement
  const access = ACCESS_MAP[path] || DEFAULT_ACCESS;
  if (access === "public") return null; // pass through

  // Check auth cookie
  const cookies = parseCookies(request.headers.get("cookie"));
  const token = cookies[COOKIE_NAME];

  if (!token) {
    const redirectUrl = LOGIN_URL
      ? LOGIN_URL + (LOGIN_URL.includes("?") ? "&" : "?") + "redirect=" + encodeURIComponent(url.href)
      : null;
    return { status: 302, redirect: redirectUrl };
  }

  // Decode and validate token
  const payload = decodeJWTPayload(token);
  if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
    const redirectUrl = LOGIN_URL
      ? LOGIN_URL + (LOGIN_URL.includes("?") ? "&" : "?") + "redirect=" + encodeURIComponent(url.href)
      : null;
    return { status: 302, redirect: redirectUrl };
  }

  // Check group access
  if (access !== "authenticated") {
    const requiredGroups = access.split(",");
    const userGroups = payload[GROUPS_CLAIM] || [];
    const hasAccess = requiredGroups.some(function(g) { return userGroups.includes(g); });
    if (!hasAccess) {
      return { status: 404 };
    }
  }

  return null; // pass through - authorized
}
`;
}
