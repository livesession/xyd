import { describe, expect, it } from "vitest";

import {
  contentVersionValue,
  contextControlDefaults,
  findSidebarContextControls,
  isContentVersionSwap,
  resolveContentVersionSwap,
  resolveContextControls,
} from "../src/context-controls";
import type { ContextControls, Metadata, Settings } from "../index";

// Page context controls — pure resolver: precedence (sidebar entry >
// frontmatter > global, REPLACE semantics), shorthand expansion, per-type
// validation, appearance defaulting.

const settingsWith = (global?: ContextControls, sidebar: unknown[] = []): Settings =>
  ({
    components: global ? { contextControls: global } : {},
    navigation: { sidebar },
  }) as unknown as Settings;

describe("resolveContextControls — normalization", () => {
  it("expands string shorthands, defaults appearance to header, drops unknowns", () => {
    const out = resolveContextControls(
      settingsWith(["copy", "view-markdown", "not-a-control" as never]),
      null,
      "docs/a",
    );
    expect(out).toEqual([
      { type: "copy", appearance: "header" },
      { type: "view-markdown", appearance: "header" },
    ]);
  });

  it("keeps typed forms with overrides; validates per-type options", () => {
    const out = resolveContextControls(
      settingsWith([
        { type: "copy", appearance: "toc-bottom", label: "Grab it", icon: "lucide:copy" },
        { type: "mcp", options: { url: "https://mcp.acme.dev" }, appearance: "toc-top" },
        { type: "mcp" } as never, // no url → dropped
        { type: "content-version", options: { versions: [] } } as never, // empty → dropped
      ]),
      null,
      "docs/a",
    );
    expect(out).toEqual([
      { type: "copy", appearance: "toc-bottom", label: "Grab it", icon: "lucide:copy" },
      { type: "mcp", options: { url: "https://mcp.acme.dev" }, appearance: "toc-top" },
    ]);
  });

  it("normalizes dropdown nested actions (shorthands expanded, composites rejected)", () => {
    const out = resolveContextControls(
      settingsWith([
        {
          type: "dropdown",
          appearance: "header",
          options: {
            controls: [
              "copy",
              { type: "claude", label: "Ask Claude" },
              { type: "dropdown", options: { controls: ["copy"] } } as never, // no nesting
            ],
          },
        },
        { type: "dropdown", options: { controls: [] } } as never, // empty → dropped
      ]),
      null,
      "docs/a",
    );
    expect(out).toEqual([
      {
        type: "dropdown",
        appearance: "header",
        options: { controls: [{ type: "copy" }, { type: "claude", label: "Ask Claude" }] },
      },
    ]);
  });

  it("passes custom controls through (string and {import, props} forms)", () => {
    const out = resolveContextControls(
      settingsWith([
        { type: "custom", component: "./components/Feedback" },
        { type: "custom", component: { import: "./components/Rate", props: { max: 5 } }, appearance: "toc-bottom" },
      ]),
      null,
      "docs/a",
    );
    expect(out).toHaveLength(2);
    expect(out[1]).toMatchObject({ appearance: "toc-bottom", component: { props: { max: 5 } } });
  });
});

describe("resolveContextControls — precedence (REPLACE)", () => {
  const global: ContextControls = ["copy", "chatgpt"];
  const frontmatter: ContextControls = [{ type: "content-version", options: { versions: [{ title: "A", page: "docs/a" }] } }];
  const entryControls: ContextControls = [{ type: "mcp", options: { url: "https://mcp.x" } }];

  it("global applies when nothing page-level exists", () => {
    const out = resolveContextControls(settingsWith(global), {} as Metadata, "docs/a");
    expect(out.map((c) => c.type)).toEqual(["copy", "chatgpt"]);
  });

  it("frontmatter REPLACES global; empty array opts out", () => {
    const out = resolveContextControls(settingsWith(global), { contextControls: frontmatter } as Metadata, "docs/a");
    expect(out.map((c) => c.type)).toEqual(["content-version"]);

    expect(resolveContextControls(settingsWith(global), { contextControls: [] } as unknown as Metadata, "docs/a")).toEqual([]);
  });

  it("sidebar entry beats frontmatter and global", () => {
    const settings = settingsWith(global, [
      { route: "docs", pages: [{ group: "G", pages: [{ page: "docs/a", contextControls: entryControls }] }] },
    ]);
    const out = resolveContextControls(settings, { contextControls: frontmatter } as Metadata, "docs/a");
    expect(out.map((c) => c.type)).toEqual(["mcp"]);
  });
});

