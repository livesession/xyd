import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { NavLinks } from '@xyd-js/components/writer';

const meta: Meta<typeof NavLinks> = {
    title: 'Components/Writer/NavLinks',
    component: NavLinks,
    parameters: {
        docs: {
            description: {
                component: 'NavLinks component provides navigation links for moving between pages, typically used at the bottom of documentation pages with previous and next links.',
            },
        },
    },
    argTypes: {
        prev: {
            description: 'Previous page navigation link',
            control: 'object',
        },
        next: {
            description: 'Next page navigation link',
            control: 'object',
        },
        as: {
            description: 'Custom component to render as the link element',
            control: false,
        },
        className: {
            description: 'Additional CSS class name',
            control: 'text',
        },
    },
};

export default meta;
type Story = StoryObj<typeof NavLinks>;

// Basic usage with both prev and next
export const Default: Story = {
    args: {
        prev: {
            title: 'Getting Started',
            href: '#',
        },
        next: {
            title: 'Installation',
            href: '#',
        },
    },
    render: (args) => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <NavLinks {...args} />
        </div>
    ),
};

// Only previous link
export const PreviousOnly: Story = {
    args: {
        prev: {
            title: 'Introduction',
            href: '#',
        },
    },
    render: (args) => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <NavLinks {...args} />
        </div>
    ),
};

// Only next link
export const NextOnly: Story = {
    args: {
        next: {
            title: 'Advanced Configuration',
            href: '#',
        },
    },
    render: (args) => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <NavLinks {...args} />
        </div>
    ),
};

// Long titles
export const LongTitles: Story = {
    args: {
        prev: {
            title: 'Getting Started with Our Comprehensive Documentation',
            href: '#',
        },
        next: {
            title: 'Advanced Configuration and Customization Options',
            href: '#',
        },
    },
    render: (args) => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <NavLinks {...args} />
        </div>
    ),
};

// Short titles
export const ShortTitles: Story = {
    args: {
        prev: {
            title: 'Home',
            href: '#',
        },
        next: {
            title: 'Next',
            href: '#',
        },
    },
    render: (args) => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <NavLinks {...args} />
        </div>
    ),
};

// Documentation example
export const DocumentationExample: Story = {
    args: {
        prev: {
            title: 'Quick Start',
            href: '/docs/quick-start',
        },
        next: {
            title: 'API Reference',
            href: '/docs/api-reference',
        },
    },
    render: (args) => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '20px' }}>
                <h2>Component Documentation</h2>
                <p>This is an example of how NavLinks would appear at the bottom of a documentation page.</p>
            </div>
            <NavLinks {...args} />
        </div>
    ),
};

// Tutorial example
export const TutorialExample: Story = {
    args: {
        prev: {
            title: 'Step 1: Setup',
            href: '/tutorial/setup',
        },
        next: {
            title: 'Step 3: Deployment',
            href: '/tutorial/deployment',
        },
    },
    render: (args) => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '20px' }}>
                <h2>Step 2: Configuration</h2>
                <p>This step covers the configuration process for your project.</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            </div>
            <NavLinks {...args} />
        </div>
    ),
};

// Guide example
export const GuideExample: Story = {
    args: {
        prev: {
            title: 'Installation Guide',
            href: '/guides/installation',
        },
        next: {
            title: 'Configuration Guide',
            href: '/guides/configuration',
        },
    },
    render: (args) => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '20px' }}>
                <h2>Getting Started Guide</h2>
                <p>This guide will walk you through the essential steps to get up and running.</p>
                <p>Follow along with the examples and you'll have everything set up in no time.</p>
            </div>
            <NavLinks {...args} />
        </div>
    ),
};

// First page (no previous)
export const FirstPage: Story = {
    args: {
        next: {
            title: 'Installation',
            href: '/docs/installation',
        },
    },
    render: (args) => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '20px' }}>
                <h2>Welcome</h2>
                <p>This is the first page of our documentation. There's no previous page to navigate to.</p>
            </div>
            <NavLinks {...args} />
        </div>
    ),
};

// Last page (no next)
export const LastPage: Story = {
    args: {
        prev: {
            title: 'Advanced Topics',
            href: '/docs/advanced',
        },
    },
    render: (args) => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '20px' }}>
                <h2>Conclusion</h2>
                <p>This is the final page of our documentation. You've reached the end!</p>
            </div>
            <NavLinks {...args} />
        </div>
    ),
};

// With custom styling
export const WithCustomStyling: Story = {
    args: {
        prev: {
            title: 'Previous Chapter',
            href: '#',
        },
        next: {
            title: 'Next Chapter',
            href: '#',
        },
        className: 'custom-nav-links',
    },
    render: (args) => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <style>
                {`
                    .custom-nav-links {
                        border-top-color: #e5e7eb !important;
                        background-color: #f9fafb;
                        padding: 1.5rem;
                        border-radius: 8px;
                        margin-top: 3rem;
                    }
                `}
            </style>
            <NavLinks {...args} />
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how to apply custom styling to the NavLinks component using the className prop.',
            },
        },
    },
};

// All variants showcase
export const AllVariants: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Both Previous and Next</h3>
                <div style={{ maxWidth: '800px' }}>
                    <NavLinks
                        prev={{
                            title: 'Getting Started',
                            href: '#',
                        }}
                        next={{
                            title: 'Installation',
                            href: '#',
                        }}
                    />
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Previous Only</h3>
                <div style={{ maxWidth: '800px' }}>
                    <NavLinks
                        prev={{
                            title: 'Introduction',
                            href: '#',
                        }}
                    />
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Next Only</h3>
                <div style={{ maxWidth: '800px' }}>
                    <NavLinks
                        next={{
                            title: 'Advanced Configuration',
                            href: '#',
                        }}
                    />
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Long Titles</h3>
                <div style={{ maxWidth: '800px' }}>
                    <NavLinks
                        prev={{
                            title: 'Getting Started with Our Comprehensive Documentation System',
                            href: '#',
                        }}
                        next={{
                            title: 'Advanced Configuration and Customization Options for Power Users',
                            href: '#',
                        }}
                    />
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Short Titles</h3>
                <div style={{ maxWidth: '800px' }}>
                    <NavLinks
                        prev={{
                            title: 'Home',
                            href: '#',
                        }}
                        next={{
                            title: 'Next',
                            href: '#',
                        }}
                    />
                </div>
            </div>
        </div>
    ),
};

// Interactive example
export const Interactive: Story = {
    args: {
        prev: {
            title: 'Previous Page',
            href: '#',
        },
        next: {
            title: 'Next Page',
            href: '#',
        },
    },
    render: (args) => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '20px' }}>
                <h2>Interactive Navigation</h2>
                <p>Try clicking on the navigation links below to see the hover effects and transitions.</p>
            </div>
            <NavLinks {...args} />
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example demonstrates the interactive behavior of the NavLinks component. Notice the smooth transitions and hover effects.',
            },
        },
    },
};
