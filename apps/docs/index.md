---
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
                    title: Theming
                    children: Customize the appearance of your documentation.
                    kind: secondary
                    icon: palette
                    href: "/docs/guides/customization-quickstart"

                - 
                    title: API Reference
                    children: Explore the complete API documentation and component library.
                    kind: secondary
                    icon: code
                    href: "/docs/reference/core/overview"
        - 
            title:  Resources
            cards:
                - 
                    title: Examples
                    children: Browse real-world examples and templates to kickstart your docs.
                    kind: secondary
                    icon: zap
                    href: https://github.com/xyd-js/examples
                
                - 
                    title: Source Code
                    children: View the open source codebase and contribute to the project.
                    kind: secondary
                    icon: docs:github
                    href: https://github.com/livesession/xyd

                - 
                    title: Starter
                    children: Get up and running quickly. Discover the starter for xyd docs.
                    kind: secondary
                    icon: star
                    href: https://github.com/xyd-js/starter

                - 
                    title: Feedback
                    children: Share your thoughts, report issues, and suggest improvements.
                    kind: secondary
                    icon: heart-handshake
                    href: https://github.com/livesession/xyd/discussions

                - 
                    title: Slack
                    children: Join our community and get help from other developers.
                    kind: secondary
                    icon: docs:slack
                    href: https://xyd-docs.slack.com

                - 
                    title: Roadmap
                    children: Track upcoming features and development progress.
                    kind: secondary
                    icon: chart-no-axes-gantt
                    href: https://github.com/orgs/livesession/projects/4
---