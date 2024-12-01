import path from 'path';

import Oas from 'oas';
import {OpenAPIV3} from "openapi-types";
import oasToSnippet from '@readme/oas-to-snippet';
import OpenAPISampler from 'openapi-sampler';
import type {JSONSchema7} from 'json-schema';

import {
    deferencedOpenAPI,
} from "../../src";


(async () => {
    const openApiPath = path.join(process.cwd(), './examples/basic/openapi.yaml'); // Ensure this file exists
    const schema = await deferencedOpenAPI(openApiPath)

    // TODO: fix any
    const oas = new Oas(schema as any);
    const operation = oas.operation('/todos', 'post');

    if (operation.schema.requestBody) {
        const body = operation.schema.requestBody as OpenAPIV3.RequestBodyObject
        const schema = body.content["application/json"].schema as JSONSchema7

        if (!schema) {
            return
        }

        const fakeData = OpenAPISampler.sample(schema)

        const {code} = oasToSnippet(oas, operation, {
            body: fakeData
        }, null, "node");
    }
})()