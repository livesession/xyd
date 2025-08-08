import path from "node:path";
import {fileURLToPath} from "node:url";

import {describe, expect, it} from 'vitest'

import {mintlifyMigrator} from "../mintlify";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("mintlifyMigrator", {timeout: 15000}, () => {
    it("1.e2e.chatwoot", async () => {
        const testDir = path.resolve(__dirname, "..", "__fixtures__", "1.e2e.chatwoot");
        await mintlifyMigrator(testDir, true)
    })
});