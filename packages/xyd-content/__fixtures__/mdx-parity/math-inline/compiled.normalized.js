"use strict";
const {Fragment: $Fragment, jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Inline Math"
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
    msup: "msup",
    p: "p",
    semantics: "semantics",
    span: "span",
    ...props.components
  };
  return $jsxs($Fragment, {
    children: [$jsxs($components.p, {
      children: ["The Pythagorean theorem is ", $jsxs($components.span, {
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
      }), " for a right triangle."]
    }), "\n", $jsxs($components.p, {
      children: ["Euler's identity, ", $jsxs($components.span, {
        className: "katex",
        children: [$jsx($components.span, {
          className: "katex-mathml",
          children: $jsx($components.math, {
            xmlns: "http://www.w3.org/1998/Math/MathML",
            children: $jsxs($components.semantics, {
              children: [$jsxs($components.mrow, {
                children: [$jsxs($components.msup, {
                  children: [$jsx($components.mi, {
                    children: "e"
                  }), $jsxs($components.mrow, {
                    children: [$jsx($components.mi, {
                      children: "i"
                    }), $jsx($components.mi, {
                      children: "π"
                    })]
                  })]
                }), $jsx($components.mo, {
                  children: "+"
                }), $jsx($components.mn, {
                  children: "1"
                }), $jsx($components.mo, {
                  children: "="
                }), $jsx($components.mn, {
                  children: "0"
                })]
              }), $jsx($components.annotation, {
                encoding: "application/x-tex",
                children: "e^{i\\pi} + 1 = 0"
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
                height: "0.908em",
                verticalAlign: "-0.0833em"
              }
            }), $jsxs($components.span, {
              className: "mord",
              children: [$jsx($components.span, {
                className: "mord mathnormal",
                children: "e"
              }), $jsx($components.span, {
                className: "msupsub",
                children: $jsx($components.span, {
                  className: "vlist-t",
                  children: $jsx($components.span, {
                    className: "vlist-r",
                    children: $jsx($components.span, {
                      className: "vlist",
                      style: {
                        height: "0.8247em"
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
                            children: $jsx($components.span, {
                              className: "mord mathnormal mtight",
                              style: {
                                marginRight: "0.0359em"
                              },
                              children: "iπ"
                            })
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
                height: "0.6444em"
              }
            }), $jsx($components.span, {
              className: "mord",
              children: "1"
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
                height: "0.6444em"
              }
            }), $jsx($components.span, {
              className: "mord",
              children: "0"
            })]
          })]
        })]
      }), ", links five constants."]
    }), "\n", $jsxs($components.p, {
      children: ["A fraction inline: ", $jsxs($components.span, {
        className: "katex",
        children: [$jsx($components.span, {
          className: "katex-mathml",
          children: $jsx($components.math, {
            xmlns: "http://www.w3.org/1998/Math/MathML",
            children: $jsxs($components.semantics, {
              children: [$jsxs($components.mrow, {
                children: [$jsxs($components.mfrac, {
                  children: [$jsx($components.mn, {
                    children: "1"
                  }), $jsx($components.mn, {
                    children: "2"
                  })]
                }), $jsx($components.mo, {
                  children: "+"
                }), $jsxs($components.mfrac, {
                  children: [$jsx($components.mn, {
                    children: "1"
                  }), $jsx($components.mn, {
                    children: "3"
                  })]
                }), $jsx($components.mo, {
                  children: "="
                }), $jsxs($components.mfrac, {
                  children: [$jsx($components.mn, {
                    children: "5"
                  }), $jsx($components.mn, {
                    children: "6"
                  })]
                })]
              }), $jsx($components.annotation, {
                encoding: "application/x-tex",
                children: "\\frac{1}{2} + \\frac{1}{3} = \\frac{5}{6}"
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
                height: "1.1901em",
                verticalAlign: "-0.345em"
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
                        height: "0.8451em"
                      },
                      children: [$jsxs($components.span, {
                        style: {
                          top: "-2.655em"
                        },
                        children: [$jsx($components.span, {
                          className: "pstrut",
                          style: {
                            height: "3em"
                          }
                        }), $jsx($components.span, {
                          className: "sizing reset-size6 size3 mtight",
                          children: $jsx($components.span, {
                            className: "mord mtight",
                            children: $jsx($components.span, {
                              className: "mord mtight",
                              children: "2"
                            })
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
                          top: "-3.394em"
                        },
                        children: [$jsx($components.span, {
                          className: "pstrut",
                          style: {
                            height: "3em"
                          }
                        }), $jsx($components.span, {
                          className: "sizing reset-size6 size3 mtight",
                          children: $jsx($components.span, {
                            className: "mord mtight",
                            children: $jsx($components.span, {
                              className: "mord mtight",
                              children: "1"
                            })
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
                        height: "0.345em"
                      },
                      children: $jsx($components.span, {})
                    })
                  })]
                })
              }), $jsx($components.span, {
                className: "mclose nulldelimiter"
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
                height: "1.1901em",
                verticalAlign: "-0.345em"
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
                        height: "0.8451em"
                      },
                      children: [$jsxs($components.span, {
                        style: {
                          top: "-2.655em"
                        },
                        children: [$jsx($components.span, {
                          className: "pstrut",
                          style: {
                            height: "3em"
                          }
                        }), $jsx($components.span, {
                          className: "sizing reset-size6 size3 mtight",
                          children: $jsx($components.span, {
                            className: "mord mtight",
                            children: $jsx($components.span, {
                              className: "mord mtight",
                              children: "3"
                            })
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
                          top: "-3.394em"
                        },
                        children: [$jsx($components.span, {
                          className: "pstrut",
                          style: {
                            height: "3em"
                          }
                        }), $jsx($components.span, {
                          className: "sizing reset-size6 size3 mtight",
                          children: $jsx($components.span, {
                            className: "mord mtight",
                            children: $jsx($components.span, {
                              className: "mord mtight",
                              children: "1"
                            })
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
                        height: "0.345em"
                      },
                      children: $jsx($components.span, {})
                    })
                  })]
                })
              }), $jsx($components.span, {
                className: "mclose nulldelimiter"
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
                height: "1.1901em",
                verticalAlign: "-0.345em"
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
                        height: "0.8451em"
                      },
                      children: [$jsxs($components.span, {
                        style: {
                          top: "-2.655em"
                        },
                        children: [$jsx($components.span, {
                          className: "pstrut",
                          style: {
                            height: "3em"
                          }
                        }), $jsx($components.span, {
                          className: "sizing reset-size6 size3 mtight",
                          children: $jsx($components.span, {
                            className: "mord mtight",
                            children: $jsx($components.span, {
                              className: "mord mtight",
                              children: "6"
                            })
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
                          top: "-3.394em"
                        },
                        children: [$jsx($components.span, {
                          className: "pstrut",
                          style: {
                            height: "3em"
                          }
                        }), $jsx($components.span, {
                          className: "sizing reset-size6 size3 mtight",
                          children: $jsx($components.span, {
                            className: "mord mtight",
                            children: $jsx($components.span, {
                              className: "mord mtight",
                              children: "5"
                            })
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
                        height: "0.345em"
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
      }), "."]
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
