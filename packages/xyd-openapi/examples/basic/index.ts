import path from 'path';

import {
    deferencedOpenAPI,
    oapSchemaToReferences,
} from "../../src";

(async () => {
    const openApiPath = path.join(process.cwd(), './examples/livesession/openapi.yaml'); // Ensure this file exists
    const schema = await deferencedOpenAPI(openApiPath)
    const references = oapSchemaToReferences(schema)
})()

// (async () => {
//     const openApiPath = path.join(process.cwd(), './examples/basic/openapi.yaml'); // Ensure this file exists
//     const schema = await deferencedOpenAPI(openApiPath)
//     const references = oapSchemaToReferences(schema)
//
//     console.log(JSON.stringify(references, null, 2))
// })()