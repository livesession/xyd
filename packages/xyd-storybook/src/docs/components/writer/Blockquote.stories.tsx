import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Blockquote } from '@xyd-js/components/writer';

const meta: Meta<typeof Blockquote> = {
    title: 'Components/Writer/Blockquote',
    component: Blockquote,
    parameters: {
        docs: {
            description: {
                component: 'Blockquote component displays quoted text with italic styling and a subtle border. Used for highlighting important quotes, testimonials, or referenced content.',
            },
        },
    },
    argTypes: {
        children: {
            description: 'The quoted content to display',
            control: 'text',
        },
        className: {
            description: 'Additional CSS classes to apply to the blockquote',
            control: 'text',
        },
    },
};

export default meta;
type Story = StoryObj<typeof Blockquote>;

// Basic usage
export const Default: Story = {
    args: {
        children: 'The best way to predict the future is to invent it.',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Blockquote {...args} />
        </div>
    ),
};

// Long quote
export const LongQuote: Story = {
    args: {
        children: 'Success is not final, failure is not fatal: it is the courage to continue that counts. The only way to do great work is to love what you do. If you haven\'t found it yet, keep looking. Don\'t settle.',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Blockquote {...args} />
        </div>
    ),
};

// Short quote
export const ShortQuote: Story = {
    args: {
        children: 'Less is more.',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Blockquote {...args} />
        </div>
    ),
};

// With attribution
export const WithAttribution: Story = {
    args: {
        children: (
            <>
                The future belongs to those who believe in the beauty of their dreams.
                <footer style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                    — Eleanor Roosevelt
                </footer>
            </>
        ),
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Blockquote {...args} />
        </div>
    ),
};

// Technical quote
export const TechnicalQuote: Story = {
    args: {
        children: 'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Blockquote {...args} />
        </div>
    ),
};

// With custom className
export const WithCustomClass: Story = {
    args: {
        children: 'This blockquote has custom styling applied via className.',
        className: 'custom-blockquote',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <style>
                {`
                    .custom-blockquote {
                        background-color: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        border-left: 4px solid #007bff;
                    }
                `}
            </style>
            <Blockquote {...args} />
        </div>
    ),
};

// Multiple blockquotes
export const MultipleBlockquotes: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Inspirational Quotes</h3>
                <Blockquote>
                    The only way to do great work is to love what you do.
                </Blockquote>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Programming Wisdom</h3>
                <Blockquote>
                    Code is read much more often than it is written.
                </Blockquote>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Design Philosophy</h3>
                <Blockquote>
                    Good design is obvious. Great design is transparent.
                </Blockquote>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Leadership</h3>
                <Blockquote>
                    The greatest leader is not necessarily the one who does the greatest things. He is the one that gets the people to do the greatest things.
                </Blockquote>
            </div>
        </div>
    ),
};

// In context
export const InContext: Story = {
    render: () => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <h1>Documentation Guide</h1>
            
            <p>
                When writing documentation, it's important to provide clear and concise information. 
                Sometimes you need to highlight important information or reference external sources.
            </p>

            <Blockquote>
                Documentation is a love letter to your future self.
            </Blockquote>

            <p>
                This quote emphasizes the importance of writing good documentation. 
                When you return to your code months later, you'll thank yourself for taking the time 
                to document your work properly.
            </p>

            <h2>Best Practices</h2>
            
            <p>
                Here are some key principles to follow when creating documentation:
            </p>

            <ul>
                <li>Write for your audience</li>
                <li>Keep it simple and clear</li>
                <li>Use examples and code snippets</li>
                <li>Update regularly</li>
            </ul>

            <Blockquote>
                The best documentation is the one that answers the question you have right now.
            </Blockquote>

            <p>
                Remember that good documentation should be easily discoverable and provide 
                immediate value to the reader.
            </p>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how blockquotes are used in real documentation contexts, providing emphasis and highlighting important information.',
            },
        },
    },
};

