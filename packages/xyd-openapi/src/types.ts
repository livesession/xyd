import {OpenAPIV3} from "openapi-types";

export interface oapSchemaToReferencesOptions {
    regions?: string[] // Format: 'METHOD /path' e.g. 'GET /users'
}


export interface SelectorMethod {
    oapPath: OpenAPIV3.PathItemObject;

    path: string;

    httpMethod: "get" | "put" | "post" | "delete" | "patch";
}