# @xyd-js/sources

The `@xyd-js/sources` package converts TypeScript source code into xyd-uniform `Reference` objects. It bridges raw TypeScript source files and xyd's documentation rendering pipeline.

## Package Structure

```
packages/xyd-sources/
├── src/
│   └── index.ts
├── packages/
│   ├── ts/                         # TypeScript source processing
│   │   ├── index.ts                # sourcesToUniformV2, uniformToMiniUniform
│   │   ├── TypeDocTransformer.ts   # TypeDoc JSON → uniform Reference
│   │   ├── SignatureText.ts        # TS AST → signature text
│   │   └── uniformToMiniUniform.ts
│   └── react/                      # React-specific transforms
│       └── index.ts                # uniformToReactUniform
├── __tests__/
└── __fixtures__/
```

## Key Exports

### `@xyd-js/sources/ts`

- **sourcesToUniformV2(root, entryPoints)** — parses TypeScript via TypeDoc, returns `{ references, projectJson }`
- **uniformToMiniUniform(references)** — compact uniform output

### `@xyd-js/sources/react`

- **uniformToReactUniform(references, projectJson)** — filters to `@category Component` entries, resolves React props

## How It Works

1. **TypeDoc Parsing** — sourcesToUniformV2 initializes TypeDoc with entry points
2. **TypeDoc → Uniform** — TypeDocTransformer walks JSON output, converts to Reference objects
3. **Signature Text** ��� SignatureText.ts uses TypeScript compiler API for clean signatures
4. **React Transform** — uniformToReactUniform filters components, resolves props, handles discriminated unions

## Uniform Output Format

```typescript
interface Reference {
  title: string;
  description: string | ReactNode;
  canonical: string;
  definitions: Definition[];
  examples: ExampleRoot;
  context?: ReferenceContext;
}
```

## Usage

```typescript
import { sourcesToUniformV2 } from "@xyd-js/sources/ts";
import { uniformToReactUniform } from "@xyd-js/sources/react";

const { references, projectJson } = await sourcesToUniformV2(root, entryPoints);
const reactRefs = uniformToReactUniform(references, projectJson);
```

## Pipeline Integration

Source Code → @xyd-js/sources → Uniform References → @xyd-js/uniform plugins → Atlas UI → Rendered Documentation
