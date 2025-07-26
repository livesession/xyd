import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Heading } from '@xyd-js/components/writer';

const meta: Meta<typeof Heading> = {
    title: 'Components/Writer/Heading',
    component: Heading,
    parameters: {
        docs: {
            description: {
                component: 'Heading component renders headings with various sizes (h1-h6) and supports additional features like labels, subtitles, and anchor links.',
            },
        },
    },
    argTypes: {
        children: {
            description: 'The content to display inside the heading',
            control: 'text',
        },
        size: {
            description: 'The size of the heading (1-6, corresponding to h1-h6)',
            control: { type: 'select' },
            options: [1, 2, 3, 4, 5, 6],
        },
        as: {
            description: 'Optional HTML element to render as (div or span)',
            control: { type: 'select' },
            options: ['div', 'span'],
        },
        id: {
            description: 'Optional ID for the heading element',
            control: 'text',
        },
        kind: {
            description: 'Optional visual style variant',
            control: { type: 'select' },
            options: ['muted'],
        },
        onClick: {
            description: 'Optional click handler',
            control: false,
        },
        className: {
            description: 'Optional additional CSS class name',
            control: 'text',
        },
        active: {
            description: 'Optional active state',
            control: 'boolean',
        },
        label: {
            description: 'Optional label for the heading',
            control: 'text',
        },
        subtitle: {
            description: 'Optional subtitle for the heading',
            control: 'text',
        },
        noanchor: {
            description: 'Optional to hide the anchor icon',
            control: 'boolean',
        },
    },
};

export default meta;
type Story = StoryObj<typeof Heading>;

// Basic usage with different sizes
export const Default: Story = {
    args: {
        children: 'Heading 1',
        size: 1,
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Heading {...args} />
        </div>
    ),
};

// All heading sizes
export const AllSizes: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
                <Heading size={1} id="heading-1">
                    Heading 1 - Main Title
                </Heading>
            </div>
            <div style={{ marginBottom: '20px' }}>
                <Heading size={2} id="heading-2">
                    Heading 2 - Section Title
                </Heading>
            </div>
            <div style={{ marginBottom: '20px' }}>
                <Heading size={3} id="heading-3">
                    Heading 3 - Subsection Title
                </Heading>
            </div>
            <div style={{ marginBottom: '20px' }}>
                <Heading size={4} id="heading-4">
                    Heading 4 - Minor Section
                </Heading>
            </div>
            <div style={{ marginBottom: '20px' }}>
                <Heading size={5} id="heading-5">
                    Heading 5 - Small Section
                </Heading>
            </div>
            <div style={{ marginBottom: '20px' }}>
                <Heading size={6} id="heading-6">
                    Heading 6 - Smallest Heading
                </Heading>
            </div>
        </div>
    ),
};

// With muted kind
export const Muted: Story = {
    args: {
        children: 'Muted Heading',
        size: 3,
        kind: 'muted',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Heading {...args} />
        </div>
    ),
};

// With label
export const WithLabel: Story = {
    args: {
        children: 'Heading with Label',
        size: 2,
        label: 'NEW',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Heading {...args} />
        </div>
    ),
};

// With subtitle
export const WithSubtitle: Story = {
    args: {
        children: 'Main Heading',
        size: 1,
        subtitle: 'This is a subtitle that provides additional context for the main heading.',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Heading {...args} />
        </div>
    ),
};

// With label and subtitle
export const WithLabelAndSubtitle: Story = {
    args: {
        children: 'Complete Heading',
        size: 2,
        label: 'BETA',
        subtitle: 'This heading demonstrates both a label and subtitle working together.',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Heading {...args} />
        </div>
    ),
};

// Without anchor
export const WithoutAnchor: Story = {
    args: {
        children: 'Heading without Anchor',
        size: 3,
        noanchor: true,
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Heading {...args} />
        </div>
    ),
};

// As different HTML element
export const AsDiv: Story = {
    args: {
        children: 'Heading as Div',
        size: 2,
        as: 'div',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Heading {...args} />
        </div>
    ),
};

