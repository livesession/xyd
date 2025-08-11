import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '@xyd-js/components/writer';

const meta: Meta<typeof Badge> = {
    title: 'Components/Writer/Badge',
    component: Badge,
    parameters: {
        docs: {
            description: {
                component: 'Badge component is used to display small status indicators, labels, or tags.',
            },
        },
    },
    argTypes: {
        children: {
            description: 'The content to display inside the badge',
            control: 'text',
        },
        size: {
            description: 'The size of the badge',
            control: { type: 'select' },
            options: ['xs', 'sm'],
        },
        kind: {
            description: 'The visual style variant of the badge',
            control: { type: 'select' },
            options: ['default', 'warning', 'info'],
        },
        className: {
            description: 'Additional CSS classes to apply',
            control: 'text',
        },
    },
};

export default meta;
type Story = StoryObj<typeof Badge>;

// Basic usage
export const Default: Story = {
    args: {
        children: 'Default Badge',
        kind: 'default',
        size: 'sm',
    },
};

// Size variants
export const Small: Story = {
    args: {
        children: 'Small Badge',
        size: 'sm',
        kind: 'default',
    },
};

export const ExtraSmall: Story = {
    args: {
        children: 'XS Badge',
        size: 'xs',
        kind: 'default',
    },
};

// Kind variants
export const Warning: Story = {
    args: {
        children: 'Warning Badge',
        kind: 'warning',
        size: 'sm',
    },
};

export const Info: Story = {
    args: {
        children: 'Info Badge',
        kind: 'info',
        size: 'sm',
    },
};

// All variants showcase
export const AllVariants: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge kind="default" size="sm">Default</Badge>
            <Badge kind="warning" size="sm">Warning</Badge>
            <Badge kind="info" size="sm">Info</Badge>
            <Badge kind="default" size="xs">XS Default</Badge>
            <Badge kind="warning" size="xs">XS Warning</Badge>
            <Badge kind="info" size="xs">XS Info</Badge>
        </div>
    ),
};

// With custom content
export const WithIcons: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge kind="info" size="sm">
                <span style={{ marginRight: '4px' }}>ℹ️</span>
                Information
            </Badge>
            <Badge kind="warning" size="sm">
                <span style={{ marginRight: '4px' }}>⚠️</span>
                Warning
            </Badge>
            <Badge kind="default" size="sm">
                <span style={{ marginRight: '4px' }}>🏷️</span>
                Label
            </Badge>
        </div>
    ),
};

// Interactive example
export const Interactive: Story = {
    args: {
        children: 'Click me!',
        kind: 'default',
        size: 'sm',
    },
    parameters: {
        docs: {
            description: {
                story: 'This badge can be used in interactive contexts. You can add onClick handlers or other event listeners.',
            },
        },
    },
};

