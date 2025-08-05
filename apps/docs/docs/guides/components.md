---
title: Components
icon: component
maxTocDepth: 3
---

# Components
:::subtitle
Learn how to use built-in components
:::

## Global components [toc]

### Banner
```json docs.json
{
    "components": {
        "banner": {
            "content": "**xyd 0.1.0** - Docs platform for future dev",
            "label": "Coming Soon",
            "icon": "sparkles",
            "href": "https://github.com/orgs/livesession/projects/4/views/1"
        }
    }
}
```
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'WebEditorBanner'})"}


### Footer
```json docs.json
{
    "components": {
        "footer": {
                "social": {
                    "github": "https://github.com/livesession/xyd",
                    "slack": "https://xyd-docs.slack.com"
                },
                "links": [
                    {
                        "header": "Resources",
                        "items": [
                            {
                                "label": "Examples",
                                "href": "https://github.com/xyd-js/examples"
                            },
                            {
                                "label": "API Docs Demo",
                                "href": "https://apidocs-demo.xyd.dev"
                            },
                            {
                                "label": "Live Preview",
                                "href": "https://preview.xyd.dev"
                            },
                            {
                                "label": "CodeSandbox",
                                "href": "https://codesandbox.io/p/github/xyd-js/deploy-samples-codesandbox"
                            },
                            {
                                "label": "Storybook",
                                "href": "http://sb.xyd.dev"
                            }
                        ]
                    },
                    {
                        "header": "Company",
                        "items": [
                            {
                                "label": "Careers",
                                "href": "https://livesession.io/careers"
                            },
                            {
                                "label": "Blog",
                                "href": "https://xyd.dev/blog"
                            },
                            {
                                "label": "Feature Requests",
                                "href": "https://github.com/livesession/xyd/discussions/categories/feature-requests"
                            }
                        ]
                    },
                    {
                        "header": "Legal",
                        "items": [
                            {
                                "label": "Privacy Policy",
                                "href": "https://livesession.io/privacy-policy"
                            },
                            {
                                "label": "Terms of Service",
                                "href": "https://livesession.io/terms-of-service"
                            }
                        ]
                    }
                ],
                "footnote": {
                    "component": "a",
                    "props": {
                        "href": "https://livesession.io",
                        "target": "_blank",
                        "children": "Powered by LiveSession"
                    }
                }
            }
        }
    }
}
```
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'WebEditorFooter'})"}


## Page Components [toc]

### Home
```yaml
---
title: You Page Title
component: home
componentProps:
    hero:
        title: Welcome to xyd by LiveSession
        description: The docs framework for future dev.
        image: "/public/assets/logo.svg"
        button: 
            title: "Get Started"
            href: "/docs/guides/introduction"
    sections:
        - 
            title: Explore the docs
            cards:
                - 
                    title: Quickstart
                    children: Start using xyd in minutes.
                    kind: secondary
                    icon: rocket
                    href: "/docs/guides/quickstart"
        - 
            title:  Resources
            cards:
                - 
                    title: Examples
                    children: Browse real-world examples and templates to kickstart your docs.
                    kind: secondary
                    icon: zap
                    href: https://github.com/xyd-js/examples
---
```
::atlas{apiRefItemKind="secondary" references="@uniform('@components/pages/PageHome/types.ts', {mini: 'PageHomeProps'})"}

### First Slide
```yaml
---
title: You Page Title
component: firstslide
componentProps:
    content:
        title: xyd - docs framework for content artisans
        description: A modern, extensible documentation platform for APIs, content, and developer experience.
        primaryButton: 
            title: Get xyd
            href: https://xyd.dev
        secondaryButton:
            title: View Documentation
            href: https://docs.xyd.dev

    rightContent: |
        ```yaml index.md
        bun add -g xyd-js
        ```
---
```
::atlas{apiRefItemKind="secondary" references="@uniform('@components/pages/PageFirstSlide/types.ts', {mini: 'PageFirstSlideProps'})"}
