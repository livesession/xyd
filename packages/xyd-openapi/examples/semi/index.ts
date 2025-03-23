import path from 'path';

import {
    deferencedOpenAPI,
    oapSchemaToReferences,
} from "../../src";
import fs from "fs";

(async () => {
    const openApiPath = path.join(process.cwd(), './examples/semi/openapi.yaml');
    const schema = await deferencedOpenAPI(openApiPath)
    const references = oapSchemaToReferences(schema)

    fs.writeFileSync(path.join(process.cwd(), './examples/semi/references.json'), JSON.stringify(references, null, 2))
})()

