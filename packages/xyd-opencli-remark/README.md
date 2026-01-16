# xyd-opencli-remark

The package includes a remark plugin for generating OpenCLI documentation from variables in markdown files.

## Usage

```typescript
import { remarkOpencliDocs } from '@xyd-js/opencli-remark';
import remarkFrontmatter from 'remark-frontmatter';
import remarkStringify from 'remark-stringify';
import { remark } from 'remark';

// Configure multiple CLI specs
remark()
  .use(remarkFrontmatter)
  .use(remarkOpencliDocs, {
    xyd: { source: './xyd-cli.json' },
    npm: { source: './npm-cli.json' },
    // Add more CLIs as needed
  })
  .use(remarkStringify)
  .process(markdown);
```

## Configuration

The plugin accepts an object where each key represents a CLI identifier, and the value contains the spec configuration:

```typescript
{
  [cliKey: string]: {
    source: string; // Path to OpenCLI spec JSON file (relative to markdown file) or URL
  }
}
```

**Example:**
```typescript
remarkOpencliDocs({
  xyd: { source: './xyd-cli.json' },
  npm: { source: 'https://example.com/npm-cli.json' }
})
```

## Frontmatter Configuration

In your markdown frontmatter, specify which CLI to use and the command path:

```yaml
---
xyd.opencli.xyd: "dev"
---
```

The CLI key (e.g., `xyd`) must match a key in your plugin configuration. The command path is **relative to the CLI root** (no CLI name prefix needed).

### Command Path Examples

- **Root command**: Use an empty string `""`
  ```yaml
  xyd.opencli.xyd: ""
  ```

- **Top-level command**: Just the command name
  ```yaml
  xyd.opencli.xyd: "dev"
  ```

- **Nested command**: Space-separated path
  ```yaml
  xyd.opencli.xyd: "components install"
  ```

- **Using aliases**: You can use command aliases
  ```yaml
  xyd.opencli.xyd: "d"  # if "d" is an alias for "dev"
  ```

### Indent Style Configuration

You can configure the output format for arguments and options:

```yaml
---
xyd.opencli.xyd:
  command: "dev"
  indent: list  # or "code" (default)
---
```

- **`code`** (default): Tab-indented CLI-style format, suitable for code blocks
- **`list`**: Markdown list format with backticks, suitable for regular markdown

## Example Markdown

### Code Block Format (default)

**Input:**
```markdown
---
xyd.opencli.xyd: "dev"
---

```sh
Usage: {opencli.current.usage}

{opencli.current.description}

Arguments:
{opencli.current.arguments}

Options:
{opencli.current.options}
```

**Output:**
```markdown
---
xyd.opencli.xyd: "dev"
---

```sh
Usage: xyd dev [flags]

Run your docs locally in development mode

Options:
	-p, --port <number>            Port to run the dev server on
	-l, --logLevel <string>        Set logging level (e.g. info, debug)
	--verbose                      Enable verbose output
	--debug                        Enable debug output
```

### List Format

**Input:**
```markdown
---
xyd.opencli.xyd:
  command: "dev"
  indent: list
---

## Usage
`{opencli.current.usage}`

{opencli.current.description}

## Arguments
{opencli.current.arguments}

## Options
{opencli.current.options}
```

**Output:**
```markdown
---
xyd.opencli.xyd:
  command: "dev"
  indent: list
---

## Usage

`xyd dev [flags]`

Run your docs locally in development mode

## Arguments

## Options

- `-p`, `--port <number>`  Port to run the dev server on
- `-l`, `--logLevel <string>`  Set logging level (e.g. info, debug)
- `--verbose`  Enable verbose output
- `--debug`  Enable debug output
```

## Variables

The following Variables are supported:

| Variable | Description | Format Support |
|------------|-------------|----------------|
| `{opencli.current.usage}` | Generates usage line (e.g., `xyd dev [flags]`) | All formats |
| `{opencli.current.description}` | Command description | All formats |
| `{opencli.current.commands}` | List of available subcommands | All formats |
| `{opencli.current.arguments}` | Command arguments documentation | Code blocks, text (code style), or list nodes (list style) |
| `{opencli.current.options}` | Command options/flags documentation | Code blocks, text (code style), or list nodes (list style) |

**Note:** 
- `{opencli.current.arguments}` and `{opencli.current.options}` work in:
  - Code blocks (always code format)
  - Text nodes (code format when `indent: 'code'`)
  - List nodes (list format when `indent: 'list'` - automatically converted to markdown lists)

## Multiple CLIs

You can configure and use multiple CLI specs in the same project:

```typescript
remarkOpencliDocs({
  xyd: { source: './xyd-cli.json' },
  npm: { source: './npm-cli.json' },
  git: { source: './git-cli.json' }
})
```

Then in different markdown files, reference the appropriate CLI:

```yaml
# File 1: xyd-dev.md
---
xyd.opencli.xyd: "dev"
---

# File 2: npm-install.md
---
xyd.opencli.npm: "install"
---
```
