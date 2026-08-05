"use strict";
const {Fragment: $Fragment, jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Images"
};
function $createMdxContent(props) {
  const $components = {
    img: "img",
    p: "p",
    ...props.components
  };
  return $jsxs($Fragment, {
    children: [$jsx($components.p, {
      children: "A standalone image:"
    }), "\n", $jsx($components.p, {
      children: $jsx($components.img, {
        src: "/assets/logo.png",
        alt: "Alt text",
        title: "Logo title"
      })
    }), "\n", $jsxs($components.p, {
      children: ["Inline image inside a paragraph: ", $jsx($components.img, {
        src: "/assets/icon.svg",
        alt: "icon"
      }), " sits here."]
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
