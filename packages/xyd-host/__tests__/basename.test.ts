import { describe, expect, it } from "vitest";

import { stripBasename } from "../app/basename";

// The raw-file loader (app/rawFile.ts) keys `__xydRawRouteFiles` by the
// basename-relative path React Router registered, while request.url carries
// the mounted pathname — these are the shapes that lookup has to survive.
describe("stripBasename", () => {
  it("returns the pathname untouched without a basename", () => {
    expect(stripBasename("/llms.txt", undefined)).toBe("/llms.txt");
    expect(stripBasename("/llms.txt", "")).toBe("/llms.txt");
    expect(stripBasename("/llms.txt", "/")).toBe("/llms.txt");
  });

  it("strips a single-segment basename", () => {
    expect(stripBasename("/docs/llms.txt", "/docs")).toBe("/llms.txt");
    expect(stripBasename("/docs/guides/intro.md", "/docs")).toBe("/guides/intro.md");
  });

  it("strips a multi-segment basename", () => {
    expect(stripBasename("/docs/llms.txt", "/docs")).toBe("/llms.txt");
    expect(stripBasename("/docs/objects/Book.md", "/docs")).toBe("/objects/Book.md");
  });

  it("ignores a trailing slash on the basename", () => {
    expect(stripBasename("/docs/llms.txt", "/docs/")).toBe("/llms.txt");
  });

  it("maps the bare basename to the root", () => {
    expect(stripBasename("/docs", "/docs")).toBe("/");
    expect(stripBasename("/docs/", "/docs")).toBe("/");
  });

  it("only strips on a segment boundary", () => {
    expect(stripBasename("/docsx/llms.txt", "/docs")).toBe("/docsx/llms.txt");
    expect(stripBasename("/other/llms.txt", "/docs")).toBe("/other/llms.txt");
  });
});
