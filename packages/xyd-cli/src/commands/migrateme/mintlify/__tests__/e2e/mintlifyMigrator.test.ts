import path from "node:path";
import {fileURLToPath} from "node:url";

import {describe, expect, it} from 'vitest'

import {mintlifyMigrator} from "../../mintlify";
import {cloneRepoIfNeeded} from "../utils";
import {cloneDocsPath} from "../../../migration";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsRepos = {
    chatwoot: "https://github.com/chatwoot/docs",
    // continue: "https://github.com/continuedev/continue/tree/main/docs", // TODO:
    hoppscotch: "https://github.com/hoppscotch/docs",
    // modelcontextprotocol: "https://github.com/modelcontextprotocol/modelcontextprotocol/tree/main/docs", // TODO:
    phare: "https://github.com/phare/docs",
    stellarco: "https://github.com/stellarco/docs",
    teardownDev: "https://github.com/teardown-dev/docs",
    trunk: "https://github.com/trunk/docs",
    winwinkit: "https://github.com/winwinkit/docs",
}

describe("mintlifyMigrator", {timeout: 15000}, () => {
    const fixtures = path.resolve(__dirname, "../../", "__fixtures__/.data");

    const getDocsPath = (name: string) => path.join(fixtures, `1.e2e.${name}`);
    const getOutDir = (name: string) => path.join(fixtures, `1.e2e.${name}_output`);

    describe("Public Docs Repos (1.e2e)", () => {
        for (const [name, url] of Object.entries(docsRepos)) {
            it(name, async () => {
                const docsPath = getDocsPath(name);
                const outDir = getOutDir(name);

                // Clone the repository if it doesn't exist
                await cloneRepoIfNeeded(name, url, docsPath);

                const out = await cloneDocsPath(docsPath, outDir)

                await mintlifyMigrator(out, {
                    verbose: false,
                });
            })
        }
    })
});
