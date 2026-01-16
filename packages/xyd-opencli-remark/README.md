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
    spice: { source: './spice-spec.json' },
    npm: { source: './npm-spec.json' },
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
  spice: { source: './spice-spec.json' },
  npm: { source: 'https://example.com/npm-spec.json' }
})
```

## Frontmatter Configuration

In your markdown frontmatter, specify which CLI to use and the command path:

```yaml
---
xyd.opencli.spice: "install"
---
```

The CLI key (e.g., `spice`) must match a key in your plugin configuration. The command path is **relative to the CLI root** (no CLI name prefix needed).

### Command Path Examples

- **Root command**: Use an empty string `""`
  ```yaml
  xyd.opencli.spice: ""
  ```

- **Top-level command**: Just the command name
  ```yaml
  xyd.opencli.spice: "install"
  ```

- **Nested command**: Space-separated path
  ```yaml
  xyd.opencli.spice: "install dev"
  ```

- **Using aliases**: You can use command aliases
  ```yaml
  xyd.opencli.spice: "i"  # if "i" is an alias for "install"
  ```

### Indent Style Configuration

You can configure the output format for arguments and options:

```yaml
---
xyd.opencli.spice:
  command: "install"
  indent: list  # or "code" (default)
---
```

- **`code`** (default): Tab-indented CLI-style format, suitable for code blocks
- **`list`**: Markdown list format with backticks, suitable for regular markdown

## Example Markdown

### Basic Example

```markdown
---
title: "Install Command"
xyd.opencli.spice: "install"
---

### Usage
{opencli.current.usage}

### Description
{opencli.current.description}

### Arguments
{opencli.current.arguments}

### Options
{opencli.current.options}

### Available Commands
{opencli.current.commands}
```

### Code Block Format (default)

```markdown
---
xyd.opencli.spice: "install"
---

```sh
Usage: {opencli.current.usage}

{opencli.current.description}

Arguments:
{opencli.current.arguments}

Options:
{opencli.current.options}
```
```

#### List Format

```markdown
---
xyd.opencli.spice:
  command: "install"
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

## Variables

The following Variables are supported:

| Variable | Description | Format Support |
|------------|-------------|----------------|
| `{opencli.current.usage}` | Generates usage line (e.g., `spice install [options] <package>`) | All formats |
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
  spice: { source: './spice-spec.json' },
  npm: { source: './npm-spec.json' },
  git: { source: './git-spec.json' }
})
```

Then in different markdown files, reference the appropriate CLI:

```yaml
# File 1: spice-install.md
---
xyd.opencli.spice: "install"
---

# File 2: npm-install.md
---
xyd.opencli.npm: "install"
---
```
