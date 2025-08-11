import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { TocCard } from '@xyd-js/components/writer';

const meta: Meta<typeof TocCard> = {
    title: 'Components/Writer/TocCard',
    component: TocCard,
    parameters: {
        docs: {
            description: {
                component: 'A server-side rendered card component for table of contents entries. Displays a title, description, and favicon for a linked resource without client-side fetching. Perfect for documentation sites, link aggregators, and resource directories.',
            },
        },
    },
    argTypes: {
        title: {
            description: 'The title of the linked resource',
            control: 'text',
        },
        description: {
            description: 'A brief description of the linked resource',
            control: 'text',
        },
        href: {
            description: 'The URL of the linked resource',
            control: 'text',
        },
        className: {
            description: 'Optional CSS class name for custom styling',
            control: 'text',
        },
    },
};

export default meta;
type Story = StoryObj<typeof TocCard>;

// Basic TocCard
export const Default: Story = {
    args: {
        title: 'Example App',
        description: 'Explore our example app to see how the TocCard component works.',
        href: 'https://github.com/livesession/xyd',
    },
};

// Documentation example
export const Documentation: Story = {
    args: {
        title: 'API Documentation',
        description: 'Complete reference for all available endpoints, authentication methods, and code examples.',
        href: 'https://docs.example.com/api',
    },
    parameters: {
        docs: {
            description: {
                story: 'Perfect for linking to documentation sections or external API docs.',
            },
        },
    },
};

// GitHub repository
export const GitHubRepository: Story = {
    args: {
        title: 'xyd-js/components',
        description: 'React component library with accessible, customizable UI components for modern web applications.',
        href: 'https://github.com/livesession/xyd',
    },
    parameters: {
        docs: {
            description: {
                story: 'Ideal for linking to GitHub repositories with descriptive titles and summaries.',
            },
        },
    },
};

// Blog post
export const BlogPost: Story = {
    args: {
        title: 'Building Accessible Components',
        description: 'Learn how to create inclusive web components that work for everyone, including users with disabilities.',
        href: 'https://blog.example.com/accessible-components',
    },
    parameters: {
        docs: {
            description: {
                story: 'Great for linking to blog posts, articles, and educational content.',
            },
        },
    },
};

// External tool
export const ExternalTool: Story = {
    args: {
        title: 'Storybook',
        description: 'Build, document, and test UI components in isolation. The industry standard for component development.',
        href: 'https://storybook.js.org',
    },
    parameters: {
        docs: {
            description: {
                story: 'Perfect for linking to external tools, libraries, and services.',
            },
        },
    },
};

// Long content
export const LongContent: Story = {
    args: {
        title: 'Comprehensive Guide to Modern Web Development: From Basics to Advanced Patterns',
        description: 'An extensive resource covering everything from HTML fundamentals to advanced React patterns, state management, performance optimization, and deployment strategies. Includes practical examples, best practices, and real-world case studies.',
        href: 'https://example.com/web-development-guide',
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows how the component handles long titles and descriptions gracefully.',
            },
        },
    },
};

// Short content
export const ShortContent: Story = {
    args: {
        title: 'Docs',
        description: 'Documentation',
        href: 'https://docs.example.com',
    },
    parameters: {
        docs: {
            description: {
                story: 'Demonstrates the component with minimal content.',
            },
        },
    },
};

// Real-world examples
export const RealWorldExamples: Story = {
    render: () => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <h2 style={{ marginBottom: '24px' }}>Resource Directory</h2>
            <p style={{ marginBottom: '24px', color: 'var(--xyd-text-color)' }}>
                TocCard components are commonly used in resource directories, documentation sites, and link aggregators.
            </p>
            
            <div style={{ 
                display: 'grid', 
                gap: '16px',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
            }}>
                <TocCard
                    title="React Documentation"
                    description="Official React documentation with tutorials, API reference, and best practices."
                    href="https://react.dev"
                />
                
                <TocCard
                    title="TypeScript Handbook"
                    description="Comprehensive guide to TypeScript with examples and advanced type patterns."
                    href="https://www.typescriptlang.org/docs"
                />
                
                <TocCard
                    title="MDN Web Docs"
                    description="Complete reference for web technologies including HTML, CSS, and JavaScript."
                    href="https://developer.mozilla.org"
                />
                
                <TocCard
                    title="CSS-Tricks"
                    description="Tips, tricks, and techniques for CSS, JavaScript, and web development."
                    href="https://css-tricks.com"
                />
                
                <TocCard
                    title="Stack Overflow"
                    description="Community-driven Q&A platform for programmers and developers."
                    href="https://stackoverflow.com"
                />
                
                <TocCard
                    title="GitHub"
                    description="Platform for version control and collaboration on software projects."
                    href="https://github.com"
                />
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how TocCard components are typically used in real applications like resource directories and documentation sites.',
            },
        },
    },
};

