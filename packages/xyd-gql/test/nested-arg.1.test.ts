import path from "path";

import {beforeEach, describe, expect, it} from 'vitest'

import {gqlSchemaToReferences} from "../src";

describe('nested-arg', async () => {
    beforeEach(() => {
    })

    it('1.deep', async () => {
        const schemaLocation = path.join(process.cwd(), "./examples/nested/nested-arg.1.deep.graphqls")

        const references = await gqlSchemaToReferences(schemaLocation)

        // console.log(JSON.stringify(references, null, 2))
        // expect(references).toEqual()
    })
})