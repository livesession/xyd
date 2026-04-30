import { describe, it, expect } from "vitest";
import {
  matchPattern,
  resolvePageAccess,
  evaluateAccess,
  buildAccessMap,
  type AccessMap,
} from "../src/access";
import type { AccessControl } from "@xyd-js/core";

describe("matchPattern", () => {
  it("matches exact paths", () => {
    expect(matchPattern("/docs/intro", "/docs/intro")).toBe(true);
    expect(matchPattern("/docs/intro", "/docs/other")).toBe(false);
  });

  it("matches single wildcard", () => {
    expect(matchPattern("/docs/*", "/docs/intro")).toBe(true);
    expect(matchPattern("/docs/*", "/docs/api/ref")).toBe(false);
  });

  it("matches globstar", () => {
    expect(matchPattern("/docs/**", "/docs/intro")).toBe(true);
    expect(matchPattern("/docs/**", "/docs/api/ref")).toBe(true);
    expect(matchPattern("/docs/**", "/other/page")).toBe(false);
  });

  it("matches complex patterns", () => {
    expect(matchPattern("/docs/api/*/admin", "/docs/api/v1/admin")).toBe(true);
    expect(matchPattern("/docs/**/admin", "/docs/api/v1/admin")).toBe(true);
  });
});

describe("resolvePageAccess", () => {
  const baseConfig: AccessControl = {
    provider: { type: "jwt", loginUrl: "https://example.com/login" },
    defaultAccess: "public",
  };

  it("returns public when frontmatter public=true", () => {
    const result = resolvePageAccess("/docs/intro", { public: true }, baseConfig);
    expect(result).toBe("public");
  });

  it("returns authenticated when frontmatter public=false without groups", () => {
    const result = resolvePageAccess("/docs/secret", { public: false }, baseConfig);
    expect(result).toBe("authenticated");
  });

  it("returns groups when frontmatter has accessGroups", () => {
    const result = resolvePageAccess(
      "/docs/admin",
      { public: false, accessGroups: ["admin", "staff"] },
      baseConfig
    );
    expect(result).toBe("admin,staff");
  });

  it("matches rules when no frontmatter override", () => {
    const config: AccessControl = {
      ...baseConfig,
      rules: [
        { match: "/docs/guides/**", access: "public" },
        { match: "/docs/api/**", access: "protected", groups: ["dev"] },
      ],
    };

    expect(resolvePageAccess("/docs/guides/intro", {}, config)).toBe("public");
    expect(resolvePageAccess("/docs/api/ref", {}, config)).toBe("dev");
  });

  it("normalizes paths without leading slash to match rules", () => {
    const config: AccessControl = {
      ...baseConfig,
      rules: [
        { match: "/protected/**", access: "protected" },
        { match: "/admin/**", access: "protected", groups: ["admin"] },
      ],
    };

    // Keys from __xydPagePathMapping don't have leading slash
    expect(resolvePageAccess("protected/api-reference", {}, config)).toBe("authenticated");
    expect(resolvePageAccess("admin/dashboard", {}, config)).toBe("admin");
    // With leading slash also works
    expect(resolvePageAccess("/protected/api-reference", {}, config)).toBe("authenticated");
  });

  it("first matching rule wins", () => {
    const config: AccessControl = {
      ...baseConfig,
      rules: [
        { match: "/docs/**", access: "public" },
        { match: "/docs/api/**", access: "protected" },
      ],
    };

    // First rule matches, so it's public even though second rule would protect
    expect(resolvePageAccess("/docs/api/ref", {}, config)).toBe("public");
  });

  it("uses defaultAccess when no rules match", () => {
    const protectedConfig: AccessControl = {
      ...baseConfig,
      defaultAccess: "protected",
    };

    expect(resolvePageAccess("/unknown", {}, baseConfig)).toBe("public");
    expect(resolvePageAccess("/unknown", {}, protectedConfig)).toBe("authenticated");
  });

  it("frontmatter takes priority over rules", () => {
    const config: AccessControl = {
      ...baseConfig,
      rules: [{ match: "/docs/**", access: "protected" }],
    };

    // Frontmatter public=true overrides rule
    expect(resolvePageAccess("/docs/intro", { public: true }, config)).toBe("public");
  });
});

describe("evaluateAccess", () => {
  it("allows public pages", () => {
    const accessMap: AccessMap = { "/docs": "public" };
    const result = evaluateAccess("/docs", accessMap, []);
    expect(result.allowed).toBe(true);
  });

  it("allows authenticated pages for authenticated users", () => {
    const accessMap: AccessMap = { "/docs": "authenticated" };
    const result = evaluateAccess("/docs", accessMap, ["user"]);
    expect(result.allowed).toBe(true);
  });

  it("denies authenticated pages for anonymous users", () => {
    const accessMap: AccessMap = { "/docs": "authenticated" };
    const result = evaluateAccess("/docs", accessMap, []);
    expect(result.allowed).toBe(false);
  });

  it("allows group pages for users with matching group", () => {
    const accessMap: AccessMap = { "/admin": "admin,staff" };
    const result = evaluateAccess("/admin", accessMap, ["staff"]);
    expect(result.allowed).toBe(true);
  });

  it("denies group pages for users without matching group", () => {
    const accessMap: AccessMap = { "/admin": "admin" };
    const result = evaluateAccess("/admin", accessMap, ["user"]);
    expect(result.allowed).toBe(false);
  });

  it("allows pages not in access map", () => {
    const result = evaluateAccess("/unknown", {}, []);
    expect(result.allowed).toBe(true);
  });
});

describe("buildAccessMap", () => {
  it("builds access map from page mapping and config", () => {
    const config: AccessControl = {
      provider: { type: "jwt", loginUrl: "https://example.com/login" },
      defaultAccess: "protected",
      rules: [{ match: "/docs/guides/**", access: "public" }],
    };

    const pageMapping = {
      "/docs/guides/intro": "content/guides/intro.md",
      "/docs/api/ref": "content/api/ref.md",
    };

    const metadataMap = {};

    const result = buildAccessMap(pageMapping, metadataMap, config);
    expect(result["/docs/guides/intro"]).toBe("public");
    expect(result["/docs/api/ref"]).toBe("authenticated");
  });
});
