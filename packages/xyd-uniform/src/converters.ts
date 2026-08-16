// Dispatcher (S6+ W3): uniformToInputJsonSchema converts in Rust
// (crates/xyd_uniform::converters) when the native core is present; the
// frozen JS impl otherwise. uniformPropertiesToJsonSchema (the per-property
// helper) has no separate native entry — it stays on the JS impl.
import type { JSONSchema7 } from "json-schema";

import type { Reference } from "./types";
import { native } from "./native";
import {
    uniformToInputJsonSchema as jsUniformToInputJsonSchema,
} from "./impl-js/converters";

export { uniformPropertiesToJsonSchema } from "./impl-js/converters";

export function uniformToInputJsonSchema(reference: Reference): JSONSchema7 | null {
    if (native?.uniformToInputJsonSchema) {
        return JSON.parse(native.uniformToInputJsonSchema(JSON.stringify(reference)));
    }
    return jsUniformToInputJsonSchema(reference);
}
