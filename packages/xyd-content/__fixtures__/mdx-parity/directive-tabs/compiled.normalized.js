"use strict";
const {jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Tabs directive"
};
function $createMdxContent(props) {
  const {Tabs} = props.components || ({});
  if (!Tabs) $missingMdxReference("Tabs", true);
  if (!Tabs.Content) $missingMdxReference("Tabs.Content", true);
  if (!Tabs.Item) $missingMdxReference("Tabs.Item", true);
  return $jsxs(Tabs, {
    children: [$jsx(Tabs.Item, {
      value: "type=first",
      href: "type=first",
      children: "First"
    }), $jsx(Tabs.Item, {
      value: "type=second",
      href: "type=second",
      children: "Second"
    }), $jsx(Tabs.Content, {
      value: "type=first"
    }), $jsx(Tabs.Content, {
      value: "type=second"
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
