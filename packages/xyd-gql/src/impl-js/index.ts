// @xyd-js/gql public API (S6+ W1 shim): dispatches to the Rust core
// (crates/xyd_gql via @xyd-js/native) when present, else to the FROZEN JS
// implementation in ./impl-js (bugfix-only; deleted at reap once
// @xyd-js/native platform packages have shipped).
//
// The signature is byte-identical to the original ./impl-js/schema export.
import type { Reference } from "@xyd-js/uniform";

import { native } from "./native";
import { gqlSchemaToReferences as jsGqlSchemaToReferences } from "./impl-js/schema";
import type { GQLSchemaToReferencesOptions } from "./impl-js/types";

export async function gqlSchemaToReferences(
    schemaLocation: string | string[],
    options?: GQLSchemaToReferencesOptions
): Promise<Reference[]> {
    if (native?.gqlSchemaToReferences) {
        const locations = Array.isArray(schemaLocation) ? schemaLocation : [schemaLocation];
        // URLs are fetched HERE (JS) — the native layer reads files / raw SDL
        // only (no network in the Rust core).
        const sources = await Promise.all(
            locations.map(async (location) => {
                if (location.startsWith("http://") || location.startsWith("https://")) {
                    const response = await fetch(location);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch schema from URL: ${location}`);
                    }
                    return response.text();
                }
                return location;
            })
        );

        const { references, route } = JSON.parse(
            native.gqlSchemaToReferences(sources, options ? JSON.stringify(options) : undefined)
        );
        if (route) {
            // Non-serializable thunk consumed by plugin-docs' graphql preset —
            // reattached from the native envelope (JSON can't carry functions).
            references.__UNSAFE_route = () => route;
        }
        return references;
    }

    return jsGqlSchemaToReferences(schemaLocation, options);
}
