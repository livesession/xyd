# Uniform Inspection

Uniform Inspection adds a reactive Proxy layer over uniform References. It wraps static type metadata with a decoupled value layer, enabling interactive playgrounds, live API explorers, and two-way bindings.

## Architecture

```
infer(reference, instance)
    │
    ├── Reference (frozen, readonly) — type metadata
    │   └── definitions[0].properties[]
    │
    └── ValueMap (mutable, fast) — runtime values
        ├── "name" → "LiveSession"
        └── "addUser" → fn
    │
    ▼
inferred.play({ plugins }) → Proxy<T>
    │
    ├── get → ValueMap.get(key) + hooks
    ├── set → ValueMap.set(key, val) + hooks
    └── call → instance.method(...args) + hooks
```

## Package Entry

Exported from `@xyd-js/uniform/inspection` and also accessible via the default import:

```ts
// Named imports
import { infer, uniform } from "@xyd-js/uniform/inspection"

// Or via default import
import uniform from "@xyd-js/uniform"
uniform.infer(reference, instance)
uniform.inspect(proxy).json()
```

## API

### `infer(reference, instance)`

Creates an `Infer` wrapper around an instance. The Reference is frozen (deep clone + `Object.freeze`). The instance's current values are captured into a separate `ValueMap`.

```ts
const inferred = infer(reference, { name: "LiveSession", port: 3000 })
```

Returns an `Infer<T>` object with:

| Method | Returns | Description |
|--------|---------|-------------|
| `play(options?)` | `Proxy<T>` | Creates a reactive proxy backed by the ValueMap |
| `snapshot()` | `Record<string, any>` | Frozen copy of current values |
| `reset()` | `void` | Restores all values to initial state |
| `reference` | `Reference` | Readonly access to the frozen Reference |

### `inferred.play(options?)`

Returns a Proxy that looks like `T` but reads/writes to the internal ValueMap. The original instance is never mutated.

```ts
const proxy = inferred.play()
proxy.name              // reads from ValueMap
proxy.name = "New"      // writes to ValueMap, fires hooks
proxy.addUser(...)      // calls original instance method, fires hooks
```

### `uniform(proxy)`

Returns utilities for a play proxy:

```ts
uniform(proxy).json()        // current values as plain object (excludes functions)
uniform(proxy).reference()   // frozen Reference metadata
```

Throws if the argument is not a play proxy.

### `inferred.snapshot()` / `inferred.reset()`

```ts
const before = inferred.snapshot()  // frozen copy of current values
proxy.name = "New"
const after = inferred.snapshot()   // different values, same Reference
inferred.reset()                     // back to initial values
```

## Plugins

Plugins are the extension point for framework-specific behavior. A plugin receives a `PlayPluginContext` in its `setup()` method.

```ts
interface PlayPlugin {
    name: string
    setup(context: PlayPluginContext): void
}

interface PlayPluginContext {
    reference: Reference
    registerHooks(hooks: InspectionHooks): void
    refresh(): void
    subscribe(listener: () => void): () => void
}
```

### Hooks

Plugins register hooks via `context.registerHooks()`. Multiple plugins can register hooks — they fire in plugin registration order.

```ts
interface InspectionHooks {
    get?(property: string, value: any): void
    set?(property: string, oldValue: any, newValue: any): void
    call?(method: string, args: any[], returnValue: any): void
}
```

### Example: logging plugin

```ts
function loggingPlugin(): PlayPlugin {
    return {
        name: "logging",
        setup(context) {
            context.registerHooks({
                set(property, oldValue, newValue) {
                    console.log(`${property}: ${oldValue} → ${newValue}`)
                },
                call(method, args) {
                    console.log(`${method}(${args.join(", ")})`)
                }
            })
        }
    }
}

const proxy = inferred.play({ plugins: [loggingPlugin()] })
```

### Subscribe

Plugins can subscribe to value changes for framework-agnostic reactivity:

```ts
setup(context) {
    const unsub = context.subscribe(() => {
        // any value changed — re-render, etc.
    })
}
```

## Value Tracking

The Reference stores type metadata only and is frozen after creation. Runtime values live in a decoupled `ValueMap`:

| Operation | Reference (static) | ValueMap (dynamic) |
|-----------|--------------------|--------------------|
| `proxy.name` | Finds property type info | `values.get("name")` |
| `proxy.name = "X"` | Not touched | `values.set("name", "X")` + hooks |
| `proxy.method(...)` | Finds method signature | Calls `instance.method(...)` + hooks |
| `proxy.nested.field` | Walks property tree | `values.get("nested.field")` |

### Nested Objects

Nested property access returns sub-proxies for deep observation:

```ts
proxy.db.host = "production"  // sets ValueMap key "db.host"
```

## Internal Implementation

| File | Purpose |
|------|---------|
| `src/inspection/Infer.ts` | `InferImpl` class, `infer()` factory |
| `src/inspection/ValueMap.ts` | Flat `Map<string, any>` with dot-path support, snapshot/reset |
| `src/inspection/play.ts` | Proxy factory with get/set/apply traps, hook dispatch |
| `src/inspection/uniform.ts` | `uniform()` helper using WeakMap to find Infer from proxy |
| `src/inspection/types.ts` | `Infer`, `PlayPlugin`, `InspectionHooks` interfaces |