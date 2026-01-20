# @xyd-js/content

## Unreleased

### Fixed
- Fix: prevent "Cannot compile `mdxFlowExpression` node" when compiling MDX that includes flow expressions together with raw HTML — ensure `rehype-raw` passes through MDX expression node types (`mdxFlowExpression`, `mdxTextExpression`).

