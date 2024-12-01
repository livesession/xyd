import path from 'path';

import {gqlSchemaToReferences} from "../../src";

// TODO: support multi graphql files
// TODO: !!! CIRCULAR_DEPENDENCY !!!
// TODO: sort by tag??
(async () => {
    const schemaLocation = path.join(process.cwd(), "./examples/basic/todo-app.graphqls")

    const references = await gqlSchemaToReferences(schemaLocation)
})()