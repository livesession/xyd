"use strict";
const {Fragment: $Fragment, jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Callout directive"
};
function $createMdxContent(props) {
  const $components = {
    a: "a",
    p: "p",
    strong: "strong",
    ...props.components
  }, {Callout} = $components;
  if (!Callout) $missingMdxReference("Callout", true);
  return $jsxs($Fragment, {
    children: [$jsx(Callout, {
      children: $jsxs($components.p, {
        children: ["Default informational callout with ", $jsx($components.strong, {
          children: "bold"
        }), " text."]
      })
    }), "\n", $jsx(Callout, {
      kind: "warning",
      children: $jsx($components.p, {
        children: "A warning callout."
      })
    }), "\n", $jsx(Callout, {
      kind: "danger",
      children: $jsxs($components.p, {
        children: ["A danger callout with a ", $jsx($components.a, {
          href: "https://xyd.dev",
          children: "link"
        }), "."]
      })
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
