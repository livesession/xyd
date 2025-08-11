import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '@xyd-js/components/writer';
import {
    IconSessionReplay,
    IconMetrics,
    IconFunnels
} from '../../../__fixtures__/Icons';

const meta: Meta<typeof Button> = {
    title: 'Components/Writer/Button',
    component: Button,
    parameters: {
        docs: {
            description: {
                component: 'Button component provides interactive elements with various styles, sizes, and states. Supports icons, links, and different visual themes.',
            },
        },
    },
    argTypes: {
        children: {
            description: 'The content to display inside the button',
            control: 'text',
        },
        kind: {
            description: 'The visual style variant of the button',
            control: { type: 'select' },
            options: ['primary', 'secondary', 'tertiary'],
        },
        theme: {
            description: 'The theme variant of the button',
            control: { type: 'select' },
            options: ['ghost'],
        },
        size: {
            description: 'The size of the button',
            control: { type: 'select' },
            options: ['xs', 'sm', 'md', 'lg'],
        },
        className: {
            description: 'Additional CSS class name',
            control: 'text',
        },
        onClick: {
            description: 'Click event handler',
            control: false,
        },
        disabled: {
            description: 'Whether the button is disabled',
            control: 'boolean',
        },
        icon: {
            description: 'Icon to display in the button',
            control: false,
        },
        iconPosition: {
            description: 'Position of the icon relative to the text',
            control: { type: 'select' },
            options: ['left', 'right'],
        },
        href: {
            description: 'URL to navigate to (renders as anchor tag)',
            control: 'text',
        },
    },
};

export default meta;
type Story = StoryObj<typeof Button>;

// Basic usage
export const Default: Story = {
    args: {
        children: 'Button',
        kind: 'primary',
        size: 'md',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Button {...args} />
        </div>
    ),
};

// All button kinds
export const AllKinds: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Button kind="primary">Primary</Button>
                <Button kind="secondary">Secondary</Button>
                <Button kind="tertiary">Tertiary</Button>
            </div>
        </div>
    ),
};

// All sizes
export const AllSizes: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Button size="xs">Extra Small</Button>
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
            </div>
        </div>
    ),
};

// With icons
export const WithIcons: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Button icon={<IconSessionReplay />} iconPosition="left">
                    Play Video
                </Button>
                <Button icon={<IconMetrics />} iconPosition="right">
                    View Analytics
                </Button>
                <Button icon={<IconFunnels />} iconPosition="left">
                    Funnel Analysis
                </Button>
            </div>
        </div>
    ),
};

// Icon only buttons
export const IconOnly: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Button icon={<IconSessionReplay />} />
                <Button icon={<IconMetrics />} />
                <Button icon={<IconFunnels />} />
            </div>
        </div>
    ),
};

// Ghost theme
export const GhostTheme: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Button theme="ghost" icon={<IconSessionReplay />} />
                <Button theme="ghost" icon={<IconMetrics />} />
                <Button theme="ghost" icon={<IconFunnels />} />
            </div>
        </div>
    ),
};

// Disabled state
export const Disabled: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Button disabled>Disabled Primary</Button>
                <Button kind="secondary" disabled>Disabled Secondary</Button>
                <Button kind="tertiary" disabled>Disabled Tertiary</Button>
                <Button disabled icon={<IconSessionReplay />}>
                    Disabled with Icon
                </Button>
            </div>
        </div>
    ),
};

// Link buttons
export const LinkButtons: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Button href="/docs/getting-started">
                    Get Started
                </Button>
                <Button href="https://github.com" kind="secondary">
                    View on GitHub
                </Button>
                <Button href="/api" kind="tertiary" icon={<IconMetrics />}>
                    API Reference
                </Button>
            </div>
        </div>
    ),
};

// Interactive example
export const Interactive: Story = {
    args: {
        children: 'Click Me!',
        kind: 'primary',
        size: 'md',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Button {...args} onClick={() => alert('Button clicked!')} />
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                Try clicking the button above to see the interactive behavior.
            </p>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This button demonstrates interactive behavior. Click it to see the onClick handler in action.',
            },
        },
    },
};

