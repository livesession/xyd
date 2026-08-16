// @xyd-js/openapi public API (S6+ W2 shim): the CONVERSION dispatches to the
// Rust core (crates/xyd_openapi via @xyd-js/native) when present; endpoint
// code-sample generation stays here in JS (@readme/oas-to-snippet) as a
// post-pass over the Rust references — the exact seam the migration plan
// prescribes (oas-schema.ts:83 had the single call site). Everything else
// re-exports the FROZEN impl in ./impl-js (bugfix-only until reap).

import Oas from "oas";
import type { OpenAPIV3 } from "openapi-types";

import type { Reference, OpenAPIReferenceContext } from "@xyd-js/uniform";

import { native, NATIVE_SOURCE } from "./native";
import {
    deferencedOpenAPI as jsDeferencedOpenAPI,
    oapSchemaToReferences as jsOapSchemaToReferences,
} from "./impl-js";
import { oapExamples } from "./impl-js/converters/oas-examples";
import type { uniformOasOptions } from "./impl-js/types";

// The frozen secondary surface stays JS (consumed across the monorepo).
export * from "./impl-js/const";
export * from "./impl-js/converters/oas-parameters";
export * from "./impl-js/converters/oas-paths";
export * from "./impl-js/oas-core";
export * from "./impl-js/converters/oas-requestBody";
export * from "./impl-js/converters/oas-responses";
export * from "./impl-js/utils";
export * from "./impl-js/xdocs/types";
export { getXDocs } from "./impl-js/xdocs";
export { uniformPluginXDocsSidebar } from "./impl-js/xdocs/pluginSidebar";
export { oapExamples } from "./impl-js/converters/oas-examples";
export type { uniformOasOptions, SelectorMethod, OasJSONSchema } from "./impl-js/types";

/** Same JS deref as always (the cyclic doc feeds the examples post-pass and
 *  the __UNSAFE_selector thunks) — plus a non-enumerable stash of the SOURCE
 *  so oapSchemaToReferences can hand it to the Rust converter. */
export async function deferencedOpenAPI(openApiPath: string) {
    const doc = await jsDeferencedOpenAPI(openApiPath);
    if (doc && typeof doc === "object") {
        Object.defineProperty(doc, NATIVE_SOURCE, {
            value: openApiPath,
            enumerable: false,
            configurable: true,
        });
    }
    return doc;
}

export function oapSchemaToReferences(
    schema: OpenAPIV3.Document,
    options?: uniformOasOptions
): Reference[] {
    const source: string | undefined = (schema as any)?.[NATIVE_SOURCE];
    const isLocalFile =
        typeof source === "string" &&
        !source.startsWith("http://") &&
        !source.startsWith("https://");

    // Native path: local-file specs converted end-to-end in Rust (its own deref
    // — no cyclic-object marshalling), then the JS post-passes below. URL specs
    // (rare; may carry external-file refs) stay on the JS impl.
    if (native?.oapSchemaToReferencesFromFile && isLocalFile) {
        const references: Reference[] = JSON.parse(
            native.oapSchemaToReferencesFromFile(
                source,
                options ? JSON.stringify(options) : undefined
            )
        );

        fillEndpointExamplesAndSelectors(references, schema, options);
        return references;
    }

    return jsOapSchemaToReferences(schema, options);
}

/** The JS post-pass over Rust references: endpoint code samples (oapExamples —
 *  request curl/JS/Python/Go tabs + response body samples), the
 *  __UNSAFE_selector thunks, and the __internal_options array thunk — all the
 *  non-serializable surface JSON can't carry. */
function fillEndpointExamplesAndSelectors(
    references: Reference[],
    schema: OpenAPIV3.Document,
    options?: uniformOasOptions
) {
    // Orchestrator server accumulation (oas-schema.ts mutates schema.servers
    // before building examples — snippet URLs depend on it).
    if (!schema.servers) {
        schema.servers = [];
    }
    for (const oapPath of Object.values(schema.paths || {})) {
        const pathServers = (oapPath as OpenAPIV3.PathItemObject)?.servers;
        if (pathServers?.length) {
            for (const pathServer of pathServers) {
                if (!schema.servers.find((s) => s.url === pathServer.url)) {
                    schema.servers.push(pathServer);
                }
            }
        }
    }

    const oas = new Oas(schema as any);

    for (const reference of references) {
        const ctx = reference.context as OpenAPIReferenceContext | undefined;

        if (reference.type === "rest_component_schema") {
            const componentName = ctx?.componentSchema;
            const componentSchema = componentName
                ? (schema.components?.schemas?.[componentName] as OpenAPIV3.SchemaObject)
                : undefined;
            reference.__UNSAFE_selector = function __UNSAFE_selector(selector: string) {
                switch (selector) {
                    case "[schema]":
                        return schema;
                    case "[component]":
                        return componentSchema;
                    default:
                        return null;
                }
            };
            continue;
        }

        const httpMethod = ctx?.method;
        const endpointPath = ctx?.path;
        if (!httpMethod || !endpointPath) {
            continue;
        }

        const operation = oas.operation(endpointPath, httpMethod as any);
        reference.examples.groups = oapExamples(oas, operation);

        const oapPath = schema.paths?.[endpointPath] as OpenAPIV3.PathItemObject;
        const oapMethod = oapPath?.[
            httpMethod as keyof OpenAPIV3.PathItemObject
        ] as OpenAPIV3.OperationObject;
        reference.__UNSAFE_selector = function __UNSAFE_selector(selector: string) {
            switch (selector) {
                case "[schema]":
                    return schema;
                case "[method]":
                    return { oapPath, httpMethod, path: endpointPath };
                case "[method] [path]":
                    return oapMethod;
                default:
                    return null;
            }
        };
    }

    // @ts-ignore — the array thunk the uniform preset reads.
    references.__internal_options = () => options;
}
