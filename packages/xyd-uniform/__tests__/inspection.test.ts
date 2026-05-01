import {describe, it, expect} from "vitest"

import {infer, uniform} from "../src/inspection"
import {fixture} from "./utils"

describe("uniform inspection", () => {
    describe("infer + play", () => {
        it("should read property values via proxy", () => {
            const {reference, instance} = fixture`3.inspection.basic`
            const proxy = infer(reference, instance).play()

            expect(proxy.host).toBe("localhost")
            expect(proxy.port).toBe(3000)
        })

        it("should write property values via proxy without mutating instance", () => {
            const {reference, instance} = fixture`3.inspection.basic`
            const proxy = infer(reference, instance).play()

            proxy.host = "production"
            expect(proxy.host).toBe("production")
            expect(instance.host).toBe("localhost")
        })

        it("should freeze the Reference", () => {
            const {reference, instance} = fixture`3.inspection.basic`
            const inferred = infer(reference, instance)

            expect(inferred.reference.title).toBe("Config")
            expect(Object.isFrozen(inferred.reference)).toBe(true)
        })
    })

    describe("json()", () => {
        it("should return current values as plain object", () => {
            const {reference, instance} = fixture`3.inspection.basic`
            const proxy = infer(reference, instance).play()

            expect(uniform(proxy).json()).toEqual({host: "localhost", port: 3000})

            proxy.port = 8080
            expect(uniform(proxy).json()).toEqual({host: "localhost", port: 8080})
        })

        it("should exclude function values from json()", () => {
            const {reference} = fixture`3.inspection.methods`
            const proxy = infer(reference, {value: 0, add: (n: number) => n}).play()

            expect(uniform(proxy).json()).toEqual({value: 0})
        })
    })

    describe("snapshot() and reset()", () => {
        it("should return frozen snapshot of current values", () => {
            const {reference, instance} = fixture`3.inspection.basic`
            const inferred = infer(reference, instance)
            const proxy = inferred.play()

            const before = inferred.snapshot()
            proxy.port = 8080
            const after = inferred.snapshot()

            expect(before).toEqual({host: "localhost", port: 3000})
            expect(after).toEqual({host: "localhost", port: 8080})
            expect(Object.isFrozen(before)).toBe(true)
        })

        it("should reset values to initial state", () => {
            const {reference, instance} = fixture`3.inspection.basic`
            const inferred = infer(reference, instance)
            const proxy = inferred.play()

            proxy.port = 8080
            inferred.reset()
            expect(proxy.port).toBe(3000)
        })
    })

    describe("method calls", () => {
        it("should call original instance methods", () => {
            const {reference} = fixture`3.inspection.methods`
            const proxy = infer(reference, {value: 0, add(n: number) { return this.value + n }}).play()

            expect(proxy.add(5)).toBe(5)
        })
    })

    describe("nested objects", () => {
        it("should support nested property access and writes", () => {
            const {reference, instance} = fixture`3.inspection.nested`
            const proxy = infer(reference, instance).play()

            expect(proxy.db.host).toBe("localhost")

            proxy.db.host = "production.db"
            expect(proxy.db.host).toBe("production.db")
            expect(uniform(proxy).json()).toEqual({
                db: {host: "production.db", port: 5432},
            })
        })
    })

    describe("uniform() helper", () => {
        it("should throw for non-proxy arguments", () => {
            expect(() => uniform({})).toThrow("not an InferProxy")
        })

        it("should return reference from proxy", () => {
            const {reference, instance} = fixture`3.inspection.basic`
            const proxy = infer(reference, instance).play()
            expect(uniform(proxy).reference().title).toBe("Config")
        })
    })
})
