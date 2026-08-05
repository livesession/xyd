"use strict";
const {jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Table directive"
};
function $createMdxContent(props) {
  const $components = {
    code: "code",
    p: "p",
    strong: "strong",
    ...props.components
  }, {Table} = $components;
  if (!Table) $missingMdxReference("Table", true);
  if (!Table.Head) $missingMdxReference("Table.Head", true);
  if (!Table.Td) $missingMdxReference("Table.Td", true);
  if (!Table.Th) $missingMdxReference("Table.Th", true);
  if (!Table.Tr) $missingMdxReference("Table.Tr", true);
  return $jsxs(Table, {
    children: [$jsx(Table.Head, {
      children: $jsxs(Table.Tr, {
        children: [$jsx(Table.Th, {
          children: $jsx($components.p, {
            children: "Syntax"
          })
        }), $jsx(Table.Th, {
          children: $jsx($components.p, {
            children: "Description"
          })
        }), $jsx(Table.Th, {
          children: $jsx($components.p, {
            children: "Example"
          })
        })]
      })
    }), $jsxs(Table.Tr, {
      children: [$jsx(Table.Td, {
        children: $jsx($components.p, {
          children: "Header"
        })
      }), $jsx(Table.Td, {
        children: $jsxs($components.p, {
          children: ["Sets the ", $jsx($components.strong, {
            children: "title"
          })]
        })
      }), $jsx(Table.Td, {
        children: $jsx($components.p, {
          children: $jsx($components.code, {
            children: "#"
          })
        })
      })]
    }), $jsxs(Table.Tr, {
      children: [$jsx(Table.Td, {
        children: $jsx($components.p, {
          children: "Emphasis"
        })
      }), $jsx(Table.Td, {
        children: $jsx($components.p, {
          children: "Italic and bold text"
        })
      }), $jsx(Table.Td, {
        children: $jsxs($components.p, {
          children: [$jsx($components.code, {
            children: "*"
          }), " or ", $jsx($components.code, {
            children: "**"
          })]
        })
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
function $missingMdxReference(id, component) {
  throw new Error("Expected " + (component ? "component" : "object") + " `" + id + "` to be defined: you likely forgot to import, pass, or provide it.");
}
