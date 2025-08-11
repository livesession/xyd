import {OpenAPIV3} from "openapi-types";
import {XDocs} from "./types";

export function xDocsLanguages(oasDoc: OpenAPIV3.Document): string[] | null {
    const xDocs = getXDocs(oasDoc);
    if (!xDocs) {
        return null
    }

    return xDocs?.codeLanguages ?? null
}

export function getXDocs(oasDoc: OpenAPIV3.Document): XDocs | null {
    if (!("x-docs" in oasDoc)) {
        return null
    }
    return oasDoc["x-docs"] as XDocs | null
}