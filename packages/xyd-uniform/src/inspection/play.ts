import type {InspectionHooks, PlayOptions, PlayPlugin, PlayPluginContext} from "./types";
import type {Reference} from "../types";
import type {ValueMap} from "./ValueMap";

const proxyToInferMap = new WeakMap<object, { valueMap: ValueMap; reference: Reference }>()

export function getInferFromProxy(proxy: any): { valueMap: ValueMap; reference: Reference } | undefined {
    return proxyToInferMap.get(proxy)
}

export function createPlayProxy<T>(
    instance: T,
    reference: Reference,
    valueMap: ValueMap,
    options?: PlayOptions,
): T {
    const hooks: InspectionHooks[] = []
    const subscribers: Set<() => void> = new Set()

    const context: PlayPluginContext = {
        reference,
        registerHooks(h: InspectionHooks) {
            hooks.push(h)
        },
        refresh() {
            valueMap.populate(instance)
        },
        subscribe(listener: () => void) {
            subscribers.add(listener)
            return () => subscribers.delete(listener)
        },
    }

    for (const plugin of options?.plugins || []) {
        plugin.setup(context)
    }

    function notify() {
        for (const listener of subscribers) {
            listener()
        }
    }

    function createPropertyProxy(target: any, prefix: string): any {
        return new Proxy(target, {
            get(_target, prop) {
                if (typeof prop === "symbol") return Reflect.get(_target, prop)

                const path = prefix ? `${prefix}.${String(prop)}` : String(prop)
                const value = valueMap.get(path)

                for (const h of hooks) {
                    h.get?.(path, value)
                }

                if (typeof value === "function") {
                    return (...args: any[]) => {
                        const returnValue = value.apply(instance, args)
                        for (const h of hooks) {
                            h.call?.(path, args, returnValue)
                        }
                        return returnValue
                    }
                }

                if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                    return createPropertyProxy(value, path)
                }

                return value
            },

            set(_target, prop, newValue) {
                if (typeof prop === "symbol") return Reflect.set(_target, prop, newValue)

                const path = prefix ? `${prefix}.${String(prop)}` : String(prop)
                const oldValue = valueMap.set(path, newValue)

                for (const h of hooks) {
                    h.set?.(path, oldValue, newValue)
                }

                notify()
                return true
            },
        })
    }

    const proxy = createPropertyProxy(instance, "") as T

    proxyToInferMap.set(proxy as object, {valueMap, reference})

    return proxy
}
