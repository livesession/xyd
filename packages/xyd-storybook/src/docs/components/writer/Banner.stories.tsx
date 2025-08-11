import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Banner } from '@xyd-js/components/writer';
import {
    IconSessionReplay,
    IconMetrics,
    IconFunnels
} from '../../../__fixtures__/Icons';

const meta: Meta<typeof Banner> = {
    title: 'Components/Writer/Banner',
    component: Banner,
    parameters: {
        docs: {
            description: {
                component: 'Banner component displays promotional or informational messages with optional storage functionality to control visibility based on user interactions.',
            },
        },
    },
    argTypes: {
        children: {
            description: 'The content to display inside the banner',
            control: 'text',
        },
        kind: {
            description: 'The visual style variant of the banner',
            control: { type: 'select' },
            options: ['secondary'],
        },
        label: {
            description: 'Optional label to display in the banner',
            control: 'text',
        },
        href: {
            description: 'URL to navigate to when banner is clicked',
            control: 'text',
        },
        icon: {
            description: 'Icon to display in the banner',
            control: false,
        },
        store: {
            description: 'Seconds until banner can show again after being closed',
            control: 'number',
        },
    },
};

export default meta;
type Story = StoryObj<typeof Banner>;

// Basic usage
export const Default: Story = {
    args: {
        children: 'New feature available! Check out our latest updates.',
        href: '#',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Banner {...args} />
        </div>
    ),
};

// With icon
export const WithIcon: Story = {
    args: {
        children: 'Session replay is now available in beta',
        icon: <IconSessionReplay />,
        href: '/features/session-replay',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Banner {...args} />
        </div>
    ),
};

// With label
export const WithLabel: Story = {
    args: {
        children: 'Analytics dashboard has been updated',
        label: 'NEW',
        href: '/analytics',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Banner {...args} />
        </div>
    ),
};

// With icon and label
export const WithIconAndLabel: Story = {
    args: {
        children: 'Funnel analysis tool is now live',
        icon: <IconFunnels />,
        label: 'BETA',
        href: '/tools/funnel-analysis',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Banner {...args} />
        </div>
    ),
};

// Secondary variant
export const Secondary: Story = {
    args: {
        children: 'This is a secondary banner with different styling',
        kind: 'secondary',
        label: 'INFO',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Banner {...args} />
        </div>
    ),
};

// With storage functionality
export const WithStorage: Story = {
    args: {
        children: 'This banner will be hidden for 30 seconds after closing',
        label: 'REMINDER',
        store: 30,
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Banner {...args} />
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                Try closing this banner and refreshing the page to see the storage functionality.
            </p>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This banner demonstrates the storage functionality. When closed, it will be hidden for the specified number of seconds.',
            },
        },
    },
};

// Long content
export const LongContent: Story = {
    args: {
        children: 'This is a banner with much longer content to demonstrate how the component handles extended text and multiple lines of information.',
        icon: <IconMetrics />,
        label: 'UPDATE',
        href: '/changelog',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Banner {...args} />
        </div>
    ),
};

// External link
export const ExternalLink: Story = {
    args: {
        children: 'Visit our documentation for more information',
        icon: <IconSessionReplay />,
        label: 'DOCS',
        href: 'https://docs.example.com',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Banner {...args} />
        </div>
    ),
};

// No link
export const NoLink: Story = {
    args: {
        children: 'This banner has no link and cannot be clicked',
        icon: <IconFunnels />,
        label: 'NOTICE',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Banner {...args} />
        </div>
    ),
};

