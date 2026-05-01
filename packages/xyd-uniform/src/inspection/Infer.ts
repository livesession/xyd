import type {Reference} from "../types";
import type {Infer as IInfer, PlayOptions} from "./types";
import {ValueMap} from "./ValueMap";
import {createPlayProxy} from "./play";

export class InferImpl<T = any> implements IInfer<T> {
    readonly reference: Reference
    private valueMap: ValueMap
    private instance: T

    constructor(instance: T, reference: Reference) {
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

export function infer<T>(instance: T, reference: Reference): IInfer<T> {
    return new InferImpl(instance, reference)
}
