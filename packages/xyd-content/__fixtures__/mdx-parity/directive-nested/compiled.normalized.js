"use strict";
const {jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Nested directives"
};
function $createMdxContent(props) {
  const $components = {
    code: "code",
    p: "p",
    ...props.components
  }, {Callout, DirectiveCodeGroup, Steps} = $components;
  if (!Callout) $missingMdxReference("Callout", true);
  if (!DirectiveCodeGroup) $missingMdxReference("DirectiveCodeGroup", true);
  if (!Steps) $missingMdxReference("Steps", true);
  if (!Steps.Item) $missingMdxReference("Steps.Item", true);
  return $jsxs(Steps, {
    children: [$jsxs(Steps.Item, {
      children: [$jsx($components.p, {
        children: "Install with your package manager:"
      }), $jsx(DirectiveCodeGroup, {
        title: "install",
        description: "install",
        codeblocks: "[{\"value\":\"bun add -g xyd-js\",\"lang\":\"bash\",\"meta\":\"bun\",\"highlighted\":{\"value\":\"bun add -g xyd-js\",\"lang\":\"shellscript\",\"meta\":\"bun\",\"code\":\"bun add -g xyd-js\",\"tokens\":[[\"bun\",\"#FFA657\"],\" \",[\"add\",\"#A5D6FF\"],\" \",[\"-g\",\"#79C0FF\"],\" \",[\"xyd-js\",\"#A5D6FF\"]],\"annotations\":[],\"themeName\":\"github-dark\",\"style\":{\"color\":\"#c9d1d9\",\"background\":\"#0d1117\",\"colorScheme\":\"dark\"}}},{\"value\":\"npm i -g xyd-js\",\"lang\":\"bash\",\"meta\":\"npm\",\"highlighted\":{\"value\":\"npm i -g xyd-js\",\"lang\":\"shellscript\",\"meta\":\"npm\",\"code\":\"npm i -g xyd-js\",\"tokens\":[[\"npm\",\"#FFA657\"],\" \",[\"i\",\"#A5D6FF\"],\" \",[\"-g\",\"#79C0FF\"],\" \",[\"xyd-js\",\"#A5D6FF\"]],\"annotations\":[],\"themeName\":\"github-dark\",\"style\":{\"color\":\"#c9d1d9\",\"background\":\"#0d1117\",\"colorScheme\":\"dark\"}}}]"
      })]
    }), $jsxs(Steps.Item, {
      children: [$jsx($components.p, {
        children: "Read the note below:"
      }), $jsx(Callout, {
        kind: "warning",
        children: $jsx($components.p, {
          children: "Requires Node 22.12+."
        })
      })]
    }), $jsx(Steps.Item, {
      children: $jsxs($components.p, {
        children: ["Run ", $jsx($components.code, {
          children: "xyd"
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
