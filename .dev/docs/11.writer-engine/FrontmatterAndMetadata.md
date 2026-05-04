# Frontmatter and Metadata

## Purpose and Scope

Frontmatter is a YAML block at the beginning of Markdown or MDX files that contains metadata about the page. This metadata controls various aspects of page rendering, SEO, navigation, and AI integrations. The frontmatter system in xyd uses the `gray-matter` library for parsing and integrates with the remark/rehype pipeline through specialized plugins.

## Frontmatter Fields

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `title` | string | Page title in navigation and HTML head | `title: "Getting Started"` |
| `description` | string | Page description for SEO and AI indexing | `description: "Quick start guide"` |
| `seoTitle` | string | Override title for SEO purposes | `seoTitle: "xyd - Getting Started"` |
| `seoDescription` | string | Override description for SEO | `seoDescription: "Complete guide..."` |

## Implementation Architecture

### gray-matter Integration

```typescript
const { data: fm } = matter(content) || { data: {} };
const title = fm?.title || "";
const description = fm?.description || "";
```

### Remark Plugin Chain

Frontmatter processing occurs early in the remark plugin chain, allowing downstream plugins to access parsed metadata during content transformation.

## AI Documentation Integration (llms.txt)

Frontmatter plays a critical role in AI documentation generation through conversion to AST nodes serialized as markdown for `llms.txt` files.

### Frontmatter to AST Conversion

```typescript
const linkNode = u("link", { url }, [u("text", title)]);
const paragraphChildren: any[] = [linkNode];
if (description) {
    paragraphChildren.push(u("text", `: ${description}`));
}
const paragraphNode = u("paragraph", paragraphChildren);
const listItemNode = u("listItem", [paragraphNode]);
```

## Page Path Mapping System

Frontmatter is stored in a global mapping structure that associates page paths with their content and metadata.

## Build-Time vs Runtime Processing

| Context | Processing Method | Storage | Access Pattern |
|---------|-------------------|---------|-----------------|
| Build Time | `gray-matter` synchronous parse | `globalThis.__xydRawRouteFiles` | Direct object access |
| Dev Server | `gray-matter` with file watching | Same global + cache invalidation | Reactive updates |
| Runtime | Pre-processed from globals | Virtual modules | Framework context hooks |
| llms.txt Generation | AST-based with `unist-builder` | Markdown file output | Static file serving |

## Environment Variable Replacement

Frontmatter values can include environment variables that are replaced during settings processing, allowing for dynamic configuration based on deployment environment.
