"use strict";
const {Fragment: $Fragment, jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Subtitle and badge"
};
function $createMdxContent(props) {
  const $components = {
    h1: "h1",
    p: "p",
    ...props.components
  }, {Subtitle} = $components;
  if (!Subtitle) $missingMdxReference("Subtitle", true);
  return $jsxs($Fragment, {
    children: [$jsx($components.h1, {
      id: "overview",
      children: "Overview"
    }), "\n", $jsx(Subtitle, {
      children: $jsx($components.p, {
        children: "A concise subtitle under the page heading."
      })
    }), "\n", $jsx($components.p, {
      children: "Status: :::badge[Beta]"
    }), "\n", $jsx($components.p, {
      children: "Body paragraph after the subtitle."
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
