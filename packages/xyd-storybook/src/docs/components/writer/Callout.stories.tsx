import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import {
    Callout,
} from '@xyd-js/components/writer';

const meta: Meta<typeof Callout> = {
    title: 'Components/Writer/Callout',
    component: Callout,
    parameters: {
        docs: {
            description: {
                component: 'Callout component is used to display important information, notices, or warnings in a visually distinct way.',
            },
        },
    },
    argTypes: {
        children: {
            description: 'The content to display inside the callout',
            control: 'text',
        },
        kind: {
            description: 'The visual style variant of the callout',
            control: { type: 'select' },
            options: ['note', 'tip', 'check', 'warning', 'danger'],
        },
        className: {
            description: 'Additional CSS classes to apply',
            control: 'text',
        },
    },
};

export default meta;
type Story = StoryObj<typeof Callout>;

// Default (info) callout
export const Default: Story = {
    args: {
        children: 'This is a default callout with informational content. It provides important context or notes to the user.',
    },
    render: (args) => (
        <div style={{width: 700}}>
            <Callout {...args} />
        </div>
    ),
};

// Note variant
export const Note: Story = {
    args: {
        children: 'This is a note callout. Use this for general information, context, or helpful details that users should be aware of.',
        kind: 'note',
    },
    render: (args) => (
        <div style={{width: 700}}>
            <Callout {...args} />
        </div>
    ),
};

// Tip variant
export const Tip: Story = {
    args: {
        children: 'This is a tip callout. Use this for helpful suggestions, best practices, or pro tips that can improve the user experience.',
        kind: 'tip',
    },
    render: (args) => (
        <div style={{width: 700}}>
            <Callout {...args} />
        </div>
    ),
};

// Check variant
export const Check: Story = {
    args: {
        children: 'This is a check callout. Use this for confirmation messages, successful actions, or positive feedback.',
        kind: 'check',
    },
    render: (args) => (
        <div style={{width: 700}}>
            <Callout {...args} />
        </div>
    ),
};

// Warning variant
export const Warning: Story = {
    args: {
        children: 'This is a warning callout. Use this for important notices, potential issues, or actions that require attention.',
        kind: 'warning',
    },
    render: (args) => (
        <div style={{width: 700}}>
            <Callout {...args} />
        </div>
    ),
};

// Danger variant
export const Danger: Story = {
    args: {
        children: 'This is a danger callout. Use this for critical errors, destructive actions, or situations that require immediate attention.',
        kind: 'danger',
    },
    render: (args) => (
        <div style={{width: 700}}>
            <Callout {...args} />
        </div>
    ),
};

// All variants showcase
export const AllVariants: Story = {
    render: () => (
        <div style={{width: 700}}>
            <div style={{ marginBottom: '20px' }}>
                <Callout>
                    Default callout with informational content
                </Callout>
            </div>
            <div style={{ marginBottom: '20px' }}>
                <Callout kind="note">
                    Note callout for general information and context
                </Callout>
            </div>
            <div style={{ marginBottom: '20px' }}>
                <Callout kind="tip">
                    Tip callout for helpful suggestions and best practices
                </Callout>
            </div>
            <div style={{ marginBottom: '20px' }}>
                <Callout kind="check">
                    Check callout for confirmation and success messages
                </Callout>
            </div>
            <div style={{ marginBottom: '20px' }}>
                <Callout kind="warning">
                    Warning callout for important notices and potential issues
                </Callout>
            </div>
            <div style={{ marginBottom: '20px' }}>
                <Callout kind="danger">
                    Danger callout for critical errors and destructive actions
                </Callout>
            </div>
        </div>
    ),
};

// With longer content
export const WithLongContent: Story = {
    args: {
        children: 'This is a callout with longer content that demonstrates how the component handles multi-line text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        kind: 'note',
    },
    render: (args) => (
        <div style={{width: 700}}>
            <Callout {...args} />
        </div>
    ),
};

// With HTML content
export const WithHTMLContent: Story = {
    args: {
        children: (
            <>
                This callout contains <strong>bold text</strong>, <em>italic text</em>, and a <a href="#" style={{ color: 'inherit', textDecoration: 'underline' }}>link</a>. 
                <br />
                It also demonstrates how the component handles HTML elements and line breaks.
            </>
        ),
        kind: 'tip',
    },
    render: (args) => (
        <div style={{width: 700}}>
            <Callout {...args} />
        </div>
    ),
};
