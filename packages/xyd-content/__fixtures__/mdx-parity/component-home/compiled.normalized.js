"use strict";
const {jsx: $jsx} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "home page",
  "component": "home"
};
function $createMdxContent(props) {
  const {PageHome} = props.components || ({});
  if (!PageHome) $missingMdxReference("PageHome", true);
  return $jsx(PageHome, {});
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
