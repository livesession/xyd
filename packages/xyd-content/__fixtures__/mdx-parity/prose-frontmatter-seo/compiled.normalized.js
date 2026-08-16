"use strict";
const {Fragment: $Fragment, jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "SEO frontmatter",
  "description": "Page description used for meta",
  "seoTitle": "Custom SEO Title",
  "seoDescription": "Custom SEO description overriding the default",
  "og:title": "OpenGraph title"
};
function $createMdxContent(props) {
  const $components = {
    h1: "h1",
    p: "p",
    ...props.components
  };
  return $jsxs($Fragment, {
    children: [$jsx($components.h1, {
      id: "seo",
      children: "SEO"
    }), "\n", $jsx($components.p, {
      children: "Body content follows the extended frontmatter."
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
