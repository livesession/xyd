// Access-control helpers for the Bun engine — Layer-1 (static/SSR exclusion)
// parity with @xyd-js/plugin-docs page.tsx shellOnly + @xyd-js/plugin-access-control
// access.ts. The access map (globalThis.__xydAccessMap, keyed by BOTH bare and
// "/"-prefixed slug, values "public" | "authenticated" | "<comma-groups>") is built
// in the shared appInit (xyd-documan utils.ts), so the Bun engine only READS it.
//
// The JWT here is decode-only (no signature verification) — identical to the Vite
// Layer-1 model. Real enforcement is the edge deploy adapter (Layer-2), out of scope.

/** Access level for a slug, or undefined when unmapped (treated as public). */
export function pageAccess(slug: string): string | undefined {
  const accessMap: Record<string, string> = (globalThis as any).__xydAccessMap || {};
  return accessMap["/" + slug] || accessMap[slug];
}

/** Decode the groups claim from a JWT (base64url payload); honors `exp` if present. */
function decodeJwt(token: string, groupsClaim: string): { authed: boolean; groups: string[] } {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf8"));
    if (payload.exp && payload.exp * 1000 < Date.now()) return { authed: false, groups: [] };
    return { authed: true, groups: payload[groupsClaim] || [] };
  } catch {
    return { authed: false, groups: [] };
  }
}

/** The access ladder (mirror of evaluateAccess / canAccessLink):
 *  public/unmapped → allow; not authenticated → deny; "authenticated" → any user;
 *  "*" group (bypass) → allow; else the required comma-groups must intersect. */
export function accessAllowed(access: string | undefined, authed: boolean, groups: string[]): boolean {
  if (!access || access === "public") return true;
  if (!authed) return false;
  if (access === "authenticated") return true;
  if (groups.includes("*")) return true;
  return access.split(",").some((g) => groups.includes(g.trim()));
}

/** Auth state from a request Cookie header (null at build time → unauthenticated). */
export function authFromCookie(cookieHeader: string | null): { authed: boolean; groups: string[] } {
  const s = (globalThis as any).__xydSettings;
  const ac = s?.accessControl;
  if (process.env.XYD_AUTH_BYPASS === "1" || process.env.XYD_AUTH_BYPASS === "true") {
    return { authed: true, groups: ["*"] };
  }
  if (!ac || !cookieHeader) return { authed: false, groups: [] };
  const cookieName = ac.session?.cookieName || "xyd-auth-token";
  const groupsClaim = ac.provider?.groupsClaim || "groups";
  const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`));
  if (!m) return { authed: false, groups: [] };
  return decodeJwt(decodeURIComponent(m[1]), groupsClaim);
}

/** Should this slug render as an EMPTY shell (protected + viewer not allowed)?
 *  Parity with plugin-docs page.tsx: skipped entirely when a deploy adapter is
 *  configured (server enforces → full content pre-rendered). `cookieHeader` is
 *  null at build time (no request) → always treated as unauthenticated. */
export function resolveShellOnly(slug: string, cookieHeader: string | null): boolean {
  const s = (globalThis as any).__xydSettings;
  const ac = s?.accessControl;
  if (!ac || ac.deploy) return false;
  const access = pageAccess(slug);
  if (!access || access === "public") return false;
  const { authed, groups } = authFromCookie(cookieHeader);
  return !accessAllowed(access, authed, groups);
}
