# Static Site Deployment

Fully static sites deployable to any hosting platform.

## Output

`.xyd/build/client/` — HTML, CSS, JS, assets. Self-contained, optimized, SEO-friendly.

## Platforms

All use `xyd build` and publish `.xyd/build/client`: Netlify, Vercel, GitHub Pages, CloudFlare Pages, AWS S3.

## CI/CD

```yaml
steps:
  - uses: actions/checkout@v3
  - run: bun install
  - run: xyd build
```
