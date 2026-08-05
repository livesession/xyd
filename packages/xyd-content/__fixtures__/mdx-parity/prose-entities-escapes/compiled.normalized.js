"use strict";
const {Fragment: $Fragment, jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Entities and escapes"
};
function $createMdxContent(props) {
  const $components = {
    p: "p",
    ...props.components
  };
  return $jsxs($Fragment, {
    children: [$jsx($components.p, {
      children: "HTML entities: © & <tag> — done."
    }), "\n", $jsx($components.p, {
      children: "Backslash escapes: *not italic* and `not code` and a literal # hash."
    }), "\n", $jsx($components.p, {
      children: "Unicode: café, naïve, 日本語, emoji ✨."
    })]
  });
}
function MDXContent(props = {}) {
  const {wrapper: MDXLayout} = props.components || ({});
  return MDXLayout ? $jsx(MDXLayout, {
    ...props,
    children: $jsx($createMdxContent, {
      ...props
    })
  }) : $createMdxContent(props);
}
return {
  toc,
  frontmatter,
  default: MDXContent
};
