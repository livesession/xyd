import path from "path";
import fs from "fs";

import yaml from "js-yaml";
import $refParser from "json-schema-ref-parser";
import { OpenAPIV3 } from "openapi-types";
import GithubSlugger from 'github-slugger';

import { DefinitionPropertyMeta, ReferenceType } from "@xyd-js/uniform";

export function slug(str: string): string {
    const slugger = new GithubSlugger();
    return slugger.slug(str);
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

// deferencedOpenAPI reads an OpenAPI spec file and returns a dereferenced OpenAPIV3.Document
// dereferenced means that all $ref references are resolved automatically
export async function deferencedOpenAPI(openApiPath: string) {
    const openApiSpec = readOpenApiSpec(openApiPath);

    //@ts-ignore TODO: fix ts
    await $refParser.dereference(openApiSpec);

    return openApiSpec as OpenAPIV3.Document
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
        // case 'options':
        //     return ReferenceType.REST_HTTP_OPTIONS
        // case 'head':
        //     return ReferenceType.REST_HTTP_HEAD
        // case 'trace':
        //     return ReferenceType.REST_HTTP_TRACE
        default:
            return null
    }
}

// schemaToRequestBody generates a request body from an OpenAPI schema
function schemaToRequestBody(schema: OpenAPIV3.SchemaObject): string {
    const requestBody: any = {};

    if (schema.type === 'object' && schema.properties) {
        for (const [key, value] of Object.entries(schema.properties)) {
            if ((value as OpenAPIV3.SchemaObject).default !== undefined) {
                requestBody[key] = (value as OpenAPIV3.SchemaObject).default;
            } else {
                requestBody[key] = null; // or some placeholder value
            }
        }
    }

    return JSON.stringify(requestBody);
}

// generateRequestInitFromOpenAPIObject generates a RequestInit object from an OpenAPI object
export function generateRequestInitFromOapOperation(
    urlPath: string,
    operation: OpenAPIV3.OperationObject
): { url: string, reqInit: RequestInit } {
    const reqInit: RequestInit = {}
    let queryParams = '';

    if (operation.parameters) {
        const parameters = operation.parameters as OpenAPIV3.ParameterObject[]

        const params = new URLSearchParams(
            Object.entries(parameters).map(([key, value]) => [key, String(value)])
        ).toString();

        queryParams += `?${params}`;
    }

    if (operation.requestBody) {
        const reqBody = operation.requestBody as OpenAPIV3.RequestBodyObject;
        const contentType = Object.keys(reqBody.content || {})[0];

        if (contentType === "application/json") {
            const schema = reqBody.content['application/json'].schema as OpenAPIV3.SchemaObject

            reqInit.body = schemaToRequestBody(schema);
            reqInit.headers = {
                'Content-Type': 'application/json',
            }
        }
    }

    return {
        url: `${urlPath}${queryParams}`,
        reqInit,
    };
}


export function objectPropMeta(objProp: OpenAPIV3.SchemaObject | OpenAPIV3.ParameterObject, name: string) {
    const meta: DefinitionPropertyMeta[] = []
    if (!objProp) {
        return meta
    }

    if (typeof objProp.required === "boolean" && objProp.required) {
        meta.push({
            name: "required",
            value: "true"
        })
    } else if (Array.isArray(objProp.required)) {
        for (const req of objProp.required) {
            if (req === name) {
                meta.push({
                    name: "required",
                    value: "true"
                })
            }
        }
    }

    if (objProp.deprecated) {
        meta.push({
            name: "deprecated",
            value: "true"
        })
    }

    if ("default" in objProp) {
        meta.push({
            name: "defaults",
            value: objProp.default
        })
    }

    if ("nullable" in objProp) {
        meta.push({
            name: "nullable",
            value: "true"
        })
    }

    return meta
}