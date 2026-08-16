"use strict";
const {Fragment: $Fragment, jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Lists"
};
function $createMdxContent(props) {
  const $components = {
    input: "input",
    li: "li",
    ol: "ol",
    p: "p",
    ul: "ul",
    ...props.components
  };
  return $jsxs($Fragment, {
    children: [$jsx($components.p, {
      children: "Unordered:"
    }), "\n", $jsxs($components.ul, {
      children: ["\n", $jsx($components.li, {
        children: "alpha"
      }), "\n", $jsxs($components.li, {
        children: ["beta\n", $jsxs($components.ul, {
          children: ["\n", $jsx($components.li, {
            children: "nested one"
          }), "\n", $jsx($components.li, {
            children: "nested two"
          }), "\n"]
        }), "\n"]
      }), "\n", $jsx($components.li, {
        children: "gamma"
      }), "\n"]
    }), "\n", $jsx($components.p, {
      children: "Ordered:"
    }), "\n", $jsxs($components.ol, {
      children: ["\n", $jsx($components.li, {
        children: "first"
      }), "\n", $jsxs($components.li, {
        children: ["second\n", $jsxs($components.ol, {
          children: ["\n", $jsx($components.li, {
            children: "sub-first"
          }), "\n", $jsx($components.li, {
            children: "sub-second"
          }), "\n"]
        }), "\n"]
      }), "\n", $jsx($components.li, {
        children: "third"
      }), "\n"]
    }), "\n", $jsx($components.p, {
      children: "Task list:"
    }), "\n", $jsxs($components.ul, {
      className: "contains-task-list",
      children: ["\n", $jsxs($components.li, {
        className: "task-list-item",
        children: [$jsx($components.input, {
          type: "checkbox",
          checked: true,
          disabled: true
        }), " done"]
      }), "\n", $jsxs($components.li, {
        className: "task-list-item",
        children: [$jsx($components.input, {
          type: "checkbox",
          disabled: true
        }), " todo"]
      }), "\n"]
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
