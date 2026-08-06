"use strict";
const {Fragment: $Fragment, jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Output vars simple"
};
function $createMdxContent(props) {
  const $components = {
    code: "code",
    div: "div",
    h1: "h1",
    p: "p",
    pre: "pre",
    ...props.components
  };
  return $jsxs($Fragment, {
    children: [$jsx($components.h1, {
      id: "install",
      children: "Install"
    }), "\n", $jsxs($components.div, {
      children: [$jsx($components.pre, {
        title: "npm",
        highlighted: "{\"value\":\"npm i -g xyd-js\\n\",\"lang\":\"shellscript\",\"meta\":\"bash\",\"code\":\"npm i -g xyd-js\\n\",\"tokens\":[[\"npm\",\"#FFA657\"],\" \",[\"i\",\"#A5D6FF\"],\" \",[\"-g\",\"#79C0FF\"],\" \",[\"xyd-js\",\"#A5D6FF\"],\"\\n\"],\"annotations\":[],\"themeName\":\"github-dark\",\"style\":{\"color\":\"#c9d1d9\",\"background\":\"#0d1117\",\"colorScheme\":\"dark\"}}",
        descriptionContent: "",
        attributes: "{}",
        children: $jsx($components.code, {
          className: "language-bash",
          regions: "[]",
          lineRanges: "[]",
          meta: "bash",
          title: "npm",
          attributes: "{}",
          children: "npm i -g xyd-js\n"
        })
      }), $jsx($components.pre, {
        title: "pnpm",
        highlighted: "{\"value\":\"pnpm add -g xyd-js\\n\",\"lang\":\"shellscript\",\"meta\":\"bash\",\"code\":\"pnpm add -g xyd-js\\n\",\"tokens\":[[\"pnpm\",\"#FFA657\"],\" \",[\"add\",\"#A5D6FF\"],\" \",[\"-g\",\"#79C0FF\"],\" \",[\"xyd-js\",\"#A5D6FF\"],\"\\n\"],\"annotations\":[],\"themeName\":\"github-dark\",\"style\":{\"color\":\"#c9d1d9\",\"background\":\"#0d1117\",\"colorScheme\":\"dark\"}}",
        descriptionContent: "",
        attributes: "{}",
        children: $jsx($components.code, {
          className: "language-bash",
          regions: "[]",
          lineRanges: "[]",
          meta: "bash",
          title: "pnpm",
          attributes: "{}",
          children: "pnpm add -g xyd-js\n"
        })
      })]
    }), "\n", $jsx($components.p, {
      children: "Done."
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
