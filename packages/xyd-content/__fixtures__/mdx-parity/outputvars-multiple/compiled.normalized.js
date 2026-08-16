"use strict";
const {Fragment: $Fragment, jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Output vars multiple"
};
function $createMdxContent(props) {
  const $components = {
    code: "code",
    div: "div",
    pre: "pre",
    ...props.components
  };
  return $jsxs($Fragment, {
    children: [$jsx($components.div, {
      children: $jsx($components.pre, {
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
      })
    }), "\n", $jsx($components.div, {
      children: $jsx($components.pre, {
        title: "",
        highlighted: "{\"value\":\"const x = 1\\n\",\"lang\":\"tsx\",\"meta\":\"tsx\",\"code\":\"const x = 1\\n\",\"tokens\":[[\"const\",\"#FF7B72\"],\" \",[\"x\",\"#79C0FF\"],\" \",[\"=\",\"#FF7B72\"],\" \",[\"1\",\"#79C0FF\"],\"\\n\"],\"annotations\":[],\"themeName\":\"github-dark\",\"style\":{\"color\":\"#c9d1d9\",\"background\":\"#0d1117\",\"colorScheme\":\"dark\"}}",
        descriptionContent: "",
        attributes: "{}",
        children: $jsx($components.code, {
          className: "language-tsx",
          regions: "[]",
          lineRanges: "[]",
          meta: "tsx",
          title: "",
          attributes: "{}",
          children: "const x = 1\n"
        })
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
