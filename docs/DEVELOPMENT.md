# DEVELOPMENT

## Tests and Fixtures

### Directory layout

Tests live in `__tests__/` and fixtures in `__fixtures__/` at the package root (or under `src/` for some packages).

```
packages/xyd-<name>/
├── __tests__/
│   ├── <feature>.test.ts    # Test file
│   └── utils.ts             # Shared test helpers
└── __fixtures__/
    ├── 1.basic/             # Positive fixture (runs in CI)
    ├── 2.circular/
    ├── -1.opendocs.flat/    # Negative-numbered (advanced/optional, may be disabled)
    └── -2.complex.openai/
```

### Fixture naming convention

Each fixture is a numbered directory: `<order>.<descriptive-name>`.

| Prefix | Meaning | Example |
|--------|---------|---------|
| `1.`, `2.`, `3.` ... | Standard test cases, run in CI | `1.basic`, `3.multiple-responses` |
| `-1.`, `-2.`, `-3.` ... | Advanced/optional cases, may be commented out or sorted first | `-1.opendocs.flat`, `-2.complex.openai` |

Use dots to add sub-categories: `5.xdocs.sidebar`, `-1.opendocs.sort+group`.

### Input / output pattern

Every fixture contains an **input** and an expected **output**. The format depends on what's being tested:

| Package | Input | Output |
|---------|-------|--------|
| `xyd-gql` | `input.graphql` | `output.json` |
| `xyd-openapi` | `input.yaml` | `output.json` |
| `xyd-opencli-remark` | `input.md` | `output.md` |
| `xyd-source-react-babel-runtime` | `input/` (folder with `src/`, `package.json`, `tsconfig.json`) | `output.js` |

For simple converters (OpenAPI, GraphQL, remark), input and output are single files. For more complex scenarios (Vite builds, multi-file projects), `input/` is a folder containing the full project source.

### Test structure

Tests are data-driven. A test file defines an array of cases and iterates through them using a shared utility:

```ts
// __tests__/<feature>.test.ts
import { testMyFeature } from './utils';

const tests = [
    { name: '1.basic', description: 'Basic example' },
    { name: '2.more',  description: 'Extended example' },
];

describe('my-feature', () => {
    for (const t of tests) {
        it(t.description, async () => {
            await testMyFeature(t.name);
        });
    }
});
```

The utility function in `utils.ts` handles:
1. Loading input from `__fixtures__/<name>/`
2. Running the transformation
3. Saving result to `output.*` (for snapshot regeneration)
4. Comparing result against expected `output.*`

### Running tests

```bash
# Run all unit tests
pnpm test:unit

# Run tests for a specific package
cd packages/xyd-<name>
pnpm test

# Run with vitest watch mode
pnpm vitest
```