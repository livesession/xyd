"use strict";
const {Fragment: $Fragment, jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Unsupported Math"
};
function $createMdxContent(props) {
  const $components = {
    annotation: "annotation",
    code: "code",
    math: "math",
    mfrac: "mfrac",
    mi: "mi",
    mrow: "mrow",
    p: "p",
    semantics: "semantics",
    span: "span",
    ...props.components
  };
  return $jsxs($Fragment, {
    children: [$jsxs($components.p, {
      children: ["This page uses the deprecated ", $jsx($components.code, {
        children: "\\over"
      }), " primitive, which KaTeX renders but the\nRust MathML renderer (pulldown-latex) deliberately does not support:"]
    }), "\n", $jsx($components.span, {
      className: "katex-display",
      children: $jsxs($components.span, {
        className: "katex",
        children: [$jsx($components.span, {
          className: "katex-mathml",
          children: $jsx($components.math, {
            xmlns: "http://www.w3.org/1998/Math/MathML",
            display: "block",
            children: $jsxs($components.semantics, {
              children: [$jsx($components.mrow, {
                children: $jsxs($components.mfrac, {
                  children: [$jsx($components.mi, {
                    children: "a"
                  }), $jsx($components.mi, {
                    children: "b"
                  })]
                })
              }), $jsx($components.annotation, {
                encoding: "application/x-tex",
                children: "a \\over b"
              })]
            })
          })
        }), $jsx($components.span, {
          className: "katex-html",
          "aria-hidden": "true",
          children: $jsxs($components.span, {
            className: "base",
            children: [$jsx($components.span, {
              className: "strut",
              style: {
                height: "1.7936em",
                verticalAlign: "-0.686em"
              }
            }), $jsxs($components.span, {
              className: "mord",
              children: [$jsx($components.span, {
                className: "mopen nulldelimiter"
              }), $jsx($components.span, {
                className: "mfrac",
                children: $jsxs($components.span, {
                  className: "vlist-t vlist-t2",
                  children: [$jsxs($components.span, {
                    className: "vlist-r",
                    children: [$jsxs($components.span, {
                      className: "vlist",
                      style: {
                        height: "1.1076em"
                      },
                      children: [$jsxs($components.span, {
                        style: {
                          top: "-2.314em"
                        },
                        children: [$jsx($components.span, {
                          className: "pstrut",
                          style: {
                            height: "3em"
                          }
                        }), $jsx($components.span, {
                          className: "mord",
                          children: $jsx($components.span, {
                            className: "mord mathnormal",
                            children: "b"
                          })
                        })]
                      }), $jsxs($components.span, {
                        style: {
                          top: "-3.23em"
                        },
                        children: [$jsx($components.span, {
                          className: "pstrut",
                          style: {
                            height: "3em"
                          }
                        }), $jsx($components.span, {
                          className: "frac-line",
                          style: {
                            borderBottomWidth: "0.04em"
                          }
                        })]
                      }), $jsxs($components.span, {
                        style: {
                          top: "-3.677em"
                        },
                        children: [$jsx($components.span, {
                          className: "pstrut",
                          style: {
                            height: "3em"
                          }
                        }), $jsx($components.span, {
                          className: "mord",
                          children: $jsx($components.span, {
                            className: "mord mathnormal",
                            children: "a"
                          })
                        })]
                      })]
                    }), $jsx($components.span, {
                      className: "vlist-s",
                      children: "​"
                    })]
                  }), $jsx($components.span, {
                    className: "vlist-r",
                    children: $jsx($components.span, {
                      className: "vlist",
                      style: {
                        height: "0.686em"
                      },
                      children: $jsx($components.span, {})
                    })
                  })]
                })
              }), $jsx($components.span, {
                className: "mclose nulldelimiter"
              })]
            })]
          })
        })]
      })
    }), "\n", $jsx($components.p, {
      children: "so the whole page honestly falls back to the JS KaTeX pipeline — never a wrong\nrender."
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
