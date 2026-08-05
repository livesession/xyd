"use strict";
const {jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Steps directive"
};
function $createMdxContent(props) {
  const $components = {
    code: "code",
    p: "p",
    pre: "pre",
    ...props.components
  }, {Steps} = $components;
  if (!Steps) $missingMdxReference("Steps", true);
  if (!Steps.Item) $missingMdxReference("Steps.Item", true);
  return $jsxs(Steps, {
    children: [$jsxs(Steps.Item, {
      children: [$jsx($components.p, {
        children: "Install the CLI:"
      }), $jsx($components.pre, {
        title: "",
        highlighted: "{\"value\":\"npm i -g xyd-js\\n\",\"lang\":\"shellscript\",\"meta\":\"bash\",\"code\":\"npm i -g xyd-js\\n\",\"tokens\":[[\"npm\",\"#FFA657\"],\" \",[\"i\",\"#A5D6FF\"],\" \",[\"-g\",\"#79C0FF\"],\" \",[\"xyd-js\",\"#A5D6FF\"],\"\\n\"],\"annotations\":[],\"themeName\":\"github-dark\",\"style\":{\"color\":\"#c9d1d9\",\"background\":\"#0d1117\",\"colorScheme\":\"dark\"}}",
        descriptionContent: "",
        attributes: "{}",
        children: $jsx($components.code, {
          className: "language-bash",
          regions: "[]",
          lineRanges: "[]",
          meta: "bash",
          title: "",
          attributes: "{}",
          children: "npm i -g xyd-js\n"
        })
      })]
    }), $jsx(Steps.Item, {
      children: $jsxs($components.p, {
        children: ["Create a ", $jsx($components.code, {
          children: "docs.json"
        }), " file."]
      })
    }), $jsx(Steps.Item, {
      children: $jsxs($components.p, {
        children: ["Run ", $jsx($components.code, {
          children: "xyd"
        }), " to start the dev server."]
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
