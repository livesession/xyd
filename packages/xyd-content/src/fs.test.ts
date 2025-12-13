import {remarkDefinitionList, defListHastHandlers} from 'remark-definition-list';
import {describe, expect, it} from "vitest";

import {markdownPlugins} from "../packages/md";
import {ContentFS} from "./fs";

const md = `
Test for defList.

Apple
:   Pomaceous fruit of plants of the genus Malus in
    the family Rosaceae.

Orange
:   The fruit of an evergreen tree of the genus Citrus.
`;

describe("ContentFS", () => {
    it("compiles markdown using markdownPlugins (definition list)", async () => {
        const {remarkPlugins, rehypePlugins, recmaPlugins} = await markdownPlugins(
            {},
            {} as any
        );

        const contentFs = new ContentFS(
            {} as any,
            [remarkDefinitionList, ...remarkPlugins],
            rehypePlugins,
            recmaPlugins,
            defListHastHandlers,
        );

        const compiled = await contentFs.compileContent(md);

        expect(typeof compiled).toBe("string");
        console.log(compiled)
        expect(compiled).toContain("Pomaceous fruit of plants of the genus Malus");
        expect(compiled).toContain(
            "The fruit of an evergreen tree of the genus Citrus."
        );
    });
});
