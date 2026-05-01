import { describe, it, expect } from "vitest";
import { filterSidebarGroups, filterProtectedPaths } from "../src/navigation";
import type { AccessMap } from "../src/access";

describe("filterSidebarGroups", () => {
  const accessMap: AccessMap = {
    "/docs/public-page": "public",
    "/docs/protected-page": "authenticated",
    "/docs/admin-page": "admin",
    "/docs/multi-group": "admin,staff",
  };

  const sidebarGroups = [
    {
      group: "Guides",
      groupIndex: 0,
      items: [
        { title: "Public", href: "/docs/public-page" },
        { title: "Protected", href: "/docs/protected-page" },
        { title: "Admin Only", href: "/docs/admin-page" },
        { title: "Multi Group", href: "/docs/multi-group" },
      ],
    },
  ];

  it("shows all pages for admin user", () => {
    const filtered = filterSidebarGroups(sidebarGroups, accessMap, ["admin"]);
    expect(filtered[0].items).toHaveLength(4);
  });

  it("hides admin pages from regular authenticated user", () => {
    const filtered = filterSidebarGroups(sidebarGroups, accessMap, ["user"]);
    expect(filtered[0].items).toHaveLength(2); // public + protected
    expect(filtered[0].items.map((i) => i.title)).toEqual([
      "Public",
      "Protected",
    ]);
  });

  it("shows only public pages for anonymous user", () => {
    const filtered = filterSidebarGroups(sidebarGroups, accessMap, []);
    expect(filtered[0].items).toHaveLength(1);
    expect(filtered[0].items[0].title).toBe("Public");
  });

  it("staff user sees multi-group page", () => {
    const filtered = filterSidebarGroups(sidebarGroups, accessMap, ["staff"]);
    const titles = filtered[0].items.map((i) => i.title);
    expect(titles).toContain("Multi Group");
    expect(titles).not.toContain("Admin Only");
  });

  it("removes empty groups entirely", () => {
    const groups = [
      {
        group: "Admin Section",
        groupIndex: 0,
        items: [{ title: "Admin Only", href: "/docs/admin-page" }],
      },
    ];
    const filtered = filterSidebarGroups(groups, accessMap, []);
    expect(filtered).toHaveLength(0);
  });

  it("handles items without href", () => {
    const groups = [
      {
        group: "Mixed",
        groupIndex: 0,
        items: [
          { title: "No Link", href: "" },
          { title: "Protected", href: "/docs/protected-page" },
        ],
      },
    ];
    const filtered = filterSidebarGroups(groups, accessMap, []);
    // Items without href pass through, protected items filtered
    expect(filtered[0].items).toHaveLength(1);
    expect(filtered[0].items[0].title).toBe("No Link");
  });
});

describe("filterProtectedPaths", () => {
  const accessMap: AccessMap = {
    "/docs/public": "public",
    "/docs/secret": "authenticated",
    "/docs/admin": "admin",
  };

  it("filters out protected paths", () => {
    const paths = ["/docs/public", "/docs/secret", "/docs/admin", "/docs/unknown"];
    const filtered = filterProtectedPaths(paths, accessMap);
    expect(filtered).toEqual(["/docs/public", "/docs/unknown"]);
  });

  it("handles paths without leading slash", () => {
    const accessMapNoSlash: AccessMap = {
      "docs/secret": "authenticated",
    };
    const paths = ["docs/public", "docs/secret"];
    const filtered = filterProtectedPaths(paths, accessMapNoSlash);
    expect(filtered).toEqual(["docs/public"]);
  });

  it("returns all paths when access map is empty", () => {
    const paths = ["/a", "/b", "/c"];
    const filtered = filterProtectedPaths(paths, {});
    expect(filtered).toEqual(["/a", "/b", "/c"]);
  });
});
