# @xyd-js/openapi2opencli

Converts an **OpenAPI 3.x** document into an **OpenCLI** document
([`@xyd-js/opencli`](../xyd-opencli)), embedding the `x-openapi` request binding so the
downstream `opencli2*` code generators (Go first) can build real API requests.

```ts
import { openapi2opencli, openapi2opencliFromSource } from '@xyd-js/openapi2opencli';

// from an already-dereferenced OpenAPIV3.Document
const opencli = openapi2opencli(doc, { cliName: 'openai' });

// or read + dereference a file/URL (via @xyd-js/openapi)
const opencli = await openapi2opencliFromSource('./openapi.yaml', { cliName: 'openai' });
```

## Mapping (default `grouping: "path"`)

| OpenAPI | OpenCLI |
|---|---|
| static path segment | nested resource command (kebab-case) |
| `{param}` segment | positional `Argument` (required, path order) |
| method + path shape | leaf action: GET-collection→`list`, GET-item→`retrieve` (+`get`), POST-collection→`create`, PUT/PATCH-item→`update`, DELETE-item→`delete` |
| trailing static verb after a param (e.g. `/{id}/cancel`) | custom action (`cancel`); see `customActionVerbs` |
| query param | `Option` (`group: "query"`) |
| header / cookie param | `Option` (opt-in via `includeHeaders`, hidden, auth headers skipped) |
| request body (object) | top-level props → `Option[]` (hybrid: scalars/scalar-arrays flatten, enums→`acceptedValues`, nested/`oneOf`/`anyOf`→JSON-string flag); multipart binary → file flag |

Every leaf command carries `x-openapi` `{ method, path, contentType, params[], body }` and the
root carries `x-openapi` `{ servers, security }`. See `OpenApi2OpenCliOptions` for `cliName`,
`version`, `grouping`, `bodyStrategy`, `includeMethods`, `includeHeaders`, `flagCase`,
`verbMap`, `customActionVerbs`, `includePaths`, `authEnvVar`.

> Not yet derived from a pure OpenAPI spec (they live in vendor codegen config, e.g. Stainless):
> the OpenAI CLI's `beta` prefix and `admin:` `:`-namespacing. These are handled later via
> overrides / `x-cli` hooks (see the project plan, Milestone 3).

## Tests

Data-driven golden fixtures under `__fixtures__/<n>.<name>/` (`input.yaml` → `output.json`):

```bash
pnpm --filter @xyd-js/openapi2opencli test          # assert against committed goldens
REGEN=1 pnpm --filter @xyd-js/openapi2opencli test   # regenerate output.json, then review the diff
```
