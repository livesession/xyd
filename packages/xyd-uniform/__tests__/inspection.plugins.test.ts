import {describe, it, expect} from "vitest"

import type {PlayPlugin} from "../src/inspection/types"
import {infer} from "../src/inspection"
import {fixture} from "./utils"

describe("uniform inspection plugins", () => {
    it("should fire get hooks on property access", () => {
        const log: string[] = []
        const plugin: PlayPlugin = {
            name: "test",
            setup(ctx) {
                ctx.registerHooks({
                    get(property, value) { log.push(`get:${property}=${value}`) },
                })
            },
        }

        const {reference} = fixture`3.inspection.plugins`
        const proxy = infer(reference, {count: 42}).play({plugins: [plugin]})
        void proxy.count
        expect(log).toEqual(["get:count=42"])
    })

    it("should fire set hooks on property write", () => {
        const log: string[] = []
        const plugin: PlayPlugin = {
            name: "test",
            setup(ctx) {
                ctx.registerHooks({
                    set(property, oldValue, newValue) { log.push(`set:${property}:${oldValue}->${newValue}`) },
                })
            },
        }

        const {reference, instance} = fixture`3.inspection.plugins`
        const proxy = infer(reference, instance).play({plugins: [plugin]})
        proxy.count = 10
        expect(log).toEqual(["set:count:0->10"])
    })

    it("should fire call hooks on method invocation", () => {
        const log: string[] = []
        const plugin: PlayPlugin = {
            name: "test",
            setup(ctx) {
                ctx.registerHooks({
                    call(method, args, returnValue) { log.push(`call:${method}(${args.join(",")})=${returnValue}`) },
                })
            },
        }

        const {reference} = fixture`3.inspection.methods`
        const proxy = infer(reference, {value: 0, add: (a: number, b: number) => a + b}).play({plugins: [plugin]})
        proxy.add(2, 3)
        expect(log).toEqual(["call:add(2,3)=5"])
    })

    it("should fire hooks in plugin registration order", () => {
        const log: string[] = []
        const pluginA: PlayPlugin = {name: "A", setup(ctx) { ctx.registerHooks({set(p) { log.push(`A:${p}`) }}) }}
        const pluginB: PlayPlugin = {name: "B", setup(ctx) { ctx.registerHooks({set(p) { log.push(`B:${p}`) }}) }}

        const {reference, instance} = fixture`3.inspection.plugins`
        const proxy = infer(reference, instance).play({plugins: [pluginA, pluginB]})
        proxy.count = 1
        expect(log).toEqual(["A:count", "B:count"])
    })

    it("should notify subscribers on value changes", () => {
        let notified = 0
        const plugin: PlayPlugin = {
            name: "test",
            setup(ctx) { ctx.subscribe(() => { notified++ }) },
        }

        const {reference, instance} = fixture`3.inspection.plugins`
        const proxy = infer(reference, instance).play({plugins: [plugin]})
        proxy.count = 1
        proxy.count = 2
        expect(notified).toBe(2)
    })

    it("should support unsubscribe", () => {
        let notified = 0
        let unsub: () => void
        const plugin: PlayPlugin = {
            name: "test",
            setup(ctx) { unsub = ctx.subscribe(() => { notified++ }) },
        }

        const {reference, instance} = fixture`3.inspection.plugins`
        const proxy = infer(reference, instance).play({plugins: [plugin]})
        proxy.count = 1
        unsub!()
        proxy.count = 2
        expect(notified).toBe(1)
    })
})
