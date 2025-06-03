import path from "path";
import fs from "fs";

import yaml from "js-yaml";
import {OpenAPIV3} from "openapi-types";
import GithubSlugger from 'github-slugger';
import $refParser, {ParserOptions} from "@apidevtools/json-schema-ref-parser";

import {ReferenceType} from "@xyd-js/uniform";

import {OasJSONSchema} from "./types";

export function slug(str: string): string {
    const slugger = new GithubSlugger();
    return slugger.slug(str);
}

// deferencedOpenAPI reads an OpenAPI spec file and returns a dereferenced OpenAPIV3.Document
// dereferenced means that all $ref references are resolved automatically
export async function deferencedOpenAPI(openApiPath: string) {
    const openApiSpec = readOpenApiSpec(openApiPath);

    const options = {
        dereference: {
            onDereference(
                path: string,
                value: OasJSONSchema,
                parent?: OasJSONSchema,
            ) {
                value.__internal_getRefPath = () => path
                if (parent) {
                    parent.__internal_getRefPath = () => path
                }
            },
        },
    } as ParserOptions;

    await $refParser.dereference(openApiSpec, options);

    return openApiSpec as OpenAPIV3.Document
}

// TODO: support from url?
// readOpenApiSpec reads an OpenAPI spec file and returns the content
function readOpenApiSpec(filePath: string) {
    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath, 'utf-8');

    if (ext === '.yaml' || ext === '.yml') {
        return yaml.load(content);
    } else if (ext === '.json') {
        return JSON.parse(content);
    } else {
        throw new Error('Unsupported file format. Use JSON or YAML.');
    }
}

// httpMethodToUniformMethod converts an HTTP method to a uniform ReferenceType
export function httpMethodToUniformMethod(method: string): ReferenceType | null {
    switch (method) {
        case 'get':
            return ReferenceType.REST_HTTP_GET
        case 'put':
            return ReferenceType.REST_HTTP_PUT
        case 'patch':
            return ReferenceType.REST_HTTP_PATCH
        case 'post':
            return ReferenceType.REST_HTTP_POST
        case 'delete':
            return ReferenceType.REST_HTTP_DELETE
        case 'options':
            return ReferenceType.REST_HTTP_OPTIONS
        case 'head':
            return ReferenceType.REST_HTTP_HEAD
        case 'trace':
            return ReferenceType.REST_HTTP_TRACE
        default:
            return null
    }
}