// All variants showcase
export const AllVariants: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Default Banners</h3>
                <div style={{ marginBottom: '20px' }}>
                    <Banner href="#">
                        Basic banner with link
                    </Banner>
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <Banner icon={<IconSessionReplay />} href="#">
                        Banner with icon
                    </Banner>
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <Banner label="NEW" href="#">
                        Banner with label
                    </Banner>
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <Banner icon={<IconMetrics />} label="BETA" href="#">
                        Banner with icon and label
                    </Banner>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Secondary Banners</h3>
                <div style={{ marginBottom: '20px' }}>
                    <Banner kind="secondary" label="INFO">
                        Secondary banner with label
                    </Banner>
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <Banner kind="secondary" icon={<IconFunnels />} label="UPDATE">
                        Secondary banner with icon and label
                    </Banner>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Banners with Storage</h3>
                <div style={{ marginBottom: '20px' }}>
                    <Banner store={60} label="REMINDER">
                        This banner will be hidden for 1 minute after closing
                    </Banner>
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <Banner store={300} icon={<IconSessionReplay />} label="TIP">
                        This banner will be hidden for 5 minutes after closing
                    </Banner>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>External Links</h3>
                <div style={{ marginBottom: '20px' }}>
                    <Banner href="https://github.com" icon={<IconMetrics />} label="GITHUB">
                        Visit our GitHub repository
                    </Banner>
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <Banner href="https://docs.example.com" label="DOCS">
                        Read our documentation
                    </Banner>
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
                <h2>Product Announcements</h2>
                <p>Banners commonly used for product announcements and feature releases.</p>
                <div style={{ marginTop: '16px' }}>
                    <Banner icon={<IconSessionReplay />} label="NEW" href="/features/session-replay">
                        Session replay is now available in beta! Record and analyze user interactions.
                    </Banner>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>System Notifications</h2>
                <p>Banners used for system-wide notifications and updates.</p>
                <div style={{ marginTop: '16px' }}>
                    <Banner kind="secondary" label="MAINTENANCE" store={3600}>
                        Scheduled maintenance on Sunday, 2:00 AM - 4:00 AM EST
                    </Banner>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>Promotional Content</h2>
                <p>Banners for promotional content and marketing messages.</p>
                <div style={{ marginTop: '16px' }}>
                    <Banner icon={<IconMetrics />} label="SALE" href="/pricing">
                        🎉 50% off annual plans! Limited time offer ends soon.
                    </Banner>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>Documentation Updates</h2>
                <p>Banners for documentation and help content.</p>
                <div style={{ marginTop: '16px' }}>
                    <Banner icon={<IconFunnels />} label="GUIDE" href="/docs/getting-started">
                        New getting started guide available with step-by-step instructions
                    </Banner>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>Beta Features</h2>
                <p>Banners for beta features and experimental functionality.</p>
                <div style={{ marginTop: '16px' }}>
                    <Banner kind="secondary" icon={<IconSessionReplay />} label="BETA" store={86400}>
                        Try our new analytics dashboard in beta! Feedback welcome.
                    </Banner>
                </div>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how banners are typically used in real-world applications, demonstrating common patterns and use cases.',
            },
        },
    },
};

// Interactive example
export const Interactive: Story = {
    args: {
        children: 'This banner demonstrates interactive behavior. Try clicking it or closing it!',
        icon: <IconSessionReplay />,
        label: 'DEMO',
        href: '#',
        store: 10,
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Banner {...args} />
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                This banner has a 10-second storage delay. Try closing it and refreshing the page to see the behavior.
            </p>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This banner demonstrates the interactive behavior including clicking and closing functionality.',
            },
        },
    },
};

// Different storage durations
export const StorageDurations: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Short Duration (30 seconds)</h3>
                <Banner store={30} label="QUICK">
                    This banner will reappear after 30 seconds
                </Banner>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Medium Duration (5 minutes)</h3>
                <Banner store={300} icon={<IconMetrics />} label="INFO">
                    This banner will reappear after 5 minutes
                </Banner>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Long Duration (1 hour)</h3>
                <Banner store={3600} icon={<IconFunnels />} label="REMINDER">
                    This banner will reappear after 1 hour
                </Banner>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Very Long Duration (1 day)</h3>
                <Banner store={86400} kind="secondary" label="UPDATE">
                    This banner will reappear after 1 day
                </Banner>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows different storage durations and how they affect banner visibility.',
            },
        },
    },
}; 