// Interactive example
export const Interactive: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ 
                background: 'var(--xyd-bgcolor)',
                border: '1px solid var(--xyd-border-color)',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px'
            }}>
                <h3 style={{ marginBottom: '16px' }}>TocCard Component Demo</h3>
                <p style={{ marginBottom: '16px', color: 'var(--xyd-text-color)' }}>
                    This example demonstrates the TocCard component with various content types and use cases.
                </p>
                
                <div style={{ 
                    display: 'grid', 
                    gap: '16px',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
                }}>
                    <TocCard
                        title="Component Library"
                        description="A collection of reusable UI components for building modern web applications."
                        href="https://example.com/components"
                    />
                    
                    <TocCard
                        title="Design System"
                        description="Comprehensive design tokens, patterns, and guidelines for consistent UI."
                        href="https://example.com/design-system"
                    />
                </div>
            </div>

            <div style={{ 
                background: 'var(--xyd-bgcolor)',
                border: '1px solid var(--xyd-border-color)',
                borderRadius: '8px',
                padding: '20px'
            }}>
                <h4 style={{ marginBottom: '12px' }}>Usage Guidelines</h4>
                <ul style={{ color: 'var(--xyd-text-color)' }}>
                    <li>Use descriptive titles that clearly indicate the linked content</li>
                    <li>Provide concise but informative descriptions</li>
                    <li>Ensure URLs are valid and accessible</li>
                    <li>Consider the user's context when writing descriptions</li>
                    <li>Use consistent formatting across multiple cards</li>
                    <li>Test with various content lengths</li>
                </ul>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This interactive example demonstrates the TocCard component functionality and usage guidelines.',
            },
        },
    },
};

// Grid layout example
export const GridLayout: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '24px' }}>Resource Grid</h2>
            <p style={{ marginBottom: '24px', color: 'var(--xyd-text-color)' }}>
                TocCard components work well in responsive grid layouts for organizing multiple resources.
            </p>
            
            <div style={{ 
                display: 'grid', 
                gap: '20px',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
            }}>
                <TocCard
                    title="Getting Started"
                    description="Quick start guide for new users with setup instructions and basic examples."
                    href="https://docs.example.com/getting-started"
                />
                
                <TocCard
                    title="API Reference"
                    description="Complete API documentation with all available endpoints and parameters."
                    href="https://docs.example.com/api"
                />
                
                <TocCard
                    title="Examples"
                    description="Real-world examples and code samples for common use cases."
                    href="https://docs.example.com/examples"
                />
                
                <TocCard
                    title="Tutorials"
                    description="Step-by-step tutorials covering various topics and skill levels."
                    href="https://docs.example.com/tutorials"
                />
                
                <TocCard
                    title="Community"
                    description="Join our community forum for discussions, questions, and support."
                    href="https://community.example.com"
                />
                
                <TocCard
                    title="GitHub"
                    description="Source code, issues, and contributions on GitHub."
                    href="https://github.com/example/project"
                />
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how TocCard components can be arranged in responsive grid layouts.',
            },
        },
    },
};

// Different content types
export const ContentTypes: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '24px' }}>Different Content Types</h2>
            <p style={{ marginBottom: '24px', color: 'var(--xyd-text-color)' }}>
                TocCard components can be used for various types of content and resources.
            </p>
            
            <div style={{ 
                display: 'grid', 
                gap: '16px',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
            }}>
                <div>
                    <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>Documentation</h3>
                    <TocCard
                        title="User Guide"
                        description="Comprehensive user manual with detailed instructions and troubleshooting."
                        href="https://docs.example.com/user-guide"
                    />
                </div>
                
                <div>
                    <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>Tools & Libraries</h3>
                    <TocCard
                        title="Development Tools"
                        description="Essential tools for modern web development workflow and debugging."
                        href="https://tools.example.com"
                    />
                </div>
                
                <div>
                    <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>Community</h3>
                    <TocCard
                        title="Discord Server"
                        description="Join our Discord community for real-time discussions and support."
                        href="https://discord.gg/example"
                    />
                </div>
                
                <div>
                    <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>Learning</h3>
                    <TocCard
                        title="Video Course"
                        description="Comprehensive video course covering all aspects of the technology."
                        href="https://course.example.com"
                    />
                </div>
                
                <div>
                    <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>Resources</h3>
                    <TocCard
                        title="Cheat Sheet"
                        description="Quick reference guide with common patterns and syntax."
                        href="https://cheatsheet.example.com"
                    />
                </div>
                
                <div>
                    <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>Support</h3>
                    <TocCard
                        title="Help Center"
                        description="Frequently asked questions and support documentation."
                        href="https://help.example.com"
                    />
                </div>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example demonstrates how TocCard components can be used for different types of content and resources.',
            },
        },
    },
};