export const AsSpan: Story = {
    args: {
        children: 'Heading as Span',
        size: 3,
        as: 'span',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Heading {...args} />
        </div>
    ),
};

// Active state
export const Active: Story = {
    args: {
        children: 'Active Heading',
        size: 2,
        id: 'active-heading',
        active: true,
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Heading {...args} />
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This heading is in an active state, typically used when the heading corresponds to the current section in navigation.',
            },
        },
    },
};

// Interactive example
export const Interactive: Story = {
    args: {
        children: 'Clickable Heading',
        size: 2,
        id: 'interactive-heading',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Heading {...args} />
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                Try clicking on the heading above to see the anchor link behavior.
            </p>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This heading has an ID and is clickable. Clicking it will update the URL hash and scroll to the heading.',
            },
        },
    },
};

// All variants showcase
export const AllVariants: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Default Headings</h3>
                <Heading size={1} id="default-h1">Default H1</Heading>
                <Heading size={2} id="default-h2">Default H2</Heading>
                <Heading size={3} id="default-h3">Default H3</Heading>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Muted Headings</h3>
                <Heading size={1} kind="muted" id="muted-h1">Muted H1</Heading>
                <Heading size={2} kind="muted" id="muted-h2">Muted H2</Heading>
                <Heading size={3} kind="muted" id="muted-h3">Muted H3</Heading>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Headings with Labels</h3>
                <Heading size={2} label="NEW" id="label-h2">Heading with Label</Heading>
                <Heading size={3} label="BETA" id="label-h3">Another with Label</Heading>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Headings with Subtitles</h3>
                <Heading size={1} subtitle="This provides additional context" id="subtitle-h1">
                    Main Heading
                </Heading>
                <Heading size={2} subtitle="Another subtitle example" id="subtitle-h2">
                    Section Heading
                </Heading>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Complete Examples</h3>
                <Heading size={2} label="FEATURED" subtitle="The most comprehensive example" id="complete-h2">
                    Complete Heading
                </Heading>
                <Heading size={3} label="DEPRECATED" subtitle="This will be removed soon" id="complete-h3">
                    Another Complete Example
                </Heading>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Without Anchors</h3>
                <Heading size={2} noanchor id="noanchor-h2">No Anchor H2</Heading>
                <Heading size={3} noanchor id="noanchor-h3">No Anchor H3</Heading>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>As Different Elements</h3>
                <Heading size={2} as="div" id="div-h2">Heading as Div</Heading>
                <Heading size={3} as="span" id="span-h3">Heading as Span</Heading>
            </div>
        </div>
    ),
};

// Real-world example
export const RealWorldExample: Story = {
    render: () => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <Heading size={1} id="getting-started">
                Getting Started
            </Heading>
            <p style={{ marginBottom: '20px' }}>
                Welcome to our comprehensive guide. This section will help you understand the basics.
            </p>

            <Heading size={2} id="installation" label="REQUIRED">
                Installation
            </Heading>
            <p style={{ marginBottom: '20px' }}>
                Follow these steps to install the required dependencies.
            </p>

            <Heading size={3} id="quick-start">
                Quick Start
            </Heading>
            <p style={{ marginBottom: '20px' }}>
                Get up and running in minutes with our quick start guide.
            </p>

            <Heading size={2} id="configuration" subtitle="Advanced setup options">
                Configuration
            </Heading>
            <p style={{ marginBottom: '20px' }}>
                Learn about advanced configuration options and customization.
            </p>

            <Heading size={3} id="environment-variables" label="OPTIONAL">
                Environment Variables
            </Heading>
            <p style={{ marginBottom: '20px' }}>
                Configure your environment for optimal performance.
            </p>

            <Heading size={2} id="next-steps" kind="muted">
                Next Steps
            </Heading>
            <p style={{ marginBottom: '20px' }}>
                Now that you're set up, explore our advanced features and tutorials.
            </p>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how headings are typically used in documentation, with various combinations of labels, subtitles, and different sizes.',
            },
        },
    },
};

