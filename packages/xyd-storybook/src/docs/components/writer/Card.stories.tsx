import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Card } from '@xyd-js/components/writer';

const meta: Meta<typeof Card> = {
    title: 'Components/Writer/Card',
    component: Card,
    parameters: {
        docs: {
            description: {
                component: 'Card component displays content in a structured layout with optional image, title, description, and link functionality. Used for displaying articles, products, or any structured content.',
            },
        },
    },
    argTypes: {
        title: {
            description: 'The main title of the card',
            control: 'text',
        },
        description: {
            description: 'Optional description text below the title',
            control: 'text',
        },
        href: {
            description: 'URL to navigate to when the title is clicked',
            control: 'text',
        },
        link: {
            description: 'Custom link component to use instead of default anchor',
            control: false,
        },
        imgSrc: {
            description: 'URL of the image to display at the top of the card',
            control: 'text',
        },
        imgAlt: {
            description: 'Alt text for the image',
            control: 'text',
        },
        shadow: {
            description: 'Shadow variant for the card',
            control: { type: 'select' },
            options: ['md'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof Card>;

// Basic usage
export const Default: Story = {
    args: {
        title: 'Getting Started with Documentation',
        description: 'Learn how to create and organize your documentation effectively.',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Card {...args} />
        </div>
    ),
};

// With image
export const WithImage: Story = {
    args: {
        title: 'API Reference Guide',
        description: 'Complete reference for all available API endpoints and parameters.',
        imgSrc: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop',
        imgAlt: 'API documentation screenshot',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Card {...args} />
        </div>
    ),
};

// With link
export const WithLink: Story = {
    args: {
        title: 'User Authentication',
        description: 'Implement secure user authentication in your application.',
        href: '/docs/authentication',
        imgSrc: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&h=200&fit=crop',
        imgAlt: 'Authentication flow diagram',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Card {...args} />
        </div>
    ),
};

// With shadow
export const WithShadow: Story = {
    args: {
        title: 'Advanced Configuration',
        description: 'Configure advanced settings and customizations for your project.',
        shadow: 'md',
        imgSrc: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop',
        imgAlt: 'Configuration panel',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Card {...args} />
        </div>
    ),
};

// Without image
export const WithoutImage: Story = {
    args: {
        title: 'Quick Start Guide',
        description: 'Get up and running with our platform in just a few minutes.',
        href: '/docs/quickstart',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Card {...args} />
        </div>
    ),
};

// Long content
export const LongContent: Story = {
    args: {
        title: 'Comprehensive Guide to Building Scalable Applications',
        description: 'This extensive guide covers everything you need to know about building applications that can handle millions of users, including architecture patterns, database design, caching strategies, and deployment best practices.',
        imgSrc: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop',
        imgAlt: 'Scalable architecture diagram',
        href: '/docs/scalability',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Card {...args} />
        </div>
    ),
};

// Short content
export const ShortContent: Story = {
    args: {
        title: 'FAQ',
        description: 'Frequently asked questions.',
        href: '/faq',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Card {...args} />
        </div>
    ),
};

// Multiple cards
export const MultipleCards: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '20px',
                maxWidth: '1200px'
            }}>
                <Card
                    title="Getting Started"
                    description="Learn the basics and set up your first project."
                    href="/docs/getting-started"
                    imgSrc="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop"
                    imgAlt="Getting started tutorial"
                />
                
                <Card
                    title="API Reference"
                    description="Complete API documentation with examples."
                    href="/docs/api"
                    imgSrc="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop"
                    imgAlt="API documentation"
                />
                
                <Card
                    title="Tutorials"
                    description="Step-by-step tutorials for common use cases."
                    href="/docs/tutorials"
                    imgSrc="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop"
                    imgAlt="Tutorial examples"
                />
                
                <Card
                    title="Examples"
                    description="Real-world examples and code samples."
                    href="/docs/examples"
                    imgSrc="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop"
                    imgAlt="Code examples"
                />
            </div>
        </div>
    ),
};

// Different image types
export const DifferentImageTypes: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '20px',
                maxWidth: '1200px'
            }}>
                <Card
                    title="Landscape Image"
                    description="Card with a wide landscape image."
                    imgSrc="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop"
                    imgAlt="Mountain landscape"
                />
                
                <Card
                    title="Portrait Image"
                    description="Card with a tall portrait image."
                    imgSrc="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop"
                    imgAlt="Portrait photo"
                />
                
                <Card
                    title="Abstract Image"
                    description="Card with an abstract or pattern image."
                    imgSrc="https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=200&fit=crop"
                    imgAlt="Abstract pattern"
                />
                
                <Card
                    title="No Image"
                    description="Card without any image, relying on text content only."
                />
            </div>
        </div>
    ),
};

