import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Details } from '@xyd-js/components/writer';

const meta: Meta<typeof Details> = {
    title: 'Components/Writer/Details',
    component: Details,
    parameters: {
        docs: {
            description: {
                component: 'Details component provides collapsible content sections with three variants: primary, secondary, and tertiary. Each variant has different visual styling and structure.',
            },
        },
    },
    argTypes: {
        children: {
            description: 'The content to be displayed inside the details element',
            control: 'text',
        },
        label: {
            description: 'Label text displayed in the summary',
            control: 'text',
        },
        title: {
            description: 'Title text or element displayed in the summary (for secondary and tertiary variants)',
            control: 'text',
        },
        kind: {
            description: 'The variant of the details component',
            control: { type: 'select' },
            options: ['primary', 'secondary', 'tertiary'],
        },
        icon: {
            description: 'Optional icon element to be displayed in the summary',
            control: false,
        },
        className: {
            description: 'Optional CSS class name for custom styling',
            control: 'text',
        },
    },
};

export default meta;
type Story = StoryObj<typeof Details>;

// Primary variant (default)
export const Primary: Story = {
    args: {
        label: 'Getting Started',
        children: 'This is the primary variant of the Details component. It has a simple structure with just a label and content.',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Details {...args} />
        </div>
    ),
};

// Secondary variant
export const Secondary: Story = {
    args: {
        kind: 'secondary',
        title: 'API Reference',
        label: 'Complete documentation for all endpoints',
        children: 'This is the secondary variant with both a title and label. It provides more detailed information in the summary.',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Details {...args} />
        </div>
    ),
};

// Tertiary variant
export const Tertiary: Story = {
    args: {
        kind: 'tertiary',
        title: 'Advanced Configuration',
        label: 'For experienced users',
        children: 'This is the tertiary variant, which also includes both title and label but with different styling.',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Details {...args} />
        </div>
    ),
};

// Long content
export const LongContent: Story = {
    args: {
        kind: 'secondary',
        title: 'Comprehensive Guide',
        label: 'Detailed step-by-step instructions',
        children: (
            <div>
                <p>This details component contains a substantial amount of content to demonstrate how it handles longer text and multiple paragraphs.</p>
                <p>The content can include various HTML elements like paragraphs, lists, and other components. This makes it perfect for organizing documentation and providing expandable sections.</p>
                <ul>
                    <li>First step in the process</li>
                    <li>Second step with additional details</li>
                    <li>Third step with important notes</li>
                </ul>
                <p>You can include any type of content within the details component, making it very flexible for different use cases.</p>
            </div>
        ),
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Details {...args} />
        </div>
    ),
};

// Multiple details
export const MultipleDetails: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
                <Details label="Installation">
                    <p>Follow these steps to install the package:</p>
                    <ol>
                        <li>Run <code>npm install package-name</code></li>
                        <li>Import the component in your file</li>
                        <li>Start using it in your application</li>
                    </ol>
                </Details>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <Details kind="secondary" title="Configuration" label="Optional settings">
                    <p>Configure the component with these options:</p>
                    <ul>
                        <li>Set the theme property</li>
                        <li>Configure the layout</li>
                        <li>Customize the styling</li>
                    </ul>
                </Details>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <Details kind="tertiary" title="Advanced Usage" label="For power users">
                    <p>Advanced techniques and best practices:</p>
                    <ul>
                        <li>Custom styling approaches</li>
                        <li>Performance optimization</li>
                        <li>Integration patterns</li>
                    </ul>
                </Details>
            </div>
        </div>
    ),
};

// With custom icon
export const WithCustomIcon: Story = {
    args: {
        kind: 'secondary',
        title: 'Custom Icon Example',
        label: 'Shows custom icon usage',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
        ),
        children: 'This details component uses a custom star icon instead of the default icon.',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Details {...args} />
        </div>
    ),
};

