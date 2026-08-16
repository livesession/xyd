"use strict";
const {Fragment: $Fragment, jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [{
  "depth": 2,
  "id": "five-principles",
  "value": "Five Principles",
  "attributes": {
    "hProperties": {
      "id": "five-principles"
    }
  },
  "children": [],
  "maxTocDepth": undefined
}, {
  "depth": 2,
  "id": "developer-experience",
  "value": "Developer Experience",
  "attributes": {
    "hProperties": {
      "id": "developer-experience"
    }
  },
  "children": [],
  "maxTocDepth": undefined
}, {
  "depth": 2,
  "id": "extendability",
  "value": "Extendability",
  "attributes": {
    "hProperties": {
      "id": "extendability"
    }
  },
  "children": [],
  "maxTocDepth": undefined
}, {
  "depth": 2,
  "id": "rich-content",
  "value": "Rich Content",
  "attributes": {
    "hProperties": {
      "id": "rich-content"
    }
  },
  "children": [],
  "maxTocDepth": undefined
}, {
  "depth": 2,
  "id": "batteries-included",
  "value": "Batteries Included",
  "attributes": {
    "hProperties": {
      "id": "batteries-included"
    }
  },
  "children": [],
  "maxTocDepth": undefined
}, {
  "depth": 2,
  "id": "open-source",
  "value": "Open Source",
  "attributes": {
    "hProperties": {
      "id": "open-source"
    }
  },
  "children": [],
  "maxTocDepth": undefined
}];
const frontmatter = {
  "title": "Introduction",
  "icon": "book-open",
  "og:title": "Og title",
  "description": "Documentation platform built for developers"
};
function $createMdxContent(props) {
  const $components = {
    a: "a",
    code: "code",
    h1: "h1",
    h2: "h2",
    li: "li",
    p: "p",
    ul: "ul",
    ...props.components
  };
  return $jsxs($Fragment, {
    children: [$jsx($components.h1, {
      id: "introduction",
      children: "Introduction"
    }), "\n", $jsxs($components.p, {
      children: ["Welcome to ", $jsx($components.code, {
        children: "xyd"
      }), ", the documentation platform built for people who value simplicity and power. We're redefining the documentation experience by making it intuitive, flexible, and enjoyable."]
    }), "\n", $jsxs($components.p, {
      children: ["Our mission is to create the Docs Platform for future dev, read our ", $jsx($components.a, {
        href: "https://blog.livesession.dev/why-another-yet-docs-framework",
        children: "blog post."
      })]
    }), "\n", $jsx($components.h2, {
      id: "five-principles",
      children: "Five Principles"
    }), "\n", $jsxs($components.ul, {
      children: ["\n", $jsxs($components.li, {
        children: ["\n", $jsx($components.p, {
          children: "Developer Experience - designed to be easy to use, with a focus on developer experience."
        }), "\n"]
      }), "\n", $jsxs($components.li, {
        children: ["\n", $jsx($components.p, {
          children: "Extendability - customize every part of documentation."
        }), "\n"]
      }), "\n", $jsxs($components.li, {
        children: ["\n", $jsx($components.p, {
          children: "Rich Content - create engaging documentation with interactive components and dynamic content capabilities."
        }), "\n"]
      }), "\n", $jsxs($components.li, {
        children: ["\n", $jsx($components.p, {
          children: "Batteries Included - everything to build docs at scale is here."
        }), "\n"]
      }), "\n", $jsxs($components.li, {
        children: ["\n", $jsx($components.p, {
          children: "Open - we believe that docs frameworks should be fully open source."
        }), "\n"]
      }), "\n"]
    }), "\n", $jsx($components.h2, {
      id: "developer-experience",
      children: "Developer Experience"
    }), "\n", $jsx($components.p, {
      children: "Our platform is built with developers in mind. Every feature and workflow is designed to be intuitive and efficient. From the moment you start, you'll find a familiar development environment with hot reloading, TypeScript support, and a powerful CLI that makes common tasks a breeze."
    }), "\n", $jsx($components.h2, {
      id: "extendability",
      children: "Extendability"
    }), "\n", $jsx($components.p, {
      children: "Customize every aspect of your documentation to match your needs. Our modular architecture allows you to add new features, modify existing ones, or create entirely new components. Whether you need custom layouts, specialized content types, or unique integrations, our architecture makes it possible."
    }), "\n", $jsx($components.h2, {
      id: "rich-content",
      children: "Rich Content"
    }), "\n", $jsx($components.p, {
      children: "Create documentation that goes beyond static text. Our platform supports interactive components, live code examples, and dynamic content that makes your documentation more engaging and effective."
    }), "\n", $jsx($components.h2, {
      id: "batteries-included",
      children: "Batteries Included"
    }), "\n", $jsx($components.p, {
      children: "Everything you need to build documentation at scale is built right in. Our platform includes:"
    }), "\n", $jsxs($components.ul, {
      children: ["\n", $jsxs($components.li, {
        children: ["\n", $jsxs($components.p, {
          children: ["Custom ", $jsx($components.a, {
            href: "/guides/special-symbols",
            children: "content rich framework"
          })]
        }), "\n"]
      }), "\n", $jsxs($components.li, {
        children: ["\n", $jsxs($components.p, {
          children: ["API docs for OpenAPI, GraphQL, TypeScript, React and ", $jsx($components.a, {
            href: "/guides/apitoolchain",
            children: "more"
          })]
        }), "\n"]
      }), "\n", $jsxs($components.li, {
        children: ["\n", $jsxs($components.p, {
          children: [$jsx($components.a, {
            href: "/guides/integrations/search/search-integrations",
            children: "Search"
          }), " functionality"]
        }), "\n"]
      }), "\n", $jsxs($components.li, {
        children: ["\n", $jsxs($components.p, {
          children: [$jsx($components.a, {
            href: "/guides/integrations/analytics/analytics-integrations",
            children: "Analytics"
          }), " and insights"]
        }), "\n"]
      }), "\n", $jsxs($components.li, {
        children: ["\n", $jsx($components.p, {
          children: $jsx($components.a, {
            href: "/guides/deploy",
            children: "Deployment tools"
          })
        }), "\n"]
      }), "\n", $jsxs($components.li, {
        children: ["\n", $jsx($components.p, {
          children: $jsx($components.a, {
            href: "/guides/sdk-quickstart",
            children: "SDK generation tooling"
          })
        }), "\n"]
      }), "\n", $jsxs($components.li, {
        children: ["\n", $jsx($components.p, {
          children: "And much more"
        }), "\n"]
      }), "\n"]
    }), "\n", $jsx($components.h2, {
      id: "open-source",
      children: "Open Source"
    }), "\n", $jsxs($components.p, {
      children: ["We believe that documentation should be accessible to everyone. That's why ", $jsx($components.code, {
        children: "xyd"
      }), " is open source, allowing the community to contribute, improve, and customize the platform. Join our growing ", $jsx($components.a, {
        href: "https://github.com/livesession/xyd",
        children: "community"
      }), " of developers who are shaping the future of documentation together."]
    }), "\n", $jsxs($components.p, {
      children: ["Ready to transform your documentation experience? ", $jsx($components.a, {
        href: "/guides/quickstart",
        children: "Get started now"
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
