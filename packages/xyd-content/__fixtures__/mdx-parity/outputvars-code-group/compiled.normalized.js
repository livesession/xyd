"use strict";
const {jsx: $jsx} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Output vars with code group"
};
function $createMdxContent(props) {
  const $components = {
    div: "div",
    ...props.components
  }, {DirectiveCodeGroup} = $components;
  if (!DirectiveCodeGroup) $missingMdxReference("DirectiveCodeGroup", true);
  return $jsx($components.div, {
    children: $jsx(DirectiveCodeGroup, {
      title: "install",
      description: "install",
      codeblocks: "[{\"value\":\"bun add -g xyd-js\",\"lang\":\"bash\",\"meta\":\"bun\",\"highlighted\":{\"value\":\"bun add -g xyd-js\",\"lang\":\"shellscript\",\"meta\":\"bun\",\"code\":\"bun add -g xyd-js\",\"tokens\":[[\"bun\",\"#FFA657\"],\" \",[\"add\",\"#A5D6FF\"],\" \",[\"-g\",\"#79C0FF\"],\" \",[\"xyd-js\",\"#A5D6FF\"]],\"annotations\":[],\"themeName\":\"github-dark\",\"style\":{\"color\":\"#c9d1d9\",\"background\":\"#0d1117\",\"colorScheme\":\"dark\"}}},{\"value\":\"pnpm add -g xyd-js\",\"lang\":\"bash\",\"meta\":\"pnpm\",\"highlighted\":{\"value\":\"pnpm add -g xyd-js\",\"lang\":\"shellscript\",\"meta\":\"pnpm\",\"code\":\"pnpm add -g xyd-js\",\"tokens\":[[\"pnpm\",\"#FFA657\"],\" \",[\"add\",\"#A5D6FF\"],\" \",[\"-g\",\"#79C0FF\"],\" \",[\"xyd-js\",\"#A5D6FF\"]],\"annotations\":[],\"themeName\":\"github-dark\",\"style\":{\"color\":\"#c9d1d9\",\"background\":\"#0d1117\",\"colorScheme\":\"dark\"}}}]"
    })
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
