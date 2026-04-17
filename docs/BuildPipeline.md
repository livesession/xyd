# Build Pipeline

`xyd build` transforms source files into optimized static site.

Output: `.xyd/build/client/`

## Process

1. Initialization (appInit, settings, plugins)
2. Virtual modules compilation
3. Content processing (MDX/Markdown)
4. Vite bundling
5. Static asset generation
6. Output to `.xyd/build/client/`

## Output Structure

```
.xyd/build/client/
├── index.html
├── assets/ (hashed JS/CSS)
└── [routes]/ (pre-rendered HTML)
```

## Build Optimization

- Conditional externalization
- Dependency pre-bundling
- Rollup: swc, linaria, postcss, terser

## LLMs.txt

Auto-generates `llms.txt` for AI indexing.
