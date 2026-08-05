"use strict";
const {Fragment: $Fragment, jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Math"
};
function $createMdxContent(props) {
  const $components = {
    annotation: "annotation",
    math: "math",
    mfrac: "mfrac",
    mi: "mi",
    mn: "mn",
    mo: "mo",
    mrow: "mrow",
    msubsup: "msubsup",
    msup: "msup",
    mtext: "mtext",
    p: "p",
    semantics: "semantics",
    span: "span",
    ...props.components
  };
  return $jsxs($Fragment, {
    children: [$jsxs($components.p, {
      children: ["Inline math ", $jsxs($components.span, {
        className: "katex",
        children: [$jsx($components.span, {
          className: "katex-mathml",
          children: $jsx($components.math, {
            xmlns: "http://www.w3.org/1998/Math/MathML",
            children: $jsxs($components.semantics, {
              children: [$jsxs($components.mrow, {
                children: [$jsxs($components.msup, {
                  children: [$jsx($components.mi, {
                    children: "a"
                  }), $jsx($components.mn, {
                    children: "2"
                  })]
                }), $jsx($components.mo, {
                  children: "+"
                }), $jsxs($components.msup, {
                  children: [$jsx($components.mi, {
                    children: "b"
                  }), $jsx($components.mn, {
                    children: "2"
                  })]
                }), $jsx($components.mo, {
                  children: "="
                }), $jsxs($components.msup, {
                  children: [$jsx($components.mi, {
                    children: "c"
                  }), $jsx($components.mn, {
                    children: "2"
                  })]
                })]
              }), $jsx($components.annotation, {
                encoding: "application/x-tex",
                children: "a^2 + b^2 = c^2"
              })]
            })
          })
        }), $jsxs($components.span, {
          className: "katex-html",
          "aria-hidden": "true",
          children: [$jsxs($components.span, {
            className: "base",
            children: [$jsx($components.span, {
              className: "strut",
              style: {
                height: "0.8974em",
                verticalAlign: "-0.0833em"
              }
            }), $jsxs($components.span, {
              className: "mord",
              children: [$jsx($components.span, {
                className: "mord mathnormal",
                children: "a"
              }), $jsx($components.span, {
                className: "msupsub",
                children: $jsx($components.span, {
                  className: "vlist-t",
                  children: $jsx($components.span, {
                    className: "vlist-r",
                    children: $jsx($components.span, {
                      className: "vlist",
                      style: {
                        height: "0.8141em"
                      },
                      children: $jsxs($components.span, {
                        style: {
                          top: "-3.063em",
                          marginRight: "0.05em"
                        },
                        children: [$jsx($components.span, {
                          className: "pstrut",
                          style: {
                            height: "2.7em"
                          }
                        }), $jsx($components.span, {
                          className: "sizing reset-size6 size3 mtight",
                          children: $jsx($components.span, {
                            className: "mord mtight",
                            children: "2"
                          })
                        })]
                      })
                    })
                  })
                })
              })]
            }), $jsx($components.span, {
              className: "mspace",
              style: {
                marginRight: "0.2222em"
              }
            }), $jsx($components.span, {
              className: "mbin",
              children: "+"
            }), $jsx($components.span, {
              className: "mspace",
              style: {
                marginRight: "0.2222em"
              }
            })]
          }), $jsxs($components.span, {
            className: "base",
            children: [$jsx($components.span, {
              className: "strut",
              style: {
                height: "0.8141em"
              }
            }), $jsxs($components.span, {
              className: "mord",
              children: [$jsx($components.span, {
                className: "mord mathnormal",
                children: "b"
              }), $jsx($components.span, {
                className: "msupsub",
                children: $jsx($components.span, {
                  className: "vlist-t",
                  children: $jsx($components.span, {
                    className: "vlist-r",
                    children: $jsx($components.span, {
                      className: "vlist",
                      style: {
                        height: "0.8141em"
                      },
                      children: $jsxs($components.span, {
                        style: {
                          top: "-3.063em",
                          marginRight: "0.05em"
                        },
                        children: [$jsx($components.span, {
                          className: "pstrut",
                          style: {
                            height: "2.7em"
                          }
                        }), $jsx($components.span, {
                          className: "sizing reset-size6 size3 mtight",
                          children: $jsx($components.span, {
                            className: "mord mtight",
                            children: "2"
                          })
                        })]
                      })
                    })
                  })
                })
              })]
            }), $jsx($components.span, {
              className: "mspace",
              style: {
                marginRight: "0.2778em"
              }
            }), $jsx($components.span, {
              className: "mrel",
              children: "="
            }), $jsx($components.span, {
              className: "mspace",
              style: {
                marginRight: "0.2778em"
              }
            })]
          }), $jsxs($components.span, {
            className: "base",
            children: [$jsx($components.span, {
              className: "strut",
              style: {
                height: "0.8141em"
              }
            }), $jsxs($components.span, {
              className: "mord",
              children: [$jsx($components.span, {
                className: "mord mathnormal",
                children: "c"
              }), $jsx($components.span, {
                className: "msupsub",
                children: $jsx($components.span, {
                  className: "vlist-t",
                  children: $jsx($components.span, {
                    className: "vlist-r",
                    children: $jsx($components.span, {
                      className: "vlist",
                      style: {
                        height: "0.8141em"
                      },
                      children: $jsxs($components.span, {
                        style: {
                          top: "-3.063em",
                          marginRight: "0.05em"
                        },
                        children: [$jsx($components.span, {
                          className: "pstrut",
                          style: {
                            height: "2.7em"
                          }
                        }), $jsx($components.span, {
                          className: "sizing reset-size6 size3 mtight",
                          children: $jsx($components.span, {
                            className: "mord mtight",
                            children: "2"
                          })
                        })]
                      })
                    })
                  })
                })
              })]
            })]
          })]
        })]
      }), " within a sentence."]
    }), "\n", $jsx($components.p, {
      children: "Block math:"
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
              children: [$jsxs($components.mrow, {
                children: [$jsxs($components.msubsup, {
                  children: [$jsx($components.mo, {
                    children: "∫"
                  }), $jsx($components.mn, {
                    children: "0"
                  }), $jsx($components.mn, {
                    children: "1"
                  })]
                }), $jsxs($components.msup, {
                  children: [$jsx($components.mi, {
                    children: "x"
                  }), $jsx($components.mn, {
                    children: "2"
                  })]
                }), $jsx($components.mtext, {
                  children: " "
                }), $jsx($components.mi, {
                  children: "d"
                }), $jsx($components.mi, {
                  children: "x"
                }), $jsx($components.mo, {
                  children: "="
                }), $jsxs($components.mfrac, {
                  children: [$jsx($components.mn, {
                    children: "1"
                  }), $jsx($components.mn, {
                    children: "3"
                  })]
                })]
              }), $jsx($components.annotation, {
                encoding: "application/x-tex",
                children: "\\int_0^1 x^2 \\, dx = \\frac{1}{3}"
              })]
            })
          })
        }), $jsxs($components.span, {
          className: "katex-html",
          "aria-hidden": "true",
          children: [$jsxs($components.span, {
            className: "base",
            children: [$jsx($components.span, {
              className: "strut",
              style: {
                height: "2.476em",
                verticalAlign: "-0.9119em"
              }
            }), $jsxs($components.span, {
              className: "mop",
              children: [$jsx($components.span, {
                className: "mop op-symbol large-op",
                style: {
                  marginRight: "0.4445em",
                  position: "relative",
                  top: "-0.0011em"
                },
                children: "∫"
              }), $jsx($components.span, {
                className: "msupsub",
                children: $jsxs($components.span, {
                  className: "vlist-t vlist-t2",
                  children: [$jsxs($components.span, {
                    className: "vlist-r",
                    children: [$jsxs($components.span, {
                      className: "vlist",
                      style: {
                        height: "1.564em"
                      },
                      children: [$jsxs($components.span, {
                        style: {
                          top: "-1.7881em",
                          marginLeft: "-0.4445em",
                          marginRight: "0.05em"
                        },
                        children: [$jsx($components.span, {
                          className: "pstrut",
                          style: {
                            height: "2.7em"
                          }
                        }), $jsx($components.span, {
                          className: "sizing reset-size6 size3 mtight",
                          children: $jsx($components.span, {
                            className: "mord mtight",
                            children: "0"
                          })
                        })]
                      }), $jsxs($components.span, {
                        style: {
                          top: "-3.8129em",
                          marginRight: "0.05em"
                        },
                        children: [$jsx($components.span, {
                          className: "pstrut",
                          style: {
                            height: "2.7em"
                          }
                        }), $jsx($components.span, {
                          className: "sizing reset-size6 size3 mtight",
                          children: $jsx($components.span, {
                            className: "mord mtight",
                            children: "1"
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
                        height: "0.9119em"
                      },
                      children: $jsx($components.span, {})
                    })
                  })]
                })
              })]
            }), $jsx($components.span, {
              className: "mspace",
              style: {
                marginRight: "0.1667em"
              }
            }), $jsxs($components.span, {
              className: "mord",
              children: [$jsx($components.span, {
                className: "mord mathnormal",
                children: "x"
              }), $jsx($components.span, {
                className: "msupsub",
                children: $jsx($components.span, {
                  className: "vlist-t",
                  children: $jsx($components.span, {
                    className: "vlist-r",
                    children: $jsx($components.span, {
                      className: "vlist",
                      style: {
                        height: "0.8641em"
                      },
                      children: $jsxs($components.span, {
                        style: {
                          top: "-3.113em",
                          marginRight: "0.05em"
                        },
                        children: [$jsx($components.span, {
                          className: "pstrut",
                          style: {
                            height: "2.7em"
                          }
                        }), $jsx($components.span, {
                          className: "sizing reset-size6 size3 mtight",
                          children: $jsx($components.span, {
                            className: "mord mtight",
                            children: "2"
                          })
                        })]
                      })
                    })
                  })
                })
              })]
            }), $jsx($components.span, {
              className: "mspace",
              style: {
                marginRight: "0.1667em"
              }
            }), $jsx($components.span, {
              className: "mord mathnormal",
              children: "d"
            }), $jsx($components.span, {
              className: "mord mathnormal",
              children: "x"
            }), $jsx($components.span, {
              className: "mspace",
              style: {
                marginRight: "0.2778em"
              }
            }), $jsx($components.span, {
              className: "mrel",
              children: "="
            }), $jsx($components.span, {
              className: "mspace",
              style: {
                marginRight: "0.2778em"
              }
            })]
          }), $jsxs($components.span, {
            className: "base",
            children: [$jsx($components.span, {
              className: "strut",
              style: {
                height: "2.0074em",
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
                        height: "1.3214em"
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
                            className: "mord",
                            children: "3"
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
                            className: "mord",
                            children: "1"
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
          })]
        })]
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
