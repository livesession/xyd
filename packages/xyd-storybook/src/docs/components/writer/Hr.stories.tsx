import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Hr } from '@xyd-js/components/writer';

const meta: Meta<typeof Hr> = {
    title: 'Components/Writer/Hr',
    component: Hr,
    parameters: {
        docs: {
            description: {
                component: 'Hr component provides a horizontal rule element for visual separation of content sections.',
            },
        },
    },
    argTypes: {
        // Hr doesn't accept props, but we can document the behavior
    },
};

export default meta;
type Story = StoryObj<typeof Hr>;

// Basic usage
export const Default: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <p>Content above the horizontal rule.</p>
            <Hr />
            <p>Content below the horizontal rule.</p>
        </div>
    ),
};

// Multiple horizontal rules
export const MultipleHrs: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <h2>Section 1</h2>
            <p>This is the first section of content.</p>
            <Hr />
            
            <h2>Section 2</h2>
            <p>This is the second section of content.</p>
            <Hr />
            
            <h2>Section 3</h2>
            <p>This is the third section of content.</p>
        </div>
    ),
};

// In different contexts
export const DifferentContexts: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Article Sections</h3>
                <article>
                    <h2>Introduction</h2>
                    <p>This is the introduction to the article.</p>
                    <Hr />
                    <h2>Main Content</h2>
                    <p>This is the main content of the article.</p>
                    <Hr />
                    <h2>Conclusion</h2>
                    <p>This is the conclusion of the article.</p>
                </article>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Form Sections</h3>
                <form>
                    <div>
                        <label>Personal Information</label>
                        <input type="text" placeholder="Name" />
                        <input type="email" placeholder="Email" />
                    </div>
                    <Hr />
                    <div>
                        <label>Preferences</label>
                        <input type="checkbox" /> Newsletter
                        <input type="checkbox" /> Notifications
                    </div>
                </form>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>List Separation</h3>
                <ul>
                    <li>First item in the list</li>
                    <li>Second item in the list</li>
                </ul>
                <Hr />
                <ul>
                    <li>First item in the second list</li>
                    <li>Second item in the second list</li>
                </ul>
            </div>
        </div>
    ),
};

// With different content types
export const WithDifferentContent: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Text Content</h3>
                <p>This is a paragraph of text content.</p>
                <Hr />
                <p>This is another paragraph separated by a horizontal rule.</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Mixed Content</h3>
                <div>
                    <h4>Section Title</h4>
                    <p>Some descriptive text about this section.</p>
                    <ul>
                        <li>List item one</li>
                        <li>List item two</li>
                    </ul>
                </div>
                <Hr />
                <div>
                    <h4>Another Section</h4>
                    <p>Content for the next section.</p>
                    <blockquote>This is a blockquote in the second section.</blockquote>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Code and Text</h3>
                <p>Here's some regular text content.</p>
                <pre><code>console.log('Some code example');</code></pre>
                <Hr />
                <p>More text content after the horizontal rule.</p>
                <pre><code>const example = 'Another code block';</code></pre>
            </div>
        </div>
    ),
};

// Real-world examples
export const RealWorldExamples: Story = {
    render: () => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h2>Documentation Page</h2>
                <p>Horizontal rules are commonly used in documentation to separate different sections.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h3>Getting Started</h3>
                    <p>Learn the basics of our framework and get up and running quickly.</p>
                    <Hr />
                    <h3>Installation</h3>
                    <p>Follow these steps to install and configure the package.</p>
                    <Hr />
                    <h3>Configuration</h3>
                    <p>Customize the behavior and appearance of your application.</p>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>Article Layout</h2>
                <p>Articles often use horizontal rules to separate different topics or sections.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h3>Introduction</h3>
                    <p>This article explores the various ways to use horizontal rules in web design.</p>
                    <Hr />
                    <h3>Design Principles</h3>
                    <p>Understanding when and how to use visual separators effectively.</p>
                    <Hr />
                    <h3>Implementation</h3>
                    <p>Practical examples and code snippets for implementation.</p>
                    <Hr />
                    <h3>Conclusion</h3>
                    <p>Summary and best practices for using horizontal rules.</p>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>Settings Panel</h2>
                <p>Settings and configuration panels use horizontal rules to group related options.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h3>General Settings</h3>
                    <div style={{ marginBottom: '16px' }}>
                        <label>Theme: </label>
                        <select>
                            <option>Light</option>
                            <option>Dark</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label>Language: </label>
                        <select>
                            <option>English</option>
                            <option>Spanish</option>
                        </select>
                    </div>
                    <Hr />
                    <h3>Privacy Settings</h3>
                    <div style={{ marginBottom: '16px' }}>
                        <input type="checkbox" /> Allow analytics
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <input type="checkbox" /> Share usage data
                    </div>
                    <Hr />
                    <h3>Advanced Settings</h3>
                    <div style={{ marginBottom: '16px' }}>
                        <label>Cache size: </label>
                        <input type="number" defaultValue="100" /> MB
                    </div>
                </div>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how horizontal rules are typically used in real applications for content separation.',
            },
        },
    },
};

// Interactive example
export const Interactive: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ 
                background: 'var(--xyd-bgcolor)',
                border: '1px solid var(--xyd-border-color)',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px'
            }}>
                <h3>Content Separation Demo</h3>
                <p>This example demonstrates how horizontal rules provide visual separation between content sections.</p>
                <Hr />
                <p>The horizontal rule above creates a clear visual break between these two paragraphs.</p>
                <Hr />
                <p>Multiple horizontal rules can be used to create a structured layout with clear section divisions.</p>
            </div>

            <div style={{ 
                background: 'var(--xyd-bgcolor)',
                border: '1px solid var(--xyd-border-color)',
                borderRadius: '8px',
                padding: '20px'
            }}>
                <h4>Features</h4>
                <ul style={{ color: 'var(--xyd-text-color)' }}>
                    <li>Semantic HTML structure</li>
                    <li>Consistent styling with design system</li>
                    <li>Accessible visual separation</li>
                    <li>Responsive design</li>
                    <li>Theme-aware styling</li>
                </ul>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This interactive example demonstrates the Hr component functionality and styling.',
            },
        },
    },
};

// Spacing variations
export const SpacingVariations: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Tight Spacing</h3>
                <p>Content with minimal spacing around the horizontal rule.</p>
                <Hr />
                <p>More content with tight spacing.</p>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Normal Spacing</h3>
                <p>Content with standard spacing around the horizontal rule.</p>
                <div style={{ margin: '20px 0' }}>
                    <Hr />
                </div>
                <p>More content with normal spacing.</p>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Loose Spacing</h3>
                <p>Content with generous spacing around the horizontal rule.</p>
                <div style={{ margin: '40px 0' }}>
                    <Hr />
                </div>
                <p>More content with loose spacing.</p>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how different spacing around horizontal rules affects the visual hierarchy.',
            },
        },
    },
}; 