// Shadow variations
export const ShadowVariations: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '20px',
                maxWidth: '1200px'
            }}>
                <Card
                    title="Default Shadow"
                    description="Card with default shadow styling."
                    imgSrc="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop"
                    imgAlt="Default shadow example"
                />
                
                <Card
                    title="Medium Shadow"
                    description="Card with medium shadow for enhanced depth."
                    shadow="md"
                    imgSrc="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&h=200&fit=crop"
                    imgAlt="Medium shadow example"
                />
            </div>
        </div>
    ),
};

// Real-world examples
export const RealWorldExamples: Story = {
    render: () => (
        <div style={{ padding: '20px', maxWidth: '1200px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h2>Documentation Sections</h2>
                <p>Cards are commonly used to organize documentation into clear sections.</p>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '20px',
                    marginTop: '20px'
                }}>
                    <Card
                        title="Installation"
                        description="Get started by installing the necessary dependencies and setting up your environment."
                        href="/docs/installation"
                        imgSrc="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop"
                        imgAlt="Installation guide"
                    />
                    
                    <Card
                        title="Configuration"
                        description="Learn how to configure your project settings and customize behavior."
                        href="/docs/configuration"
                        imgSrc="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop"
                        imgAlt="Configuration panel"
                    />
                    
                    <Card
                        title="Deployment"
                        description="Deploy your application to production with our step-by-step guide."
                        href="/docs/deployment"
                        imgSrc="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&h=200&fit=crop"
                        imgAlt="Deployment process"
                    />
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>Feature Showcase</h2>
                <p>Cards can highlight different features and capabilities of your product.</p>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '20px',
                    marginTop: '20px'
                }}>
                    <Card
                        title="Real-time Analytics"
                        description="Monitor your application performance with real-time metrics and insights."
                        href="/features/analytics"
                        imgSrc="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop"
                        imgAlt="Analytics dashboard"
                        shadow="md"
                    />
                    
                    <Card
                        title="API Integration"
                        description="Connect with third-party services through our comprehensive API."
                        href="/features/api"
                        imgSrc="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop"
                        imgAlt="API integration"
                    />
                    
                    <Card
                        title="Security Features"
                        description="Enterprise-grade security with authentication, authorization, and encryption."
                        href="/features/security"
                        imgSrc="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop"
                        imgAlt="Security features"
                    />
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>Resource Library</h2>
                <p>Organize resources and learning materials with cards.</p>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '20px',
                    marginTop: '20px'
                }}>
                    <Card
                        title="Video Tutorials"
                        description="Watch step-by-step video guides for common tasks and workflows."
                        href="/resources/videos"
                        imgSrc="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop"
                        imgAlt="Video tutorials"
                    />
                    
                    <Card
                        title="Code Examples"
                        description="Browse through practical code examples and implementation patterns."
                        href="/resources/examples"
                        imgSrc="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop"
                        imgAlt="Code examples"
                    />
                    
                    <Card
                        title="Community Forum"
                        description="Connect with other developers and get help from the community."
                        href="/community"
                        imgSrc="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop"
                        imgAlt="Community forum"
                    />
                </div>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how cards are typically used in real applications, demonstrating common patterns for documentation, feature showcases, and resource organization.',
            },
        },
    },
};

// Interactive example
export const Interactive: Story = {
    args: {
        title: 'Interactive Card Example',
        description: 'This card demonstrates the interactive behavior. Try clicking the title to see the link functionality.',
        href: '#',
        imgSrc: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=200&fit=crop',
        imgAlt: 'Interactive example',
        shadow: 'md',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Card {...args} />
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                The card component provides a structured layout for displaying content with optional images, links, and styling variations.
            </p>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This card demonstrates the interactive behavior including link functionality and hover effects.',
            },
        },
    },
};

// Custom link component example
export const CustomLink: Story = {
    args: {
        title: 'Custom Link Component',
        description: 'This card uses a custom link component instead of the default anchor tag.',
        imgSrc: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop',
        imgAlt: 'Custom link example',
    },
    render: (args) => {
        // Custom link component
        const CustomLinkComponent = ({ href, children }: { href: string; children: React.ReactNode }) => (
            <a 
                href={href} 
                onClick={(e) => {
                    e.preventDefault();
                    alert(`Custom link clicked: ${href}`);
                }}
                style={{ textDecoration: 'none', color: 'inherit' }}
            >
                {children}
            </a>
        );

        return (
            <div style={{ padding: '20px' }}>
                <Card {...args} href="/custom-link" link={CustomLinkComponent} />
                <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                    This example shows how to use a custom link component with the card.
                </p>
            </div>
        );
    },
    parameters: {
        docs: {
            description: {
                story: 'This example demonstrates how to use a custom link component instead of the default anchor tag.',
            },
        },
    },
}; 