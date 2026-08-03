import {OpenAPIV3} from "openapi-types";
import {JSONSchema} from "@apidevtools/json-schema-ref-parser";

export interface uniformOasOptions {
    regions?: string[] // Format: 'METHOD /path' e.g. 'GET /users'
}

export interface SelectorMethod {
    oapPath: OpenAPIV3.PathItemObject;

    path: string;

    httpMethod: "get" | "put" | "post" | "delete" | "patch";
}

export type OasJSONSchema = JSONSchema & {
    __internal_getRefPath?: () => string | string[];
}
