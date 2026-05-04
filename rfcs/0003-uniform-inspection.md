# Uniform Inspection

## Motivation

Uniform is xyd's normalized data format for API documentation (`Reference` > `Definition` > `DefinitionProperty`). Today it's a static tree — you produce it from OpenAPI/GraphQL/TypeDoc and render it. There's no way to interact with it as a live object.

Uniform Inspection adds a **reactive Proxy layer** that wraps uniform data and lets you interact with it as if it were the original TypeScript object. Every property access, assignment, and method call is intercepted and mapped back to the uniform tree. This enables:

- **Interactive playgrounds** — users manipulate real objects, docs update in real-time
- **Live API explorers** — change request parameters, see the uniform definition update
- **Two-way React bindings** — form inputs bound directly to uniform properties

## Examples

```ts
interface User {
    name: string
    jobTitle: string
}

interface Job {
    title: string
}

interface Company {
    name: string
    addUser(name: string, job: Job): User
}

const company: Company = {
    name: "LiveSession",
    addUser(name, job) {
        return { name, jobTitle: job.title }
    },
}

// 1. Infer: creates Infer<Reference> with internal Reference + ValueMap
const inferred = uniform.infer<Company>(company)

// 2. Play: creates InferProxy<Company> — looks like Company, backed by internal ValueMap
const playCompany = inferred.play({
    plugins: [
        // e.g. React plugin for useState-style reactivity
    ]
})

// 3. Use the proxy like a normal object — only ValueMap changes, Reference stays frozen
console.log(uniform(playCompany).json())
// -> { name: "LiveSession" }

playCompany.name = "LiveSession v2"
// -> ValueMap.set("name", "LiveSession v2") — Reference untouched, very fast

console.log(uniform(playCompany).json())
// -> { name: "LiveSession v2" }

const newUser = playCompany.addUser("John Doe", { title: "Engineer" })
// -> calls original instance method + triggers hooks

// 4. Multiple value states over the same Reference
const before = inferred.snapshot()  // frozen copy
playCompany.name = "New Name"
const after = inferred.snapshot()
// before and after share the same Reference, different values

// 5. Query the uniform tree by type name
const userRef = uniform.querySelector("User")
```

## API Design

### Core types

```ts
// Wraps a static Reference with a decoupled value layer
interface Infer<R extends Reference = Reference> {
    // Create a reactive proxy — looks like T, backed by internal Reference + ValueMap
    play(options?: PlayOptions): InferProxy<T>

    // Frozen copy of current values for diffing/undo
    snapshot(): Record<string, any>

    // Restore to initial values
    reset(): void
}

// The proxy returned by play() — looks like T but backed by Infer
type InferProxy<T> = T  // Proxy<T> at runtime
```

### `uniform.infer<T>(instance: T): Infer<Reference>`

Creates an `Infer<Reference>` from a typed runtime instance. Uses **typia** at compile time (similar to `xyd-source-react-runtime`) to generate type metadata. The `Reference` inside is static and frozen — the instance's current values are captured into a separate `ValueMap`.

```ts
// At compile time, typia transforms this into:
// uniform.__infer(instance, typia.reflect.schemas<[Company]>())
const inferred = uniform.infer<Company>(company)

// Internally holds: frozen Reference + ValueMap + original instance
// Public API: play(), snapshot(), reset()
```

Internally, the `Infer` creates:
- A frozen `Reference` with type metadata (definitions, properties, method signatures)
- A `ValueMap` populated by walking the instance (`"name"` -> `"LiveSession"`, etc.)
- A reference to the original instance (for method calls)

### `inferred.play(options?): InferProxy<T>`

Returns an `InferProxy<T>` — a Proxy that looks like `T` but reads/writes to the internal decoupled `ValueMap`.

```ts
interface PlayOptions {
    plugins?: PlayPlugin[]
}

const proxy = inferred.play({ plugins: [] })
proxy.name          // -> reads from internal ValueMap
proxy.name = "X"    // -> writes to internal ValueMap — Reference untouched
proxy.addUser(...)  // -> calls original instance method + triggers hooks
```

