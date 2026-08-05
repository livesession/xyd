"use strict";
const {Fragment: $Fragment, jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Changelog function"
};
function $createMdxContent(props) {
  const $components = {
    h1: "h1",
    li: "li",
    ul: "ul",
    ...props.components
  }, {Update} = $components;
  if (!Update) $missingMdxReference("Update", true);
  return $jsxs($Fragment, {
    children: [$jsx($components.h1, {
      id: "changelog",
      children: "Changelog"
    }), "\n", $jsxs($Fragment, {
      children: [$jsx(Update, {
        version: "1.1.0",
        date: "",
        children: $jsxs($components.ul, {
          children: ["\n", $jsx($components.li, {
            children: "added the changelog function"
          }), "\n"]
        })
      }), $jsx(Update, {
        version: "1.0.0",
        date: "",
        children: $jsxs($components.ul, {
          children: ["\n", $jsx($components.li, {
            children: "first release"
          }), "\n"]
        })
      })]
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
