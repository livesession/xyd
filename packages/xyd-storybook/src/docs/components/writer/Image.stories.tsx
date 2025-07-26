import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Image } from '@xyd-js/components/writer';

const meta: Meta<typeof Image> = {
    title: 'Components/Writer/Image',
    component: Image,
    parameters: {
        docs: {
            description: {
                component: 'Image component provides a styled image element with consistent styling and accessibility features.',
            },
        },
    },
    argTypes: {
        src: {
            description: 'URL of the image to display',
            control: 'text',
        },
        alt: {
            description: 'Alt text for accessibility',
            control: 'text',
        },
        width: {
            description: 'Width of the image',
            control: 'number',
        },
        height: {
            description: 'Height of the image',
            control: 'number',
        },
        style: {
            description: 'Additional CSS styles',
            control: 'object',
        },
    },
};

export default meta;
type Story = StoryObj<typeof Image>;

// Basic usage
export const Default: Story = {
    args: {
        src: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
        alt: 'A beautiful landscape image',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Image {...args} />
        </div>
    ),
};

// With custom dimensions
export const WithDimensions: Story = {
    args: {
        src: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&h=300&fit=crop',
        alt: 'Image with custom dimensions',
        width: 300,
        height: 200,
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Image {...args} />
        </div>
    ),
};

// Different image types
export const DifferentImageTypes: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Landscape Image</h3>
                <Image 
                    src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop"
                    alt="Mountain landscape"
                    width={400}
                    height={200}
                />
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Portrait Image</h3>
                <Image 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=400&fit=crop"
                    alt="Portrait photo"
                    width={200}
                    height={400}
                />
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Square Image</h3>
                <Image 
                    src="https://images.unsplash.com/photo-1557683316-973673baf926?w=300&h=300&fit=crop"
                    alt="Abstract pattern"
                    width={300}
                    height={300}
                />
            </div>
        </div>
    ),
};

// With custom styling
export const WithCustomStyling: Story = {
    args: {
        src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
        alt: 'Image with custom styling',
        style: {
            borderRadius: '12px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            border: '2px solid #e0e0e0',
        },
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Image {...args} />
        </div>
    ),
};

// Multiple images
export const MultipleImages: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '20px',
                maxWidth: '800px'
            }}>
                <Image 
                    src="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=150&fit=crop"
                    alt="First image"
                    width={200}
                    height={150}
                />
                <Image 
                    src="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=200&h=150&fit=crop"
                    alt="Second image"
                    width={200}
                    height={150}
                />
                <Image 
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=150&fit=crop"
                    alt="Third image"
                    width={200}
                    height={150}
                />
                <Image 
                    src="https://images.unsplash.com/photo-1557683316-973673baf926?w=200&h=150&fit=crop"
                    alt="Fourth image"
                    width={200}
                    height={150}
                />
            </div>
        </div>
    ),
};

// In content context
export const InContentContext: Story = {
    render: () => (
        <div style={{ padding: '20px', maxWidth: '600px' }}>
            <h2>Article with Images</h2>
            <p>
                This is an example of how images can be used within content. The Image component 
                provides consistent styling and proper accessibility features.
            </p>
            
            <Image 
                src="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=300&fit=crop"
                alt="Beautiful landscape to illustrate the article"
                width={500}
                height={300}
                style={{ margin: '20px 0' }}
            />
            
            <p>
                The image above demonstrates how the Image component integrates seamlessly with 
                surrounding content. It maintains proper spacing and responsive behavior.
            </p>
            
            <h3>Another Section</h3>
            <p>
                Here's another image that shows different styling options and how they work 
                within the content flow.
            </p>
            
            <Image 
                src="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&h=250&fit=crop"
                alt="Another example image"
                width={400}
                height={250}
                style={{ 
                    margin: '20px 0',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
            />
        </div>
    ),
};

// Responsive images
export const ResponsiveImages: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Responsive Grid</h3>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '16px'
                }}>
                    <Image 
                        src="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=200&fit=crop"
                        alt="Responsive image 1"
                        style={{ width: '100%', height: 'auto' }}
                    />
                    <Image 
                        src="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=300&h=200&fit=crop"
                        alt="Responsive image 2"
                        style={{ width: '100%', height: 'auto' }}
                    />
                    <Image 
                        src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop"
                        alt="Responsive image 3"
                        style={{ width: '100%', height: 'auto' }}
                    />
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Flexible Layout</h3>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <Image 
                        src="https://images.unsplash.com/photo-1557683316-973673baf926?w=200&h=150&fit=crop"
                        alt="Flexible image 1"
                        style={{ flex: '1', minWidth: '200px', maxWidth: '300px' }}
                    />
                    <Image 
                        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=150&fit=crop"
                        alt="Flexible image 2"
                        style={{ flex: '1', minWidth: '200px', maxWidth: '300px' }}
                    />
                    <Image 
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=150&fit=crop"
                        alt="Flexible image 3"
                        style={{ flex: '1', minWidth: '200px', maxWidth: '300px' }}
                    />
                </div>
            </div>
        </div>
    ),
};

