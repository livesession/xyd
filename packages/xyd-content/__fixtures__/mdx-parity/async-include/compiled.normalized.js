"use strict";
const {Fragment: $Fragment, jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Include function"
};
function $createMdxContent(props) {
  const $components = {
    code: "code",
    h1: "h1",
    p: "p",
    strong: "strong",
    ...props.components
  };
  return $jsxs($Fragment, {
    children: [$jsx($components.h1, {
      id: "include",
      children: "Include"
    }), "\n", $jsx($components.p, {
      children: "Prose before the include."
    }), "\n", $jsxs($components.p, {
      children: ["Shared ", $jsx($components.strong, {
        children: "partial"
      }), " content pulled in via ", $jsx($components.code, {
        children: "@include"
      }), "."]
    }), "\n", $jsx($components.p, {
      children: "Prose after the include."
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
