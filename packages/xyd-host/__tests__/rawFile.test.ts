import { afterEach, describe, expect, it } from "vitest";

import { rawRouteKey } from "../app/basename";
import { loader } from "../app/rawFile";

// `__xydRawRouteFiles` is keyed by file paths as written; request pathnames
// arrive percent-encoded. A page whose name has a space or a non-ASCII
// character must still find its raw file (its `.md` twin, its llms.txt link),
// or the prerender aborts on its first request.
describe("rawRouteKey", () => {
  it("decodes the pathname before the basename comes off", () => {
    expect(rawRouteKey("/guides/my%20page.md", undefined)).toBe("/guides/my page.md");
    expect(rawRouteKey("/docs/guides/my%20page.md", "/docs")).toBe("/guides/my page.md");
    expect(rawRouteKey("/docs/caf%C3%A9.md", "/docs")).toBe("/café.md");
    expect(rawRouteKey("/a%23b.md", undefined)).toBe("/a#b.md");
  });

  it("strips a basename that itself needs escaping", () => {
    expect(rawRouteKey("/my%20docs/llms.txt", "/my docs")).toBe("/llms.txt");
  });

  it("leaves a plain pathname as it is", () => {
    expect(rawRouteKey("/llms.txt", undefined)).toBe("/llms.txt");
    expect(rawRouteKey("/docs/llms.txt", "/docs")).toBe("/llms.txt");
  });

  it("keeps a malformed escape as it came", () => {
    expect(rawRouteKey("/100%.md", undefined)).toBe("/100%.md");
    expect(rawRouteKey("/docs/%E0%A4%A.md", "/docs")).toBe("/%E0%A4%A.md");
  });
});

describe("raw file loader", () => {
  const previousFiles = globalThis.__xydRawRouteFiles;
  const previousSettings = (globalThis as any).__xydSettings;

  afterEach(() => {
    globalThis.__xydRawRouteFiles = previousFiles;
    (globalThis as any).__xydSettings = previousSettings;
  });

  const get = (pathname: string) => loader({ request: new Request(`http://localhost${pathname}`) });

  it("serves a file whose name has a space, at the root and under a basename", async () => {
    globalThis.__xydRawRouteFiles = { "/guides/my page.md": "# My page\n" };

    const atRoot = await get("/guides/my page.md");
    expect(atRoot.status).toBe(200);
    expect(await atRoot.text()).toBe("# My page\n");
    expect(atRoot.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");

    (globalThis as any).__xydSettings = { advanced: { basename: "/docs" } };
    const mounted = await get("/docs/guides/my%20page.md");
    expect(await mounted.text()).toBe("# My page\n");
  });

  it("falls back to the pathname as it came for a key that holds an escape", async () => {
    globalThis.__xydRawRouteFiles = { "/a%20b.md": "escaped" };
    expect(await (await get("/a%20b.md")).text()).toBe("escaped");
  });

  it("answers 404 for a file it does not have", async () => {
    globalThis.__xydRawRouteFiles = {};
    await expect(get("/missing.md")).rejects.toMatchObject({ status: 404 });
  });
});
