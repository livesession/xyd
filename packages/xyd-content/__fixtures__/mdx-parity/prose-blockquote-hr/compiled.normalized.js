"use strict";
const {Fragment: $Fragment, jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Blockquotes and rules"
};
function $createMdxContent(props) {
  const $components = {
    blockquote: "blockquote",
    hr: "hr",
    p: "p",
    strong: "strong",
    ...props.components
  };
  return $jsxs($Fragment, {
    children: [$jsxs($components.blockquote, {
      children: ["\n", $jsx($components.p, {
        children: "A single-line quote."
      }), "\n"]
    }), "\n", $jsxs($components.blockquote, {
      children: ["\n", $jsxs($components.p, {
        children: ["A quote with ", $jsx($components.strong, {
          children: "emphasis"
        }), "\nspanning two lines."]
      }), "\n", $jsxs($components.blockquote, {
        children: ["\n", $jsx($components.p, {
          children: "And a nested quote."
        }), "\n"]
      }), "\n"]
    }), "\n", $jsx($components.hr, {}), "\n", $jsx($components.p, {
      children: "After the thematic break."
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
