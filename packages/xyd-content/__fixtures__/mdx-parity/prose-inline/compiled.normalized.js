"use strict";
const {Fragment: $Fragment, jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Inline formatting"
};
function $createMdxContent(props) {
  const $components = {
    a: "a",
    code: "code",
    del: "del",
    em: "em",
    p: "p",
    strong: "strong",
    ...props.components
  };
  return $jsxs($Fragment, {
    children: [$jsxs($components.p, {
      children: ["Text with ", $jsx($components.strong, {
        children: "bold"
      }), ", ", $jsx($components.em, {
        children: "italic"
      }), ", ", $jsx($components.em, {
        children: $jsx($components.strong, {
          children: "both"
        })
      }), ", ", $jsx($components.del, {
        children: "strikethrough"
      }), ", and ", $jsx($components.code, {
        children: "inline code"
      }), "."]
    }), "\n", $jsxs($components.p, {
      children: ["A ", $jsx($components.a, {
        href: "https://xyd.dev",
        title: "the title",
        children: "labelled link"
      }), " and a second\n", $jsx($components.a, {
        href: "https://example.com",
        children: "reference"
      }), " close out this image-free sentence."]
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