// All combinations showcase
export const AllCombinations: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Primary Buttons</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button size="xs">XS Primary</Button>
                    <Button size="sm">Small Primary</Button>
                    <Button size="md">Medium Primary</Button>
                    <Button size="lg">Large Primary</Button>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Secondary Buttons</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button kind="secondary" size="xs">XS Secondary</Button>
                    <Button kind="secondary" size="sm">Small Secondary</Button>
                    <Button kind="secondary" size="md">Medium Secondary</Button>
                    <Button kind="secondary" size="lg">Large Secondary</Button>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Tertiary Buttons</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button kind="tertiary" size="xs">XS Tertiary</Button>
                    <Button kind="tertiary" size="sm">Small Tertiary</Button>
                    <Button kind="tertiary" size="md">Medium Tertiary</Button>
                    <Button kind="tertiary" size="lg">Large Tertiary</Button>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Buttons with Icons</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button icon={<IconSessionReplay />} iconPosition="left">
                        Left Icon
                    </Button>
                    <Button icon={<IconMetrics />} iconPosition="right">
                        Right Icon
                    </Button>
                    <Button icon={<IconFunnels />} />
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Ghost Theme</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button theme="ghost" icon={<IconSessionReplay />} />
                    <Button theme="ghost" icon={<IconMetrics />} />
                    <Button theme="ghost" icon={<IconFunnels />} />
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Disabled Buttons</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button disabled>Disabled Primary</Button>
                    <Button kind="secondary" disabled>Disabled Secondary</Button>
                    <Button kind="tertiary" disabled>Disabled Tertiary</Button>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Link Buttons</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button href="/docs">Documentation</Button>
                    <Button href="https://github.com" kind="secondary">GitHub</Button>
                    <Button href="/api" kind="tertiary">API</Button>
                </div>
            </div>
        </div>
    ),
};

// Real-world examples
export const RealWorldExamples: Story = {
    render: () => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h2>Documentation Actions</h2>
                <p>Common button patterns used in documentation sites.</p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginTop: '16px' }}>
                    <Button href="/docs/getting-started" icon={<IconSessionReplay />}>
                        Get Started
                    </Button>
                    <Button href="https://github.com" kind="secondary">
                        View on GitHub
                    </Button>
                    <Button href="/api" kind="tertiary">
                        API Reference
                    </Button>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>Form Actions</h2>
                <p>Buttons commonly used in forms and interactive elements.</p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginTop: '16px' }}>
                    <Button icon={<IconMetrics />}>
                        Save Changes
                    </Button>
                    <Button kind="secondary">
                        Cancel
                    </Button>
                    <Button kind="tertiary">
                        Reset
                    </Button>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>Navigation Actions</h2>
                <p>Buttons used for navigation and user actions.</p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginTop: '16px' }}>
                    <Button href="/next-page">
                        Continue
                    </Button>
                    <Button href="/previous-page" kind="secondary">
                        Back
                    </Button>
                    <Button theme="ghost" icon={<IconFunnels />} />
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>Status Actions</h2>
                <p>Buttons that reflect different states and actions.</p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginTop: '16px' }}>
                    <Button>
                        Active Action
                    </Button>
                    <Button disabled>
                        Disabled Action
                    </Button>
                    <Button kind="secondary" icon={<IconSessionReplay />}>
                        Loading...
                    </Button>
                </div>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how buttons are typically used in real-world applications, demonstrating common patterns and use cases.',
            },
        },
    },
};

// Size comparison
export const SizeComparison: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Primary Buttons</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button size="xs">Extra Small</Button>
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>With Icons</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button size="xs" icon={<IconSessionReplay />}>XS</Button>
                    <Button size="sm" icon={<IconSessionReplay />}>Small</Button>
                    <Button size="md" icon={<IconSessionReplay />}>Medium</Button>
                    <Button size="lg" icon={<IconSessionReplay />}>Large</Button>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Icon Only</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button size="xs" icon={<IconSessionReplay />} />
                    <Button size="sm" icon={<IconSessionReplay />} />
                    <Button size="md" icon={<IconSessionReplay />} />
                    <Button size="lg" icon={<IconSessionReplay />} />
                </div>
            </div>
        </div>
    ),
}; 