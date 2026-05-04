import type {Reference} from "../types";
import {getInferFromProxy} from "./play";

export function uniform(proxy: any): {
    json(): Record<string, any>
    reference(): Reference
} {
    const inferData = getInferFromProxy(proxy)
    if (!inferData) {
        throw new Error("uniform(): argument is not an InferProxy. Use infer().play() to create one.")
    }

    return {
        json() {
            return inferData.valueMap.toJSON()
        },
        reference() {
            return inferData.reference
        },
    }
}
