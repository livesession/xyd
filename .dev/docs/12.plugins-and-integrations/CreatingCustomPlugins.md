# Creating Custom Plugins

This guide explains how to extend xyd's functionality through custom plugins.

## Plugin Interface

| Property | Type | Purpose |
|----------|------|---------|
| `name` | string | Unique plugin identifier |
| `vite` | Vite[] | Build-time transformation plugins |
| `uniform` | Uniform<any>[] | API specification processors |
| `components` | PluginComponents | React components to inject |
| `head` | HeadConfig[] | HTML head elements |
| `markdown` | object | Remark/rehype transformation plugins |
| `hooks` | object | Lifecycle hooks |

## Creating a Basic Plugin

```typescript
export const myPlugin = (options = {}) => (settings) => ({
  name: 'my-plugin',
  components: [],
  markdown: {},
  hooks: {}
});
```

## Extension Points

### Vite Plugins

```typescript
{ vite: [{ name: 'my-vite-plugin', resolveId(id) {}, load(id) {} }] }
```

### React Components

Inline (small) or external (large):

```typescript
{ components: [{ name: 'MyComponent', component: MyComponent, isInline: true }] }
```

### Markdown Processing

```typescript
{ markdown: { remark: [remarkPlugin1], rehype: [rehypePlugin1] } }
```

### Lifecycle Hooks

```typescript
{ hooks: { applyComponents: (metadata) => metadata.component === 'custom' } }
```

### HTML Head Elements

```typescript
{ head: [['script', { src: 'https://example.com/lib.js' }]] }
```

## Configuration

```json
{ "plugins": ["@company/xyd-plugin-custom"] }
```
