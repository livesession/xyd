1. cannot use multiple attributes for markdown directives in .mdx files  

2. for some reasons react-router during static build has urls with `/` at the end (e.g `/example-url/` instead of `/example-url`)

3. performance issues with huge API uniform - `componentLike`.`fromMarkdown` is the longest - props changing to ast is very high `956K` props are changing to `~100MB` ast