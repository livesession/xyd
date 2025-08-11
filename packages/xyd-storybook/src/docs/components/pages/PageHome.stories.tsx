import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Rocket, Palette, Code, Zap, Star, HeartHandshake, GanttChart, Github, MessageCircle } from 'lucide-react';

import { PageHome } from '@xyd-js/components/pages';

const meta: Meta<typeof PageHome> = {
    title: 'Components/Pages/PageHome',
    component: PageHome,
    parameters: {
        docs: {
            description: {
                component: 'PageHome component creates a complete homepage layout with hero section, multiple content sections, and guide cards. Perfect for documentation sites, landing pages, and resource directories.',
            },
        },
    },
    argTypes: {
        hero: {
            description: 'Hero section configuration with title, description, image, and button',
            control: 'object',
        },
        sections: {
            description: 'Array of content sections with titles and guide cards',
            control: 'object',
        },
    },
};

export default meta;
type Story = StoryObj<typeof PageHome>;

// Complete PageHome example
export const Default: Story = {
    args: {
        hero: {
            title: 'Welcome to xyd by LiveSession',
            description: 'The docs framework for future dev.',
            image: '/logo.svg',
            button: {
                title: 'Get Started',
                href: '/docs/guides/introduction',
            },
        },
        sections: [
            {
                title: 'Explore the docs',
                cards: [
                    {
                        title: 'Quickstart',
                        children: 'Start using xyd in minutes.',
                        kind: 'secondary',
                        icon: <Rocket size={24} />,
                        href: '/docs/guides/quickstart',
                    },
                    {
                        title: 'Theming',
                        children: 'Customize the appearance of your documentation.',
                        kind: 'secondary',
                        icon: <Palette size={24} />,
                        href: '/docs/guides/customization-quickstart',
                    },
                    {
                        title: 'API Reference',
                        children: 'Explore the complete API documentation and component library.',
                        kind: 'secondary',
                        icon: <Code size={24} />,
                        href: '/docs/reference',
                    },
                ],
            },
            {
                title: 'Resources',
                cards: [
                    {
                        title: 'Examples',
                        children: 'Browse real-world examples and templates to kickstart your docs.',
                        kind: 'secondary',
                        icon: <Zap size={24} />,
                        href: 'https://github.com/xyd-js/examples',
                    },
                    {
                        title: 'Source Code',
                        children: 'View the open source codebase and contribute to the project.',
                        kind: 'secondary',
                        icon: <Github size={24} />,
                        href: 'https://github.com/livesession/xyd',
                    },
                    {
                        title: 'Awesome Docs',
                        children: 'Discover curated collection of documentation built with xyd.',
                        kind: 'secondary',
                        icon: <Star size={24} />,
                        href: 'https://github.com/livesession/awesomedocs',
                    },
                    {
                        title: 'Feedback',
                        children: 'Share your thoughts, report issues, and suggest improvements.',
                        kind: 'secondary',
                        icon: <HeartHandshake size={24} />,
                        href: 'https://github.com/livesession/xyd/discussions',
                    },
                    {
                        title: 'Slack',
                        children: 'Join our community and get help from other developers.',
                        kind: 'secondary',
                        icon: <MessageCircle size={24} />,
                        href: 'https://xyd-docs.slack.com',
                    },
                    {
                        title: 'Roadmap',
                        children: 'Track upcoming features and development progress.',
                        kind: 'secondary',
                        icon: <GanttChart size={24} />,
                        href: 'https://github.com/orgs/livesession/projects/4',
                    },
                ],
            },
        ],
    },
    parameters: {
        docs: {
            description: {
                story: 'Complete PageHome example with hero section and multiple content sections. This demonstrates all the key features including hero with image and button, organized sections with guide cards, and various link types.',
            },
        },
    },
}; 