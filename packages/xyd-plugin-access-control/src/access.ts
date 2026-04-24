import type { AccessControl, AccessControlRule } from "@xyd-js/core";

export type AccessLevel = "public" | "authenticated" | string; // string = comma-separated groups

export type AccessMap = Record<string, AccessLevel>;

export interface AccessEvaluation {
  allowed: boolean;
  reason: string;
}

/**
 * Matches a path against a glob-like pattern.
 * Supports ** (any depth) and * (single segment).
 */
export function matchPattern(pattern: string, path: string): boolean {
  const regexStr = pattern
    .replace(/\*\*/g, "___GLOBSTAR___")
    .replace(/\*/g, "[^/]*")
    .replace(/___GLOBSTAR___/g, ".*");

  const regex = new RegExp(`^${regexStr}$`);
  return regex.test(path);
}

/**
 * Evaluate access for a specific page given its metadata and access control config.
 * Returns the access level string for the access map.
 */
export function resolvePageAccess(
  pagePath: string,
  metadata: { public?: boolean; accessGroups?: string[] },
  config: AccessControl
): AccessLevel {
  // Normalize: ensure path has leading slash for consistent matching
  const normalizedPath = pagePath.startsWith("/") ? pagePath : `/${pagePath}`;

  // 1. Frontmatter overrides (highest priority)
  if (metadata.public === true) {
    return "public";
  }
  if (metadata.public === false) {
    if (metadata.accessGroups?.length) {
      return metadata.accessGroups.join(",");
    }
    return "authenticated";
  }

  // 2. Pattern rules (first match wins)
  if (config.rules) {
    for (const rule of config.rules) {
      if (matchPattern(rule.match, normalizedPath)) {
        if (rule.access === "public") {
          return "public";
        }
        if (rule.groups?.length) {
          return rule.groups.join(",");
        }
        return "authenticated";
      }
    }
  }

  // 3. Default access (lowest priority)
  return config.defaultAccess === "protected" ? "authenticated" : "public";
}

/**
 * Evaluate whether a user has access to a page.
 */
export function evaluateAccess(
  pagePath: string,
  accessMap: AccessMap,
  userGroups: string[]
): AccessEvaluation {
  const access = accessMap[pagePath];

  // No entry in access map = public
  if (!access || access === "public") {
    return { allowed: true, reason: `access:public` };
  }

  // Requires authentication
  if (access === "authenticated") {
    return {
      allowed: userGroups.length > 0 || false,
      reason: "access:authenticated",
    };
  }

  // Group-based access
  const requiredGroups = access.split(",");
  const hasGroup = requiredGroups.some((g) => userGroups.includes(g));
  return {
    allowed: hasGroup,
    reason: `access:groups:${access}`,
  };
}

/**
 * Build a complete access map from page path mapping and access control config.
 * Used at build time to pre-compute access levels for all pages.
 */
export function buildAccessMap(
  pagePathMapping: Record<string, string>,
  metadataMap: Record<string, { public?: boolean; accessGroups?: string[] }>,
  config: AccessControl
): AccessMap {
  const accessMap: AccessMap = {};

  for (const pagePath of Object.keys(pagePathMapping)) {
    const metadata = metadataMap[pagePath] || {};
    accessMap[pagePath] = resolvePageAccess(pagePath, metadata, config);
  }

  return accessMap;
}
