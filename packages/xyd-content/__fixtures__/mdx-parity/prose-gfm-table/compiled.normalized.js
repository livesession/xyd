"use strict";
const {jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "GFM Table"
};
function $createMdxContent(props) {
  const $components = {
    table: "table",
    tbody: "tbody",
    td: "td",
    th: "th",
    thead: "thead",
    tr: "tr",
    ...props.components
  };
  return $jsxs($components.table, {
    children: [$jsx($components.thead, {
      children: $jsxs($components.tr, {
        children: [$jsx($components.th, {
          style: {
            textAlign: "left"
          },
          children: "Left"
        }), $jsx($components.th, {
          style: {
            textAlign: "center"
          },
          children: "Center"
        }), $jsx($components.th, {
          style: {
            textAlign: "right"
          },
          children: "Right"
        })]
      })
    }), $jsxs($components.tbody, {
      children: [$jsxs($components.tr, {
        children: [$jsx($components.td, {
          style: {
            textAlign: "left"
          },
          children: "a"
        }), $jsx($components.td, {
          style: {
            textAlign: "center"
          },
          children: "b"
        }), $jsx($components.td, {
          style: {
            textAlign: "right"
          },
          children: "c"
        })]
      }), $jsxs($components.tr, {
        children: [$jsx($components.td, {
          style: {
            textAlign: "left"
          },
          children: "long cell"
        }), $jsx($components.td, {
          style: {
            textAlign: "center"
          },
          children: "mid"
        }), $jsx($components.td, {
          style: {
            textAlign: "right"
          },
          children: "42"
        })]
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