The internal `Reference` is **never mutated**. Only the `ValueMap` changes. This means:
- Value changes are extremely fast (Map.set)
- No cloning, no tree walking on writes
- `snapshot()` captures value state without touching the Reference

### `uniform(proxy: InferProxy<T>).json(): object`

Returns the current values as a plain JSON object mirroring the original object shape.

```ts
uniform(playCompany).json()
// -> { name: "LiveSession v2", addUser: ... }
```

### `uniform.querySelector(typeName: string): Reference | undefined`

Queries the uniform type registry by type/symbol name. Useful for finding related types (e.g. looking up `"User"` to inspect the return type of `addUser`).

## Proxy-to-Uniform Mapping

The proxy maps object operations to **two separate layers**: the static `Reference` (for type lookup) and the `ValueMap` (for actual values).

| Object operation | Reference (static, readonly) | ValueMap (dynamic, fast) |
|---|---|---|
| `proxy.name` | Finds `DefinitionProperty` with `name === "name"` for type info | `values.get("name")` returns current value |
| `proxy.name = "X"` | Not touched | `values.set("name", "X")` + triggers hooks |
| `proxy.addUser(a, b)` | Finds method signature in definitions | Calls `instance.addUser(a, b)` + triggers hooks |
| `proxy.nested.field` | Walks `properties[j].properties[k]` for type | `values.get("nested.field")` for value |

### Value tracking (Approach A: External Value Map)

The `Reference` stores type metadata only and is **frozen after creation**. Runtime values live in a decoupled `ValueMap` that can be changed extremely fast without touching the uniform tree. This separation enables:

- Very fast reads/writes (Map operations, no tree walking)
- Multiple value states over the same Reference (undo/redo, before/after)
- The Reference can be shared, cached, or serialized independently
- `json()` merges on demand — only when you need a snapshot

## Value Tracking Design

### Decision: External Value Map

Uniform stays a **static schema description** — it never holds runtime values. Values live in a decoupled internal `ValueMap` inside `Infer<Reference>`. This is the right fit because:

- **Definitions never change** — the `Reference` is frozen after `infer()`, so type metadata can be cached, shared, and serialized freely
- **Values change constantly** — the `ValueMap` uses fast `Map.get`/`Map.set` with zero tree walking
- **Multiple states** — `snapshot()` captures value state without cloning the Reference, enabling undo/redo and before/after comparisons
- **Zero breaking changes** — `DefinitionProperty`, `Reference`, and all existing uniform consumers stay untouched
- **Clean separation** — type metadata and runtime state are different concerns with different lifecycles

### How it works internally

```
uniform.infer<Company>(company)
    │
    ├── Reference (frozen, readonly)
    │   └── definitions[0]
    │       ├── properties[0] { name: "name", type: "string" }
    │       └── properties[1] { name: "addUser", type: "(name: string, job: Job) => User" }
    │
    └── ValueMap (mutable, fast)
        ├── "name" -> "LiveSession"
        └── "addUser" -> fn
```

The Proxy returned by `play()` bridges both:
- **Read** (`proxy.name`) — looks up `"name"` in `ValueMap`, returns `"LiveSession"`
- **Write** (`proxy.name = "X"`) — sets `"name"` in `ValueMap`, triggers hooks. Reference untouched.
- **Call** (`proxy.addUser(...)`) — finds the function in `ValueMap`, calls it, triggers hooks
- **json()** — returns a plain object reconstructed from `ValueMap`: `{ name: "LiveSession" }`
- **snapshot()** — frozen copy of `ValueMap` values for diffing

## Infer

`uniform.infer<T>(instance)` bridges TypeScript types and runtime values into uniform format.

### Compile-time transform (typia)

Similar to `xyd-source-react-runtime`, a compile-time transform generates type metadata:

```ts
// Source code:
const ref = uniform.infer<Company>(company)

// After typia transform:
const ref = uniform.__infer(company, {
    schemas: [{ objects: [{ name: "Company" }] }],
    components: {
        objects: [{
            name: "Company",
            properties: [
                { key: { constants: [{ values: [{ value: "name" }] }] }, value: { atomics: [{ type: "string" }], required: true } },
                { key: { constants: [{ values: [{ value: "addUser" }] }] }, value: { functions: [{ parameters: [...], output: { objects: [{ name: "User" }] } }] } }
            ]
        }]
    }
})
```

