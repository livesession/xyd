"use strict";
const {jsx: $jsx} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "OpenAPI reference",
  "uniform": "./api.yaml"
};
function $createMdxContent(props) {
  const $components = {
    p: "p",
    ...props.components
  };
  return $jsx($components.p, {
    children: "Hand-written prose composed with the auto-generated API reference above."
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
