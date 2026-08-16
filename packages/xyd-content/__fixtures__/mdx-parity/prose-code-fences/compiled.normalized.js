"use strict";
const {Fragment: $Fragment, jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Code fences"
};
function $createMdxContent(props) {
  const $components = {
    code: "code",
    p: "p",
    pre: "pre",
    ...props.components
  };
  return $jsxs($Fragment, {
    children: [$jsx($components.p, {
      children: "A JavaScript block:"
    }), "\n", $jsx($components.pre, {
      title: "",
      highlighted: "{\"value\":\"const answer = 42;\\nconsole.log(answer);\\n\",\"lang\":\"javascript\",\"meta\":\"js\",\"code\":\"const answer = 42;\\nconsole.log(answer);\\n\",\"tokens\":[[\"const\",\"#FF7B72\"],\" \",[\"answer\",\"#79C0FF\"],\" \",[\"=\",\"#FF7B72\"],\" \",[\"42\",\"#79C0FF\"],[\";\",\"#C9D1D9\"],\"\\n\",[\"console.\",\"#C9D1D9\"],[\"log\",\"#D2A8FF\"],[\"(answer);\",\"#C9D1D9\"],\"\\n\"],\"annotations\":[],\"themeName\":\"github-dark\",\"style\":{\"color\":\"#c9d1d9\",\"background\":\"#0d1117\",\"colorScheme\":\"dark\"}}",
      descriptionContent: "",
      attributes: "{}",
      children: $jsx($components.code, {
        className: "language-js",
        regions: "[]",
        lineRanges: "[]",
        meta: "js",
        title: "",
        attributes: "{}",
        children: "const answer = 42;\nconsole.log(answer);\n"
      })
    }), "\n", $jsx($components.p, {
      children: "A shell block with a highlighted line:"
    }), "\n", $jsx($components.pre, {
      title: "",
      highlighted: "{\"value\":\"echo \\\"hello\\\"\\necho \\\"world\\\"\\n\",\"lang\":\"shellscript\",\"meta\":\"bash\",\"code\":\"echo \\\"hello\\\"\\necho \\\"world\\\"\\n\",\"tokens\":[[\"echo\",\"#79C0FF\"],\" \",[\"\\\"hello\\\"\",\"#A5D6FF\"],\"\\n\",[\"echo\",\"#79C0FF\"],\" \",[\"\\\"world\\\"\",\"#A5D6FF\"],\"\\n\"],\"annotations\":[],\"themeName\":\"github-dark\",\"style\":{\"color\":\"#c9d1d9\",\"background\":\"#0d1117\",\"colorScheme\":\"dark\"}}",
      descriptionContent: "",
      attributes: "{}",
      children: $jsx($components.code, {
        className: "language-bash",
        regions: "[]",
        lineRanges: "[]",
        meta: "bash",
        title: "",
        attributes: "{}",
        children: "echo \"hello\"\necho \"world\"\n"
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
