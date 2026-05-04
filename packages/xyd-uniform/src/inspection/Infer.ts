import type {Reference} from "../types";
import type {Infer as IInfer, PlayOptions} from "./types";
import {ValueMap} from "./ValueMap";
import {createPlayProxy} from "./play";

export class InferImpl<T = any> implements IInfer<T> {
    readonly reference: Reference
    private valueMap: ValueMap
    private instance: T

    constructor(reference: Reference, instance: T) {
        this.instance = instance
        this.reference = Object.freeze(structuredClone(reference))
        this.valueMap = new ValueMap()
        this.valueMap.populate(instance)
    }

    play(options?: PlayOptions): T {
        return createPlayProxy(this.instance, this.reference, this.valueMap, options)
    }

    snapshot(): Record<string, any> {
        return this.valueMap.snapshot()
    }

    reset() {
        this.valueMap.reset()
    }
}

export function infer<T>(reference: Reference, instance: T): IInfer<T> {
    return new InferImpl(reference, instance)
}