// Real-world examples
export const RealWorldExamples: Story = {
    render: () => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h2>Documentation Screenshots</h2>
                <p>Images are commonly used in documentation to show screenshots and examples.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h3>API Dashboard</h3>
                    <p>Here's how the API dashboard looks in action:</p>
                    <Image 
                        src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=300&fit=crop"
                        alt="API dashboard screenshot"
                        width={600}
                        height={300}
                        style={{ 
                            margin: '16px 0',
                            borderRadius: '4px',
                            border: '1px solid var(--xyd-border-color)'
                        }}
                    />
                    <p style={{ fontSize: '14px', color: 'var(--xyd-text-color-secondary)' }}>
                        The dashboard provides real-time metrics and analytics for your API usage.
                    </p>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>Product Gallery</h2>
                <p>Images can be used to showcase products or features.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '16px'
                    }}>
                        <div>
                            <Image 
                                src="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=150&fit=crop"
                                alt="Feature 1"
                                width={200}
                                height={150}
                                style={{ borderRadius: '4px' }}
                            />
                            <p style={{ marginTop: '8px', fontSize: '14px' }}>Feature One</p>
                        </div>
                        <div>
                            <Image 
                                src="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=200&h=150&fit=crop"
                                alt="Feature 2"
                                width={200}
                                height={150}
                                style={{ borderRadius: '4px' }}
                            />
                            <p style={{ marginTop: '8px', fontSize: '14px' }}>Feature Two</p>
                        </div>
                        <div>
                            <Image 
                                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=150&fit=crop"
                                alt="Feature 3"
                                width={200}
                                height={150}
                                style={{ borderRadius: '4px' }}
                            />
                            <p style={{ marginTop: '8px', fontSize: '14px' }}>Feature Three</p>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>Blog Post Images</h2>
                <p>Images enhance blog posts and articles with visual content.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h3>Getting Started with Our Platform</h3>
                    <p>
                        Our platform provides powerful tools for developers. Here's a quick overview 
                        of the main interface and how to get started.
                    </p>
                    <Image 
                        src="https://images.unsplash.com/photo-1557683316-973673baf926?w=500&h=300&fit=crop"
                        alt="Platform interface overview"
                        width={500}
                        height={300}
                        style={{ 
                            margin: '20px 0',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}
                    />
                    <p>
                        The interface is designed to be intuitive and user-friendly, with clear 
                        navigation and helpful tooltips throughout.
                    </p>
                </div>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how images are typically used in real applications.',
            },
        },
    },
};

// Interactive example
export const Interactive: Story = {
    args: {
        src: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
        alt: 'Interactive image example',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <div style={{ 
                background: 'var(--xyd-bgcolor)',
                border: '1px solid var(--xyd-border-color)',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px'
            }}>
                <h3 style={{ marginBottom: '16px' }}>Image Component Demo</h3>
                <p style={{ marginBottom: '16px', color: 'var(--xyd-text-color)' }}>
                    This example demonstrates the Image component with various styling options and responsive behavior.
                </p>
                <Image {...args} />
            </div>

            <div style={{ 
                background: 'var(--xyd-bgcolor)',
                border: '1px solid var(--xyd-border-color)',
                borderRadius: '8px',
                padding: '20px'
            }}>
                <h4 style={{ marginBottom: '12px' }}>Features</h4>
                <ul style={{ color: 'var(--xyd-text-color)' }}>
                    <li>Consistent styling with design system</li>
                    <li>Responsive behavior</li>
                    <li>Accessibility support</li>
                    <li>Customizable styling</li>
                    <li>Theme-aware colors</li>
                </ul>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This interactive example demonstrates the Image component functionality and styling.',
            },
        },
    },
}; 