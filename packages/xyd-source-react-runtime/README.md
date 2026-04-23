# @xyd-js/source-react-runtime

Build plugin that auto-detects React components and injects runtime type metadata (`__xydUniform`) using [typia](https://typia.io/) for TypeScript type resolution and [@xyd-js/openapi](../xyd-openapi) for JSON Schema → xyd uniform conversion.

No manual annotations needed — just add the plugin to your build config.

## Supported bundlers

| Bundler | Import | Build command |
|---------|--------|---------------|
| **Vite** | `@xyd-js/source-react-runtime` | `vite build` |
| **Rollup** | `@xyd-js/source-react-runtime` | `rollup -c` |
| **esbuild** | `@xyd-js/source-react-runtime/esbuild` | `node esbuild.config.mjs` |
| **React Router v7** | `@xyd-js/source-react-runtime` | `react-router build` |
| **TanStack Router** | `@xyd-js/source-react-runtime` | `vite build` |

## Usage

### Vite / React Router / TanStack Router

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { xydSourceReactRuntime } from "@xyd-js/source-react-runtime";

export default defineConfig({
  plugins: [
    xydSourceReactRuntime({ tsconfig: resolve(__dirname, "tsconfig.json") }),
    react(),
  ],
});
```

### Rollup

```js
// rollup.config.mjs
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import typescript from "@rollup/plugin-typescript";
import { xydSourceReactRuntime } from "@xyd-js/source-react-runtime";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  input: "src/index.ts",
  plugins: [
    xydSourceReactRuntime({ tsconfig: resolve(__dirname, "tsconfig.json") }),
    typescript({ tsconfig: resolve(__dirname, "tsconfig.json") }),
  ],
};
```

### esbuild

```js
// esbuild.config.mjs
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { xydSourceReactRuntimeEsbuild } from "@xyd-js/source-react-runtime/esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  format: "esm",
  plugins: [
    xydSourceReactRuntimeEsbuild({ tsconfig: resolve(__dirname, "tsconfig.json") }),
  ],
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tsconfig` | `string` | `./tsconfig.json` | Path to `tsconfig.json` |
| `propertyName` | `string` | `__xydUniform` | Property name for the injected metadata |

```ts
xydSourceReactRuntime({
  tsconfig: resolve(__dirname, "tsconfig.json"),
  propertyName: "__docs", // Component.__docs = JSON.parse('...')
});
```

## What it detects

The plugin auto-detects:

- **Exported function components** — `export function MyComponent(props: Props) { ... }`
- **Exported arrow components** — `export const MyComponent = (props: Props) => { ... }`
- **Re-exported components** — `function MyComponent(props: Props) { ... } export { MyComponent }`
- **Contexts** — `export const MyContext = createContext<ValueType>(null)`

Props with `React.*` types (e.g. `React.ReactNode`) are skipped because typia cannot resolve React's internal types.

## How it works

1. **Detect** — scans all source files from `tsconfig.json` using the TypeScript compiler AST to find exported components and their props type names
2. **Inject** — creates in-memory modified source files with `typia.json.schemas<[PropsType]>()` calls appended
3. **Transform** — runs typia's TypeScript transform on the full program (all files) for cross-file type resolution
4. **Convert** — converts the resulting JSON Schema to xyd uniform format using `@xyd-js/openapi`'s `schemaObjectToUniformDefinitionProperties`
5. **Output** — replaces the typia call with `Component.{propertyName} = JSON.parse('...')`

## Output format

Each component gets a static property with the [xyd uniform Reference](../xyd-uniform) format:

```js
// Build output
function UserCard(props) { /* ... */ }
UserCard.__xydUniform = JSON.parse('{"title":"UserCard","definitions":[{"title":"Props","properties":[{"name":"name","type":"string","meta":[{"name":"required","value":"true"}]},{"name":"email","type":"string","meta":[{"name":"required","value":"true"}]}]}]}');
```

At runtime, access the metadata:

```ts
import { UserCard } from "./components";

console.log(UserCard.__xydUniform);
// { title: "UserCard", definitions: [{ title: "Props", properties: [...] }] }
```
