import { describe, expect, it } from "vitest";

import { composeRewrites } from "../src/index";

const OURS = [{ source: "/docs/:path*", destination: "/docs/:path*.html" }];

describe("composeRewrites", () => {
    it("no user rewrites -> ours land in afterFiles", async () => {
        expect(await composeRewrites(undefined, OURS)).toEqual({
            beforeFiles: [],
            afterFiles: OURS,
            fallback: [],
        });
    });

    it("array-form user rewrites keep afterFiles semantics, ours appended", async () => {
        const user = [{ source: "/a", destination: "/b" }];
        expect(await composeRewrites(user, OURS)).toEqual({
            beforeFiles: [],
            afterFiles: [...user, ...OURS],
            fallback: [],
        });
    });

    it("object-form user rewrites are preserved, ours appended to afterFiles", async () => {
        const user = {
            beforeFiles: [{ source: "/x", destination: "/y" }],
            afterFiles: [{ source: "/a", destination: "/b" }],
            fallback: [{ source: "/f", destination: "/g" }],
        };
        const out = await composeRewrites(user, OURS);
        expect(out.beforeFiles).toEqual(user.beforeFiles);
        expect(out.fallback).toEqual(user.fallback);
        expect(out.afterFiles).toEqual([...user.afterFiles, ...OURS]);
    });

    it("function-form user rewrites are awaited", async () => {
        const user = async () => [{ source: "/a", destination: "/b" }];
        const out = await composeRewrites(user, OURS);
        expect(out.afterFiles).toEqual([{ source: "/a", destination: "/b" }, ...OURS]);
    });
});
