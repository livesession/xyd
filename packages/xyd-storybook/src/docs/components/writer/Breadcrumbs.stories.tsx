import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumbs } from '@xyd-js/components/writer';

const meta: Meta<typeof Breadcrumbs> = {
    title: 'Components/Writer/Breadcrumbs',
    component: Breadcrumbs,
    parameters: {
        docs: {
            description: {
                component: 'Breadcrumbs component displays a navigation hierarchy showing the current page location within a site structure. It helps users understand where they are and provides quick navigation to parent pages.',
            },
        },
    },
    argTypes: {
        items: {
            description: 'Array of breadcrumb items with title and optional href',
            control: 'object',
        },
        className: {
            description: 'Additional CSS classes to apply',
            control: 'text',
        },
        as: {
            description: 'Custom component to render links (defaults to anchor tag)',
            control: 'text',
        },
    },
};

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

// Basic usage
export const Default: Story = {
    args: {
        items: [
            {
                title: "Home",
                href: "/",
            },
            {
                title: "Docs",
                href: "/docs",
            },
            {
                title: "Components"
            },
        ],
    },
    render: (args) => (
        <div style={{
            padding: "100px",
            paddingTop: "0px",
            margin: "0 auto",
        }}>
            <div style={{width: 700}}>
                <Breadcrumbs {...args} />
            </div>
        </div>
    ),
};

// Deep navigation example
export const DeepNavigation: Story = {
    args: {
        items: [
            {
                title: "Home",
                href: "/",
            },
            {
                title: "Documentation",
                href: "/docs",
            },
            {
                title: "API Reference",
                href: "/docs/api",
            },
            {
                title: "GraphQL",
                href: "/docs/api/graphql",
            },
            {
                title: "Queries"
            },
        ],
    },
    render: (args) => (
        <div style={{
            padding: "100px",
            paddingTop: "0px",
            margin: "0 auto",
        }}>
            <div style={{width: 700}}>
                <Breadcrumbs {...args} />
            </div>
        </div>
    ),
};

// Short navigation example
export const ShortNavigation: Story = {
    args: {
        items: [
            {
                title: "Home",
                href: "/",
            },
            {
                title: "About"
            },
        ],
    },
    render: (args) => (
        <div style={{
            padding: "100px",
            paddingTop: "0px",
            margin: "0 auto",
        }}>
            <div style={{width: 700}}>
                <Breadcrumbs {...args} />
            </div>
        </div>
    ),
};

// All items with links (no current page)
export const AllLinked: Story = {
    args: {
        items: [
            {
                title: "Home",
                href: "/",
            },
            {
                title: "Products",
                href: "/products",
            },
            {
                title: "Electronics",
                href: "/products/electronics",
            },
            {
                title: "Smartphones",
                href: "/products/electronics/smartphones",
            },
        ],
    },
    render: (args) => (
        <div style={{
            padding: "100px",
            paddingTop: "0px",
            margin: "0 auto",
        }}>
            <div style={{width: 700}}>
                <Breadcrumbs {...args} />
            </div>
        </div>
    ),
};

// Long titles that might overflow
export const LongTitles: Story = {
    args: {
        items: [
            {
                title: "Home",
                href: "/",
            },
            {
                title: "Very Long Section Name That Might Overflow",
                href: "/long-section",
            },
            {
                title: "Another Extremely Long Page Title That Could Cause Layout Issues"
            },
        ],
    },
    render: (args) => (
        <div style={{
            padding: "100px",
            paddingTop: "0px",
            margin: "0 auto",
        }}>
            <div style={{width: 400}}>
                <Breadcrumbs {...args} />
            </div>
        </div>
    ),
};

// Multiple breadcrumb instances
export const MultipleInstances: Story = {
    render: () => (
        <div style={{
            padding: "100px",
            paddingTop: "0px",
            margin: "0 auto",
        }}>
            <div style={{width: 700, display: 'flex', flexDirection: 'column', gap: '20px'}}>
                <div>
                    <h4>Documentation Navigation</h4>
                    <Breadcrumbs items={[
                        { title: "Home", href: "/" },
                        { title: "Docs", href: "/docs" },
                        { title: "Getting Started" }
                    ]} />
                </div>
                
                <div>
                    <h4>Product Navigation</h4>
                    <Breadcrumbs items={[
                        { title: "Home", href: "/" },
                        { title: "Products", href: "/products" },
                        { title: "Software", href: "/products/software" },
                        { title: "Development Tools" }
                    ]} />
                </div>
                
                <div>
                    <h4>Support Navigation</h4>
                    <Breadcrumbs items={[
                        { title: "Home", href: "/" },
                        { title: "Support", href: "/support" },
                        { title: "Troubleshooting" }
                    ]} />
                </div>
            </div>
        </div>
    ),
};

// Interactive example with custom link component
export const WithCustomLink: Story = {
    args: {
        items: [
            {
                title: "Home",
                href: "/",
            },
            {
                title: "Docs",
                href: "/docs",
            },
            {
                title: "Components"
            },
        ],
        as: ({ href, children, ...rest }) => (
            <a 
                href={href} 
                style={{ 
                    color: '#0066cc', 
                    textDecoration: 'underline',
                    fontWeight: '500'
                }}
                {...rest}
            >
                {children}
            </a>
        ),
    },
    render: (args) => (
        <div style={{
            padding: "100px",
            paddingTop: "0px",
            margin: "0 auto",
        }}>
            <div style={{width: 700}}>
                <Breadcrumbs {...args} />
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how to customize the link appearance using the `as` prop to pass a custom link component.',
            },
        },
    },
};