describe("findSidebarContextControls — entry lookup", () => {
  const controls: ContextControls = ["copy"];

  it("finds leaf entries at any nesting, tolerating leading slashes", () => {
    const nav = {
      sidebar: [
        { route: "docs", pages: [
          { group: "G", pages: [
            { page: "docs/plain", title: "T" }, // titled ref WITHOUT controls
            { page: "docs/a", contextControls: controls },
            { group: "Nested", pages: [{ virtual: "docs/file.b", page: "docs/b", contextControls: controls }] },
          ]},
        ]},
      ],
      languages: [{ language: "pl", sidebar: [{ route: "pl/docs", pages: [{ page: "pl/docs/c", contextControls: controls }] }] }],
    };
    expect(findSidebarContextControls(nav as never, "/docs/a")).toBe(controls);
    expect(findSidebarContextControls(nav as never, "docs/b")).toBe(controls); // virtual form
    expect(findSidebarContextControls(nav as never, "pl/docs/c")).toBe(controls); // i18n sidebar
    expect(findSidebarContextControls(nav as never, "docs/plain")).toBeUndefined();
    expect(findSidebarContextControls(nav as never, "docs/missing")).toBeUndefined();
  });
});

describe("contextControlDefaults", () => {
  it("provides label/icon defaults for every built-in action", () => {
    for (const t of ["copy", "view-markdown", "chatgpt", "claude", "mcp"]) {
      const d = contextControlDefaults(t);
      expect(d.label).toBeTruthy();
      expect(d.icon).toBeTruthy();
    }
    expect(contextControlDefaults("nope").label).toBe("nope");
  });
});

// Type-level guard: one fixture exercising EVERY declared variant must
// satisfy the public type (compile-time check).
const _typeFixture: ContextControls = [
  "copy",
  "view-markdown",
  "chatgpt",
  "claude",
  { type: "copy", appearance: "toc-bottom", label: "Copy", icon: "copy", description: "d" },
  { type: "mcp", options: { url: "https://mcp.x" } },
  { type: "dropdown", options: { controls: ["copy", { type: "claude" }] } },
  { type: "content-version", options: { versions: [{ title: "Bun", page: "docs/bun/logs", icon: "zap", description: "runtime" }] } },
  { type: "custom", component: "./c" },
  { type: "custom", component: { import: "./c", props: { a: 1 } } },
];
void _typeFixture;

describe("content-version same-URL swap", () => {
  const swapControl = {
    type: "content-version" as const,
    appearance: "toc-top" as const,
    options: {
      queryParam: "runtime",
      versions: [
        { title: "Angular", source: "docs/logs.angular" },
        { title: "Bun Runtime", source: "docs/logs.bun", value: "bun" },
      ],
    },
  };
  const settings = settingsWith(undefined, [
    { route: "docs", pages: [{ page: "docs/logs", contextControls: [swapControl] }] },
  ]);

  it("contentVersionValue: explicit value wins, else slugified title", () => {
    expect(contentVersionValue({ title: "Bun Runtime", value: "bun" })).toBe("bun");
    expect(contentVersionValue({ title: "Bun Runtime" })).toBe("bun-runtime");
  });

  it("mode detection + normalization: swap vs navigate vs invalid mix", () => {
    expect(isContentVersionSwap(swapControl)).toBe(true);
    expect(isContentVersionSwap({ type: "content-version", options: { versions: [{ title: "A", page: "a" }] } })).toBe(false);
    // mixing page + source in one control is invalid → dropped by the resolver
    const mixed = settingsWith([
      { type: "content-version", options: { versions: [{ title: "A", page: "a" }, { title: "B", source: "b" }] } } as never,
    ]);
    expect(resolveContextControls(mixed, null, "docs/x")).toEqual([]);
  });

  it("resolveContentVersionSwap: configurable param selects the variant source", () => {
    expect(resolveContentVersionSwap(settings, null, "docs/logs", "runtime=bun")).toEqual({
      queryParam: "runtime",
      value: "bun",
      source: "docs/logs.bun",
    });
    // default (no param / unknown value) → first version
    expect(resolveContentVersionSwap(settings, null, "docs/logs", "")).toMatchObject({
      value: "angular",
      source: "docs/logs.angular",
    });
    expect(resolveContentVersionSwap(settings, null, "docs/logs", "runtime=nope")).toMatchObject({ value: "angular" });
    // the wrong param name changes nothing
    expect(resolveContentVersionSwap(settings, null, "docs/logs", "version=bun")).toMatchObject({ value: "angular" });
    // pages without a swap control → null
    expect(resolveContentVersionSwap(settings, null, "docs/other", "runtime=bun")).toBeNull();
  });

  it("a sourceless first version means 'the host page's own content'", () => {
    const hostDefault = settingsWith(undefined, [
      { route: "docs", pages: [{ page: "docs/logs", contextControls: [{
        type: "content-version",
        options: { versions: [{ title: "Default" }, { title: "Bun", source: "docs/logs.bun", value: "bun" }] },
      }] }] },
    ]);
    // default param name kicks in when queryParam is omitted
    expect(resolveContentVersionSwap(hostDefault, null, "docs/logs", "version=bun")).toEqual({
      queryParam: "version",
      value: "bun",
      source: "docs/logs.bun",
    });
    expect(resolveContentVersionSwap(hostDefault, null, "docs/logs", "")).toEqual({
      queryParam: "version",
      value: "default",
      source: undefined,
    });
  });
});