// All variants showcase
export const AllVariants: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Primary Variant</h3>
                <Details label="Simple collapsible content">
                    <p>This is the primary variant with just a label. It's the simplest form of the Details component.</p>
                </Details>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Secondary Variant</h3>
                <Details kind="secondary" title="Enhanced Details" label="With title and label">
                    <p>This secondary variant includes both a title and label, providing more context in the summary.</p>
                </Details>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Tertiary Variant</h3>
                <Details kind="tertiary" title="Advanced Details" label="For complex content">
                    <p>This tertiary variant also has title and label but with different visual styling.</p>
                </Details>
            </div>
        </div>
    ),
};

// Real-world examples
export const RealWorldExamples: Story = {
    render: () => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h2>FAQ Section</h2>
                <p>Details components are perfect for FAQ sections and frequently asked questions.</p>
                <div style={{ marginTop: '20px' }}>
                    <Details label="How do I get started?">
                        <p>Getting started is easy! Simply follow our quick start guide which will walk you through the basic setup process.</p>
                    </Details>
                    
                    <Details kind="secondary" title="Installation" label="Step-by-step guide">
                        <p>Install the package using npm or yarn:</p>
                        <pre><code>npm install @xyd-js/components</code></pre>
                        <p>Then import and use the components in your project.</p>
                    </Details>
                    
                    <Details kind="tertiary" title="Troubleshooting" label="Common issues">
                        <p>If you encounter any issues, check our troubleshooting guide or contact support.</p>
                    </Details>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>Documentation Sections</h2>
                <p>Organize documentation into collapsible sections for better navigation.</p>
                <div style={{ marginTop: '20px' }}>
                    <Details label="Basic Concepts">
                        <p>Learn the fundamental concepts and principles that underpin our framework.</p>
                    </Details>
                    
                    <Details kind="secondary" title="API Reference" label="Complete documentation">
                        <p>Comprehensive API documentation with examples and usage patterns.</p>
                    </Details>
                    
                    <Details kind="tertiary" title="Advanced Topics" label="For experienced users">
                        <p>Advanced concepts and techniques for power users and complex use cases.</p>
                    </Details>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>Feature Documentation</h2>
                <p>Use details components to organize feature documentation and tutorials.</p>
                <div style={{ marginTop: '20px' }}>
                    <Details label="Getting Started">
                        <p>Quick start guide to get you up and running in minutes.</p>
                    </Details>
                    
                    <Details kind="secondary" title="Core Features" label="Essential functionality">
                        <p>Overview of the core features and how to use them effectively.</p>
                    </Details>
                    
                    <Details kind="tertiary" title="Advanced Features" label="Optional capabilities">
                        <p>Advanced features and customization options for complex requirements.</p>
                    </Details>
                </div>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how Details components are typically used in real applications for organizing content.',
            },
        },
    },
};

// Interactive example
export const Interactive: Story = {
    args: {
        kind: 'secondary',
        title: 'Interactive Details',
        label: 'Click to expand',
        children: (
            <div>
                <p>This details component demonstrates the interactive behavior. Click the summary to expand or collapse the content.</p>
                <p>The component automatically handles the open/closed state and provides appropriate visual feedback.</p>
            </div>
        ),
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Details {...args} />
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                The Details component provides semantic HTML structure and accessible collapsible content.
            </p>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This details component demonstrates the interactive behavior and accessibility features.',
            },
        },
    },
};

// Nested details
export const NestedDetails: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <Details kind="secondary" title="Main Section" label="Contains subsections">
                <p>This main section contains several subsections organized with nested details components.</p>
                
                <Details label="Subsection 1">
                    <p>This is the first subsection with its own content.</p>
                </Details>
                
                <Details kind="secondary" title="Subsection 2" label="With title">
                    <p>This subsection has both a title and label.</p>
                </Details>
                
                <Details kind="tertiary" title="Subsection 3" label="Tertiary style">
                    <p>This subsection uses the tertiary variant styling.</p>
                </Details>
            </Details>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how Details components can be nested to create hierarchical content structures.',
            },
        },
    },
}; 