### Runtime conversion

`uniform.__infer(instance, schema)` then:
1. Converts the typia schema to a `Reference` (reusing `jsonSchemaToUniformReference` or `metadataToUniformReference` patterns from `xyd-source-react-runtime`)
2. Walks the instance to capture current values
3. Creates `TrackedProperty` entries linking each `DefinitionProperty` to its live value

## Plugins

Plugins are the primary extension point. A plugin receives a `PlayPluginContext` which exposes the **hook registration API** — this is how plugins wire up framework-specific behavior under the hood. Users don't register hooks directly; plugins do it for them.

```ts
interface PlayPlugin {
    name: string

    // Called when the proxy is created — receives the hook registration API
    setup(context: PlayPluginContext): void
}

interface PlayPluginContext {
    // The underlying Reference
    reference: Reference

    // Register hooks — this is how plugins observe/intercept proxy operations
    registerHooks(hooks: InspectionHooks): void

    // Force a re-read of all tracked values
    refresh(): void

    // Subscribe to any change (framework-agnostic change notification)
    subscribe(listener: () => void): () => void
}
```

### React plugin (concept)

The React plugin uses `registerHooks` internally to tap into proxy operations. Under the hood it can interact with React fiber via React DevTools protocol to provide deep inspection.

```ts
import { reactPlugin } from "@xyd-js/uniform/react"

const playCompany = companyUniform.play({
    plugins: [
        reactPlugin() // internally calls context.registerHooks({...}) in setup()
    ]
})

// In a React component:
function CompanyEditor() {
    // The react plugin registered hooks that trigger React re-renders on set.
    // Under the hood it uses useSyncExternalStore + context.subscribe().
    // It can also inspect React fiber tree via React DevTools to correlate
    // uniform properties with rendered components.
    return (
        <input
            value={playCompany.name}
            onChange={(e) => { playCompany.name = e.target.value }}
        />
    )
}
```

### Example: custom logging plugin

```ts
function loggingPlugin(): PlayPlugin {
    return {
        name: "logging",
        setup(context) {
            context.registerHooks({
                set(property, oldValue, newValue) {
                    console.log(`[uniform] ${property}: ${JSON.stringify(oldValue)} -> ${JSON.stringify(newValue)}`)
                },
                call(method, args) {
                    console.log(`[uniform] ${method}(${args.map(a => JSON.stringify(a)).join(", ")})`)
                }
            })
        }
    }
}

const playCompany = companyUniform.play({
    plugins: [loggingPlugin(), reactPlugin()]
})
```

### Plugin ordering

Multiple plugins can register hooks. All hooks fire in plugin registration order — `loggingPlugin` hooks fire before `reactPlugin` hooks in the example above.

## Hooks

Hooks are the low-level observation/interception primitives. They are **not registered by users directly** — plugins register them via `context.registerHooks()` in their `setup()` method.

```ts
interface InspectionHooks {
    // Fires after a property is read
    get?(property: string, value: any): void

    // Fires after a property is written
    set?(property: string, oldValue: any, newValue: any): void

    // Fires after a method is called
    call?(method: string, args: any[], returnValue: any): void
}
```

A single plugin can call `registerHooks` multiple times — all registrations are additive and fire in order.

## Open Questions

1. **Nested proxy chaining** — should `proxy.nested` return another play proxy, or a plain object? Chaining enables deep observation but adds complexity.

2. **Array properties** — how should array-typed properties behave? Should `proxy.users.push(...)` be interceptable, or only full reassignment `proxy.users = [...]`?

3. **Method return values** — should `playCompany.addUser(...)` return a play proxy of the `User` return type, or a plain object?

4. **querySelector scope** — should `uniform.querySelector` search a global registry, or be scoped to a specific `infer` call's type graph?

5. **Undo/redo** — should the value tracking layer support history for playground use cases? (Approach A makes this easiest — multiple value maps over the same tree)
