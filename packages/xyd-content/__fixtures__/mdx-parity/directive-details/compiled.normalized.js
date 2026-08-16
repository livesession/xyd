"use strict";
const {jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Details directive"
};
function $createMdxContent(props) {
  const $components = {
    li: "li",
    p: "p",
    ul: "ul",
    ...props.components
  }, {Details} = $components;
  if (!Details) $missingMdxReference("Details", true);
  return $jsxs(Details, {
    label: "Show more",
    children: [$jsx($components.p, {
      children: "Hidden content revealed on expand, including a list:"
    }), $jsxs($components.ul, {
      children: ["\n", $jsx($components.li, {
        children: "one"
      }), "\n", $jsx($components.li, {
        children: "two"
      }), "\n"]
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
function $missingMdxReference(id, component) {
  throw new Error("Expected " + (component ? "component" : "object") + " `" + id + "` to be defined: you likely forgot to import, pass, or provide it.");
}
