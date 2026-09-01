import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import matter from "gray-matter";

import { composeAsTocRaw, asTocHostFor, isAsTocSectionPage } from "../src";

/**
 * composeAsTocRaw builds ONE raw markdown for a sidebar-as-TOC host page:
 * frontmatter (always with `asTocHost: true`) + the host's intro + every
 * section wrapped in `<div id="<sectionId>" data-astoc-section>`.
 * The recipe comes from globalThis.__xydAsTocPages (set by plugin-docs boot).
 */
describe("composeAsTocRaw", () => {
    let tmpDir: string;
    let prevCwd: string;

    beforeEach(() => {
        prevCwd = process.cwd();
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "xyd-astoc-compose-"));
        process.chdir(tmpDir);
    });

    afterEach(() => {
        process.chdir(prevCwd);
        fs.rmSync(tmpDir, { recursive: true, force: true });
        delete (globalThis as any).__xydAsTocPages;
    });

    function write(rel: string, content: string) {
        const abs = path.join(tmpDir, rel);
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, content);
    }

    function setAsTocPages(hosts: any, pages: any = {}) {
        (globalThis as any).__xydAsTocPages = { hosts, pages };
    }

    it("returns null for non-host slugs", async () => {
        setAsTocPages({});
        expect(await composeAsTocRaw("index")).toBeNull();
        expect(asTocHostFor("index")).toBeNull();
    });

    it("composes intro + wrapped sections and flags asTocHost in frontmatter", async () => {
        write("index.md", "---\ntitle: Welcome\n---\n\nIntro text.\n");
        write("os/linux.md", "---\ntitle: Linux\n---\n\n# Linux\n\nLinux content.\n");
        write("os/windows.md", "---\ntitle: Windows\n---\n\nWindows content without heading.\n");
        setAsTocPages({
            index: {
                indexFile: "index.md",
                sections: [
                    { page: "os/linux", file: "os/linux.md", id: "os-linux" },
                    { page: "os/windows", file: "os/windows.md", id: "os-windows" },
                ],
            },
        });

        const composed = await composeAsTocRaw("index");
        expect(composed).not.toBeNull();
        expect(composed!.filePath).toBe("index.md");

        const parsed = matter(composed!.raw);
        // host frontmatter preserved + flagged
        expect(parsed.data.title).toBe("Welcome");
        expect(parsed.data.asTocHost).toBe(true);
        // intro first, then sections in order
        const linuxAt = parsed.content.indexOf('<div id="os-linux" data-astoc-section>');
        const windowsAt = parsed.content.indexOf('<div id="os-windows" data-astoc-section>');
        expect(parsed.content.indexOf("Intro text.")).toBeGreaterThanOrEqual(0);
        expect(linuxAt).toBeGreaterThan(parsed.content.indexOf("Intro text."));
        expect(windowsAt).toBeGreaterThan(linuxAt);
        // section frontmatter is stripped, content kept
        expect(parsed.content).not.toContain("title: Linux");
        expect(parsed.content).toContain("Linux content.");
        // a section without a leading heading gets one from its title
        expect(parsed.content).toContain("# Windows\n\nWindows content without heading.");
        // a section WITH a heading is not double-titled
        expect(parsed.content).not.toContain("# Linux\n\n# Linux");
    });

    it("synthesizes frontmatter when the host has no intro file", async () => {
        write("os/linux.md", "---\ntitle: Linux\n---\n\ncontent\n");
        setAsTocPages({
            index: {
                indexFile: "",
                sections: [{ page: "os/linux", file: "os/linux.md", id: "os-linux" }],
            },
        });

        const composed = await composeAsTocRaw("index");
        expect(composed!.filePath).toBe("index.md");
        const parsed = matter(composed!.raw);
        expect(parsed.data).toEqual({ asTocHost: true });
        expect(parsed.content).toContain('data-astoc-section');
    });

    it("skips sections whose file vanished", async () => {
        write("a.md", "---\ntitle: A\n---\n\na\n");
        setAsTocPages({
            index: {
                indexFile: "",
                sections: [
                    { page: "a", file: "a.md", id: "a" },
                    { page: "gone", file: "gone.md", id: "gone" },
                ],
            },
        });

        const composed = await composeAsTocRaw("index");
        expect(composed!.raw).toContain('<div id="a"');
        expect(composed!.raw).not.toContain('id="gone"');
    });

    it("normalizes the slug (leading slash / empty → index) and resolves route hosts", async () => {
        write("docs.md", "---\ntitle: Docs\n---\n\nintro\n");
        write("s.md", "s content\n");
        setAsTocPages(
            {
                docs: { indexFile: "docs.md", sections: [{ page: "s", file: "s.md", id: "s" }] },
            },
            { s: { host: "docs", id: "s" } }
        );

        expect(await composeAsTocRaw("/docs")).not.toBeNull();
        expect(await composeAsTocRaw("index")).toBeNull();
        expect(isAsTocSectionPage("s")).toBe(true);
        expect(isAsTocSectionPage("/s")).toBe(true);
        expect(isAsTocSectionPage("other")).toBe(false);
    });
});
