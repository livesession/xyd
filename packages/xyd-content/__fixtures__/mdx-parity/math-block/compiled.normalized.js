"use strict";
const {Fragment: $Fragment, jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "Block Math"
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
    msqrt: "msqrt",
    mstyle: "mstyle",
    msubsup: "msubsup",
    msup: "msup",
    mtable: "mtable",
    mtd: "mtd",
    mtext: "mtext",
    mtr: "mtr",
    munderover: "munderover",
    p: "p",
    path: "path",
    semantics: "semantics",
    span: "span",
    svg: "svg",
    ...props.components
  };
  return $jsxs($Fragment, {
    children: [$jsx($components.p, {
      children: "The Gaussian integral:"
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
                  }), $jsxs($components.mrow, {
                    children: [$jsx($components.mo, {
                      children: "−"
                    }), $jsx($components.mi, {
                      mathvariant: "normal",
                      children: "∞"
                    })]
                  }), $jsx($components.mi, {
                    mathvariant: "normal",
                    children: "∞"
                  })]
                }), $jsxs($components.msup, {
                  children: [$jsx($components.mi, {
                    children: "e"
                  }), $jsxs($components.mrow, {
                    children: [$jsx($components.mo, {
                      children: "−"
                    }), $jsxs($components.msup, {
                      children: [$jsx($components.mi, {
                        children: "x"
                      }), $jsx($components.mn, {
                        children: "2"
                      })]
                    })]
                  })]
                }), $jsx($components.mtext, {
                  children: " "
                }), $jsx($components.mi, {
                  children: "d"
                }), $jsx($components.mi, {
                  children: "x"
                }), $jsx($components.mo, {
                  children: "="
                }), $jsx($components.msqrt, {
                  children: $jsx($components.mi, {
                    children: "π"
                  })
                })]
              }), $jsx($components.annotation, {
                encoding: "application/x-tex",
                children: "\\int_{-\\infty}^{\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}"
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
                height: "2.3846em",
                verticalAlign: "-0.9703em"
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
                        height: "1.4143em"
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
                          children: $jsxs($components.span, {
                            className: "mord mtight",
                            children: [$jsx($components.span, {
                              className: "mord mtight",
                              children: "−"
                            }), $jsx($components.span, {
                              className: "mord mtight",
                              children: "∞"
                            })]
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
                            children: $jsx($components.span, {
                              className: "mord mtight",
                              children: "∞"
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
                        height: "0.9703em"
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
                        height: "1.0369em"
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
                          children: $jsxs($components.span, {
                            className: "mord mtight",
                            children: [$jsx($components.span, {
                              className: "mord mtight",
                              children: "−"
                            }), $jsxs($components.span, {
                              className: "mord mtight",
                              children: [$jsx($components.span, {
                                className: "mord mathnormal mtight",
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
                                        height: "0.8913em"
                                      },
                                      children: $jsxs($components.span, {
                                        style: {
                                          top: "-2.931em",
                                          marginRight: "0.0714em"
                                        },
                                        children: [$jsx($components.span, {
                                          className: "pstrut",
                                          style: {
                                            height: "2.5em"
                                          }
                                        }), $jsx($components.span, {
                                          className: "sizing reset-size3 size1 mtight",
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
                height: "1.04em",
                verticalAlign: "-0.1908em"
              }
            }), $jsx($components.span, {
              className: "mord sqrt",
              children: $jsxs($components.span, {
                className: "vlist-t vlist-t2",
                children: [$jsxs($components.span, {
                  className: "vlist-r",
                  children: [$jsxs($components.span, {
                    className: "vlist",
                    style: {
                      height: "0.8492em"
                    },
                    children: [$jsxs($components.span, {
                      className: "svg-align",
                      style: {
                        top: "-3em"
                      },
                      children: [$jsx($components.span, {
                        className: "pstrut",
                        style: {
                          height: "3em"
                        }
                      }), $jsx($components.span, {
                        className: "mord",
                        style: {
                          paddingLeft: "0.833em"
                        },
                        children: $jsx($components.span, {
                          className: "mord mathnormal",
                          style: {
                            marginRight: "0.0359em"
                          },
                          children: "π"
                        })
                      })]
                    }), $jsxs($components.span, {
                      style: {
                        top: "-2.8092em"
                      },
                      children: [$jsx($components.span, {
                        className: "pstrut",
                        style: {
                          height: "3em"
                        }
                      }), $jsx($components.span, {
                        className: "hide-tail",
                        style: {
                          minWidth: "0.853em",
                          height: "1.08em"
                        },
                        children: $jsx($components.svg, {
                          xmlns: "http://www.w3.org/2000/svg",
                          width: "400em",
                          height: "1.08em",
                          viewBox: "0 0 400000 1080",
                          preserveAspectRatio: "xMinYMin slice",
                          children: $jsx($components.path, {
                            d: "M95,702\nc-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14\nc0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54\nc44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10\ns173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429\nc69,-144,104.5,-217.7,106.5,-221\nl0 -0\nc5.3,-9.3,12,-14,20,-14\nH400000v40H845.2724\ns-225.272,467,-225.272,467s-235,486,-235,486c-2.7,4.7,-9,7,-19,7\nc-6,0,-10,-1,-12,-3s-194,-422,-194,-422s-65,47,-65,47z\nM834 80h400000v40h-400000z"
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
                      height: "0.1908em"
                    },
                    children: $jsx($components.span, {})
                  })
                })]
              })
            })]
          })]
        })]
      })
    }), "\n", $jsx($components.p, {
      children: "A closed-form summation:"
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
                children: [$jsxs($components.munderover, {
                  children: [$jsx($components.mo, {
                    children: "∑"
                  }), $jsxs($components.mrow, {
                    children: [$jsx($components.mi, {
                      children: "i"
                    }), $jsx($components.mo, {
                      children: "="
                    }), $jsx($components.mn, {
                      children: "1"
                    })]
                  }), $jsx($components.mi, {
                    children: "n"
                  })]
                }), $jsx($components.mi, {
                  children: "i"
                }), $jsx($components.mo, {
                  children: "="
                }), $jsxs($components.mfrac, {
                  children: [$jsxs($components.mrow, {
                    children: [$jsx($components.mi, {
                      children: "n"
                    }), $jsx($components.mo, {
                      stretchy: "false",
                      children: "("
                    }), $jsx($components.mi, {
                      children: "n"
                    }), $jsx($components.mo, {
                      children: "+"
                    }), $jsx($components.mn, {
                      children: "1"
                    }), $jsx($components.mo, {
                      stretchy: "false",
                      children: ")"
                    })]
                  }), $jsx($components.mn, {
                    children: "2"
                  })]
                })]
              }), $jsx($components.annotation, {
                encoding: "application/x-tex",
                children: "\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}"
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
                height: "2.9291em",
                verticalAlign: "-1.2777em"
              }
            }), $jsx($components.span, {
              className: "mop op-limits",
              children: $jsxs($components.span, {
                className: "vlist-t vlist-t2",
                children: [$jsxs($components.span, {
                  className: "vlist-r",
                  children: [$jsxs($components.span, {
                    className: "vlist",
                    style: {
                      height: "1.6514em"
                    },
                    children: [$jsxs($components.span, {
                      style: {
                        top: "-1.8723em",
                        marginLeft: "0em"
                      },
                      children: [$jsx($components.span, {
                        className: "pstrut",
                        style: {
                          height: "3.05em"
                        }
                      }), $jsx($components.span, {
                        className: "sizing reset-size6 size3 mtight",
                        children: $jsxs($components.span, {
                          className: "mord mtight",
                          children: [$jsx($components.span, {
                            className: "mord mathnormal mtight",
                            children: "i"
                          }), $jsx($components.span, {
                            className: "mrel mtight",
                            children: "="
                          }), $jsx($components.span, {
                            className: "mord mtight",
                            children: "1"
                          })]
                        })
                      })]
                    }), $jsxs($components.span, {
                      style: {
                        top: "-3.05em"
                      },
                      children: [$jsx($components.span, {
                        className: "pstrut",
                        style: {
                          height: "3.05em"
                        }
                      }), $jsx($components.span, {
                        children: $jsx($components.span, {
                          className: "mop op-symbol large-op",
                          children: "∑"
                        })
                      })]
                    }), $jsxs($components.span, {
                      style: {
                        top: "-4.3em",
                        marginLeft: "0em"
                      },
                      children: [$jsx($components.span, {
                        className: "pstrut",
                        style: {
                          height: "3.05em"
                        }
                      }), $jsx($components.span, {
                        className: "sizing reset-size6 size3 mtight",
                        children: $jsx($components.span, {
                          className: "mord mtight",
                          children: $jsx($components.span, {
                            className: "mord mathnormal mtight",
                            children: "n"
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
                      height: "1.2777em"
                    },
                    children: $jsx($components.span, {})
                  })
                })]
              })
            }), $jsx($components.span, {
              className: "mspace",
              style: {
                marginRight: "0.1667em"
              }
            }), $jsx($components.span, {
              className: "mord mathnormal",
              children: "i"
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
                height: "2.113em",
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
                        height: "1.427em"
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
                            children: "2"
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
                        }), $jsxs($components.span, {
                          className: "mord",
                          children: [$jsx($components.span, {
                            className: "mord mathnormal",
                            children: "n"
                          }), $jsx($components.span, {
                            className: "mopen",
                            children: "("
                          }), $jsx($components.span, {
                            className: "mord mathnormal",
                            children: "n"
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
                          }), $jsx($components.span, {
                            className: "mord",
                            children: "1"
                          }), $jsx($components.span, {
                            className: "mclose",
                            children: ")"
                          })]
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
    }), "\n", $jsx($components.p, {
      children: "A matrix:"
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
                children: [$jsx($components.mo, {
                  fence: "true",
                  children: "("
                }), $jsxs($components.mtable, {
                  rowspacing: "0.16em",
                  columnalign: "center center",
                  columnspacing: "1em",
                  children: [$jsxs($components.mtr, {
                    children: [$jsx($components.mtd, {
                      children: $jsx($components.mstyle, {
                        scriptlevel: "0",
                        displaystyle: "false",
                        children: $jsx($components.mi, {
                          children: "a"
                        })
                      })
                    }), $jsx($components.mtd, {
                      children: $jsx($components.mstyle, {
                        scriptlevel: "0",
                        displaystyle: "false",
                        children: $jsx($components.mi, {
                          children: "b"
                        })
                      })
                    })]
                  }), $jsxs($components.mtr, {
                    children: [$jsx($components.mtd, {
                      children: $jsx($components.mstyle, {
                        scriptlevel: "0",
                        displaystyle: "false",
                        children: $jsx($components.mi, {
                          children: "c"
                        })
                      })
                    }), $jsx($components.mtd, {
                      children: $jsx($components.mstyle, {
                        scriptlevel: "0",
                        displaystyle: "false",
                        children: $jsx($components.mi, {
                          children: "d"
                        })
                      })
                    })]
                  })]
                }), $jsx($components.mo, {
                  fence: "true",
                  children: ")"
                })]
              }), $jsx($components.annotation, {
                encoding: "application/x-tex",
                children: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}"
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
                height: "2.4em",
                verticalAlign: "-0.95em"
              }
            }), $jsxs($components.span, {
              className: "minner",
              children: [$jsx($components.span, {
                className: "mopen delimcenter",
                style: {
                  top: "0em"
                },
                children: $jsx($components.span, {
                  className: "delimsizing size3",
                  children: "("
                })
              }), $jsx($components.span, {
                className: "mord",
                children: $jsxs($components.span, {
                  className: "mtable",
                  children: [$jsx($components.span, {
                    className: "col-align-c",
                    children: $jsxs($components.span, {
                      className: "vlist-t vlist-t2",
                      children: [$jsxs($components.span, {
                        className: "vlist-r",
                        children: [$jsxs($components.span, {
                          className: "vlist",
                          style: {
                            height: "1.45em"
                          },
                          children: [$jsxs($components.span, {
                            style: {
                              top: "-3.61em"
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
                          }), $jsxs($components.span, {
                            style: {
                              top: "-2.41em"
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
                                children: "c"
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
                            height: "0.95em"
                          },
                          children: $jsx($components.span, {})
                        })
                      })]
                    })
                  }), $jsx($components.span, {
                    className: "arraycolsep",
                    style: {
                      width: "0.5em"
                    }
                  }), $jsx($components.span, {
                    className: "arraycolsep",
                    style: {
                      width: "0.5em"
                    }
                  }), $jsx($components.span, {
                    className: "col-align-c",
                    children: $jsxs($components.span, {
                      className: "vlist-t vlist-t2",
                      children: [$jsxs($components.span, {
                        className: "vlist-r",
                        children: [$jsxs($components.span, {
                          className: "vlist",
                          style: {
                            height: "1.45em"
                          },
                          children: [$jsxs($components.span, {
                            style: {
                              top: "-3.61em"
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
                              top: "-2.41em"
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
                                children: "d"
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
                            height: "0.95em"
                          },
                          children: $jsx($components.span, {})
                        })
                      })]
                    })
                  })]
                })
              }), $jsx($components.span, {
                className: "mclose delimcenter",
                style: {
                  top: "0em"
                },
                children: $jsx($components.span, {
                  className: "delimsizing size3",
                  children: ")"
                })
              })]
            })]
          })
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
