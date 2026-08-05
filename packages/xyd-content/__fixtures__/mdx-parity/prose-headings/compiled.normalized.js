"use strict";
const {Fragment: $Fragment, jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [{
  "depth": 2,
  "id": "level-two",
  "value": "Level Two",
  "attributes": {
    "hProperties": {
      "id": "level-two"
    }
  },
  "children": [],
  "maxTocDepth": undefined
}];
const frontmatter = {
  "title": "Headings",
  "description": "Six heading levels and paragraphs"
};
function $createMdxContent(props) {
  const $components = {
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    h5: "h5",
    h6: "h6",
    p: "p",
    ...props.components
  };
  return $jsxs($Fragment, {
    children: [$jsx($components.h1, {
      id: "level-one",
      children: "Level One"
    }), "\n", $jsx($components.p, {
      children: "Intro paragraph under the top heading."
    }), "\n", $jsx($components.h2, {
      id: "level-two",
      children: "Level Two"
    }), "\n", $jsx($components.p, {
      children: "A second paragraph, with a trailing sentence."
    }), "\n", $jsx($components.h3, {
      id: "level-three",
      children: "Level Three"
    }), "\n", $jsx($components.h4, {
      id: "level-four",
      children: "Level Four"
    }), "\n", $jsx($components.h5, {
      id: "level-five",
      children: "Level Five"
    }), "\n", $jsx($components.h6, {
      id: "level-six",
      children: "Level Six"
    }), "\n", $jsx($components.p, {
      children: "Closing paragraph."
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
