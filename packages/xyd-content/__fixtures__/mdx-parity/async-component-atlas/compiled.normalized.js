"use strict";
const {Fragment: $Fragment, jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Atlas meta component",
  "component": "atlas"
};
function $createMdxContent(props) {
  const $components = {
    code: "code",
    h1: "h1",
    p: "p",
    ...props.components
  };
  return $jsxs($Fragment, {
    children: [$jsx($components.h1, {
      id: "atlas",
      children: "Atlas"
    }), "\n", $jsxs($components.p, {
      children: ["Content composed under the ", $jsx($components.code, {
        children: "atlas"
      }), " meta component."]
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
