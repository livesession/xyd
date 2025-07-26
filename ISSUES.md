1. for some reasons react-router during static build has urls with `/` at the end (e.g `/example-url/` instead of `/example-url`)

2. performance issues with huge API uniform - `componentLike`.`fromMarkdown` is the longest - props changing to ast is very high `956K` props are changing to `~100MB` ast

3. some issues with  Error when evaluating SSR module /private/tmp/xyd-server-test-IqKV6g/@xyd-js/plugin-orama but only for local npm?