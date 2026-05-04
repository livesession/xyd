export class ValueMap {
    private values: Map<string, any>
    private initial: Map<string, any>

    constructor() {
        this.values = new Map()
        this.initial = new Map()
    }

    populate(instance: any, prefix = "") {
        if (instance == null || typeof instance !== "object") return

        for (const key of Object.keys(instance)) {
            const path = prefix ? `${prefix}.${key}` : key
            const value = instance[key]

            this.values.set(path, value)
            this.initial.set(path, value)

            if (typeof value === "object" && value !== null && !Array.isArray(value) && typeof value !== "function") {
                this.populate(value, path)
            }
        }
    }

    get(path: string): any {
        return this.values.get(path)
    }

    set(path: string, value: any): any {
        const old = this.values.get(path)
        this.values.set(path, value)
        return old
    }

    has(path: string): boolean {
        return this.values.has(path)
    }

    snapshot(): Record<string, any> {
        return Object.freeze(this.toJSON())
    }

    reset() {
        this.values = new Map(this.initial)
    }

    toJSON(): Record<string, any> {
        const result: Record<string, any> = {}

        for (const [path, value] of this.values) {
            if (path.includes(".")) continue // skip nested paths, reconstruct from top-level

            if (typeof value === "function") {
                continue // skip functions in JSON output
            }

            if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                result[path] = this.buildNested(path)
            } else {
                result[path] = value
            }
        }

        return result
    }

    private buildNested(prefix: string): Record<string, any> {
        const result: Record<string, any> = {}
        const dotPrefix = `${prefix}.`

        for (const [path, value] of this.values) {
            if (!path.startsWith(dotPrefix)) continue

            const rest = path.slice(dotPrefix.length)
            if (rest.includes(".")) continue // skip deeper nesting, handled recursively

            if (typeof value === "function") continue

            if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                result[rest] = this.buildNested(path)
            } else {
                result[rest] = value
            }
        }

        return result
    }

    keys(prefix = ""): string[] {
        if (!prefix) {
            return [...this.values.keys()].filter(k => !k.includes("."))
        }
        const dotPrefix = `${prefix}.`
        return [...this.values.keys()]
            .filter(k => k.startsWith(dotPrefix) && !k.slice(dotPrefix.length).includes("."))
            .map(k => k.slice(dotPrefix.length))
    }
}