// Different content types
export const DifferentContentTypes: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Single Line Quote</h3>
                <Blockquote>
                    Simplicity is the ultimate sophistication.
                </Blockquote>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Multi-line Quote</h3>
                <Blockquote>
                    The best way to predict the future is to invent it. 
                    Really try to get to the future and make it happen.
                </Blockquote>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Quote with HTML</h3>
                <Blockquote>
                    <strong>Important:</strong> Always test your code before deploying to production.
                    <br />
                    <em>This includes both unit tests and integration tests.</em>
                </Blockquote>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Quote with List</h3>
                <Blockquote>
                    Three things to remember:
                    <ul style={{ marginTop: '10px', marginBottom: '0' }}>
                        <li>Keep it simple</li>
                        <li>Make it work</li>
                        <li>Make it fast</li>
                    </ul>
                </Blockquote>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Quote with Code</h3>
                <Blockquote>
                    When debugging, remember: <code>console.log()</code> is your friend, 
                    but proper logging is your best friend.
                </Blockquote>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how blockquotes can contain different types of content including HTML elements, lists, and code snippets.',
            },
        },
    },
};

// Styling variations
export const StylingVariations: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Default Styling</h3>
                <Blockquote>
                    This is the default blockquote styling with italic text and subtle border.
                </Blockquote>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Custom Background</h3>
                <Blockquote className="bg-light">
                    This blockquote has a light background applied via custom CSS.
                </Blockquote>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Highlighted Quote</h3>
                <Blockquote className="highlighted">
                    This blockquote is highlighted with a colored border and background.
                </Blockquote>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Large Quote</h3>
                <Blockquote className="large-quote">
                    This is a larger blockquote with increased font size and padding.
                </Blockquote>
            </div>

            <style>
                {`
                    .bg-light {
                        background-color: #f8f9fa;
                        padding: 15px;
                        border-radius: 4px;
                    }
                    
                    .highlighted {
                        background-color: #fff3cd;
                        border-left: 4px solid #ffc107;
                        padding: 15px;
                        border-radius: 4px;
                    }
                    
                    .large-quote {
                        font-size: 1.2em;
                        padding: 20px;
                        background-color: #e9ecef;
                        border-radius: 8px;
                    }
                `}
            </style>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example demonstrates how blockquotes can be styled using custom CSS classes to achieve different visual effects.',
            },
        },
    },
};

// Real-world examples
export const RealWorldExamples: Story = {
    render: () => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h2>User Testimonials</h2>
                <p>Blockquotes are commonly used to display user testimonials and feedback.</p>
                <Blockquote>
                    "This tool has completely transformed how we handle our documentation. 
                    The interface is intuitive and the features are exactly what we needed."
                    <footer style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                        — Sarah Johnson, Senior Developer at TechCorp
                    </footer>
                </Blockquote>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>Code Documentation</h2>
                <p>In technical documentation, blockquotes highlight important notes and warnings.</p>
                <Blockquote>
                    <strong>Note:</strong> This API endpoint is deprecated and will be removed in version 2.0. 
                    Please use the new endpoint instead.
                </Blockquote>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>Feature Announcements</h2>
                <p>Blockquotes can emphasize new features and announcements.</p>
                <Blockquote>
                    🎉 <strong>New Feature:</strong> We've added real-time collaboration to our documentation platform. 
                    Multiple team members can now edit documents simultaneously.
                </Blockquote>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>Best Practices</h2>
                <p>Blockquotes are perfect for highlighting best practices and guidelines.</p>
                <Blockquote>
                    Always write your documentation with the assumption that someone else will read it. 
                    Be clear, concise, and provide examples where possible.
                </Blockquote>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>Error Messages</h2>
                <p>Blockquotes can be used to display important error messages or warnings.</p>
                <Blockquote>
                    <strong>Warning:</strong> This operation cannot be undone. 
                    Please make sure you have backed up your data before proceeding.
                </Blockquote>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows practical use cases for blockquotes in real applications, demonstrating how they enhance content readability and emphasis.',
            },
        },
    },
};

// Interactive example
export const Interactive: Story = {
    args: {
        children: 'This blockquote demonstrates the component\'s interactive behavior. Try hovering over it or clicking to see different states.',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <Blockquote {...args} />
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                The blockquote component provides semantic HTML structure and consistent styling for quoted content.
            </p>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This blockquote demonstrates the component\'s basic functionality and styling.',
            },
        },
    },
}; 