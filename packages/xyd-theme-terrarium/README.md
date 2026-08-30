# @xyd-js/theme-terrarium

A full-width, high-contrast documentation theme for [xyd](https://xyd.dev), inspired by the
HashiCorp Developer docs.

## Traits

- **Full-width** layout — no centered max-width container.
- **~800px content**, pinned close to the **left** (the "paging sizes" small width token).
- **Decoupled TOC** pushed to the far right.
- **Taller nav** (64px) and a **high-contrast** blacks/darks palette.
- **Green accent** by default (`#00ca8e`), overridable via `theme.appearance.colors.primary`.
- **Per-product accent** — when a `logoTrailing` product switcher declares a `color`, the whole
  accent recolors per product (Nomad → green, Consul → pink, Vault → yellow …).
- **HashiCorp-style sidebar chrome** — a `‹ {Product} Home` back-link, a colored product-icon
  header, and a "Filter sidebar" input.

## Usage

```json
{
  "theme": { "name": "terrarium" }
}
```
