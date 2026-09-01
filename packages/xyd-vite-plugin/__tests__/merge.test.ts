import { describe, it } from "vitest";

import { testMerge } from "./utils";

const tests = [
    { name: "1.basic", description: "assets + page tree + public merged; sitemap/robots skipped; identical assets skipped" },
    { name: "2.asset-collision", description: "same asset name, different content -> merge fails loudly" },
    { name: "3.root-files-policy", description: "sitemap: copy lands when the host lacks one; robots stays skipped" },
    { name: "4.missing-basename", description: "docs built without advanced.basename -> hard error" },
    { name: "5.public-merge", description: "root public/ merges file-by-file, host-owned files survive" },
    { name: "6.base-mismatch", description: "base option not matching the output tree -> hard error" },
    { name: "7.vite-metadata", description: ".vite build metadata is never merged (host manifest survives)" },
];

describe("mergeDocsBuild", () => {
    for (const t of tests) {
        it(t.description, () => {
            testMerge(t.name);
        });
    }
});
