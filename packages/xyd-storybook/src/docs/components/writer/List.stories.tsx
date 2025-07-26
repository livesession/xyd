import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { List, ListOl } from '@xyd-js/components/writer';

const meta: Meta<typeof List> = {
    title: 'Components/Writer/List',
    component: List,
    parameters: {
        docs: {
            description: {
                component: 'List components provide styled unordered and ordered lists with consistent spacing and typography. Includes List (unordered) and ListOl (ordered) variants.',
            },
        },
    },
    argTypes: {
        children: {
            description: 'The list items to display',
            control: false,
        },
    },
};

export default meta;
type Story = StoryObj<typeof List>;

// Basic unordered list
export const Default: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <List>
                <List.Item>First item in the list</List.Item>
                <List.Item>Second item with more content</List.Item>
                <List.Item>Third item that demonstrates longer text</List.Item>
                <List.Item>Fourth and final item</List.Item>
            </List>
        </div>
    ),
};

// Basic ordered list
export const OrderedList: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <ListOl>
                <List.Item>First step in the process</List.Item>
                <List.Item>Second step with additional details</List.Item>
                <List.Item>Third step with important notes</List.Item>
                <List.Item>Fourth and final step</List.Item>
            </ListOl>
        </div>
    ),
};

// Long content lists
export const LongContent: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Unordered List with Long Content</h3>
                <List>
                    <List.Item>
                        This is a list item with substantial content that demonstrates how the List component 
                        handles longer text and multiple sentences. The component should maintain proper 
                        spacing and readability.
                    </List.Item>
                    <List.Item>
                        Another item with detailed information that spans multiple lines. This helps 
                        test the component's ability to handle complex content while maintaining 
                        consistent styling and proper indentation.
                    </List.Item>
                    <List.Item>
                        A third item that continues the pattern of longer content to ensure the List 
                        component works well with various content lengths and types.
                    </List.Item>
                </List>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Ordered List with Long Content</h3>
                <ListOl>
                    <List.Item>
                        First step in a detailed process that requires careful attention to each 
                        individual step. This demonstrates how ordered lists handle longer content.
                    </List.Item>
                    <List.Item>
                        Second step that builds upon the first step with additional complexity and 
                        detailed instructions that may span multiple lines.
                    </List.Item>
                    <List.Item>
                        Third step that includes important considerations and notes that help users 
                        understand the process better.
                    </List.Item>
                </ListOl>
            </div>
        </div>
    ),
};

// Nested lists
export const NestedLists: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Nested Unordered Lists</h3>
                <List>
                    <List.Item>Main item one</List.Item>
                    <List.Item>
                        Main item two with sub-items
                        <List>
                            <List.Item>Sub-item 2.1</List.Item>
                            <List.Item>Sub-item 2.2</List.Item>
                            <List.Item>
                                Sub-item 2.3 with deeper nesting
                                <List>
                                    <List.Item>Sub-sub-item 2.3.1</List.Item>
                                    <List.Item>Sub-sub-item 2.3.2</List.Item>
                                </List>
                            </List.Item>
                        </List>
                    </List.Item>
                    <List.Item>Main item three</List.Item>
                </List>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Nested Ordered Lists</h3>
                <ListOl>
                    <List.Item>First main step</List.Item>
                    <List.Item>
                        Second main step with sub-steps
                        <ListOl>
                            <List.Item>Sub-step 2.1</List.Item>
                            <List.Item>Sub-step 2.2</List.Item>
                            <List.Item>
                                Sub-step 2.3 with deeper nesting
                                <ListOl>
                                    <List.Item>Sub-sub-step 2.3.1</List.Item>
                                    <List.Item>Sub-sub-step 2.3.2</List.Item>
                                </ListOl>
                            </List.Item>
                        </ListOl>
                    </List.Item>
                    <List.Item>Third main step</List.Item>
                </ListOl>
            </div>
        </div>
    ),
};

// Mixed content lists
export const MixedContent: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>List with Mixed Content</h3>
                <List>
                    <List.Item>Simple text item</List.Item>
                    <List.Item>
                        Item with <strong>bold text</strong> and <em>italic text</em>
                    </List.Item>
                    <List.Item>
                        Item with a <a href="#" style={{ color: 'var(--xyd-text-color)' }}>link</a> 
                        and <code>code snippet</code>
                    </List.Item>
                    <List.Item>
                        Item with multiple elements: <strong>bold</strong>, <em>italic</em>, 
                        <code>code</code>, and <a href="#" style={{ color: 'var(--xyd-text-color)' }}>links</a>
                    </List.Item>
                </List>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Ordered List with Mixed Content</h3>
                <ListOl>
                    <List.Item>Basic numbered item</List.Item>
                    <List.Item>
                        Step with <strong>important information</strong> highlighted
                    </List.Item>
                    <List.Item>
                        Step containing <code>code examples</code> and <em>explanatory text</em>
                    </List.Item>
                    <List.Item>
                        Final step with <a href="#" style={{ color: 'var(--xyd-text-color)' }}>reference links</a>
                    </List.Item>
                </ListOl>
            </div>
        </div>
    ),
};

// Multiple lists
export const MultipleLists: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Installation Steps</h3>
                <ListOl>
                    <List.Item>Download the package</List.Item>
                    <List.Item>Extract the files</List.Item>
                    <List.Item>Run the installer</List.Item>
                    <List.Item>Configure settings</List.Item>
                </ListOl>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Features</h3>
                <List>
                    <List.Item>Easy to use interface</List.Item>
                    <List.Item>Comprehensive documentation</List.Item>
                    <List.Item>Active community support</List.Item>
                    <List.Item>Regular updates</List.Item>
                </List>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Troubleshooting</h3>
                <ListOl>
                    <List.Item>Check system requirements</List.Item>
                    <List.Item>Verify installation</List.Item>
                    <List.Item>Review error logs</List.Item>
                    <List.Item>Contact support if needed</List.Item>
                </ListOl>
            </div>
        </div>
    ),
};

// Real-world examples
export const RealWorldExamples: Story = {
    render: () => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h2>Documentation Examples</h2>
                <p>Lists are commonly used in documentation for organizing information.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h3>Getting Started</h3>
                    <p>Follow these steps to get up and running:</p>
                    <ListOl>
                        <List.Item>Install the required dependencies</List.Item>
                        <List.Item>Configure your environment variables</List.Item>
                        <List.Item>Run the setup script</List.Item>
                        <List.Item>Test your installation</List.Item>
                    </ListOl>
                    
                    <h3>Key Features</h3>
                    <List>
                        <List.Item>Intuitive user interface</List.Item>
                        <List.Item>Comprehensive API documentation</List.Item>
                        <List.Item>Active community support</List.Item>
                        <List.Item>Regular security updates</List.Item>
                    </List>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>Configuration Guide</h2>
                <p>Lists help organize configuration options and settings.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h3>Required Settings</h3>
                    <ListOl>
                        <List.Item>Database connection string</List.Item>
                        <List.Item>API authentication keys</List.Item>
                        <List.Item>Server port configuration</List.Item>
                        <List.Item>Logging level settings</List.Item>
                    </ListOl>
                    
                    <h3>Optional Settings</h3>
                    <List>
                        <List.Item>Custom theme configuration</List.Item>
                        <List.Item>Advanced caching options</List.Item>
                        <List.Item>Performance tuning parameters</List.Item>
                        <List.Item>Third-party integrations</List.Item>
                    </List>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>API Reference</h2>
                <p>Lists organize API endpoints and parameters.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h3>Authentication Endpoints</h3>
                    <ListOl>
                        <List.Item><code>POST /auth/login</code> - User authentication</List.Item>
                        <List.Item><code>POST /auth/logout</code> - User logout</List.Item>
                        <List.Item><code>POST /auth/refresh</code> - Token refresh</List.Item>
                        <List.Item><code>GET /auth/profile</code> - User profile</List.Item>
                    </ListOl>
                    
                    <h3>Common Parameters</h3>
                    <List>
                        <List.Item><code>api_key</code> - Your API key for authentication</List.Item>
                        <List.Item><code>limit</code> - Number of results to return</List.Item>
                        <List.Item><code>offset</code> - Number of results to skip</List.Item>
                        <List.Item><code>sort</code> - Field to sort results by</List.Item>
                    </List>
                </div>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how lists are typically used in real applications for organizing information.',
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
                <h3 style={{ marginBottom: '16px' }}>List Component Demo</h3>
                <p style={{ marginBottom: '16px', color: 'var(--xyd-text-color)' }}>
                    This example demonstrates the List and ListOl components with various content types and nesting levels.
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <h4 style={{ marginBottom: '8px' }}>Unordered List</h4>
                        <List>
                            <List.Item>Feature one</List.Item>
                            <List.Item>Feature two</List.Item>
                            <List.Item>Feature three</List.Item>
                        </List>
                    </div>
                    
                    <div>
                        <h4 style={{ marginBottom: '8px' }}>Ordered List</h4>
                        <ListOl>
                            <List.Item>Step one</List.Item>
                            <List.Item>Step two</List.Item>
                            <List.Item>Step three</List.Item>
                        </ListOl>
                    </div>
                </div>
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
                    <li>Proper spacing and typography</li>
                    <li>Support for nested lists</li>
                    <li>Mixed content support</li>
                    <li>Accessible markup</li>
                </ul>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This interactive example demonstrates the List component functionality and styling.',
            },
        },
    },
};

// Complex nested lists
export const ComplexNestedLists: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Project Structure</h3>
                <List>
                    <List.Item>src/
                        <List>
                            <List.Item>components/
                                <List>
                                    <List.Item>Button/
                                        <List>
                                            <List.Item>Button.tsx</List.Item>
                                            <List.Item>Button.styles.tsx</List.Item>
                                            <List.Item>Button.stories.tsx</List.Item>
                                        </List>
                                    </List.Item>
                                    <List.Item>Card/
                                        <List>
                                            <List.Item>Card.tsx</List.Item>
                                            <List.Item>Card.styles.tsx</List.Item>
                                        </List>
                                    </List.Item>
                                </List>
                            </List.Item>
                            <List.Item>utils/
                                <List>
                                    <List.Item>helpers.ts</List.Item>
                                    <List.Item>constants.ts</List.Item>
                                </List>
                            </List.Item>
                            <List.Item>types/
                                <List>
                                    <List.Item>index.ts</List.Item>
                                </List>
                            </List.Item>
                        </List>
                    </List.Item>
                    <List.Item>public/
                        <List>
                            <List.Item>images/</List.Item>
                            <List.Item>icons/</List.Item>
                        </List>
                    </List.Item>
                    <List.Item>docs/
                        <List>
                            <List.Item>README.md</List.Item>
                            <List.Item>CHANGELOG.md</List.Item>
                        </List>
                    </List.Item>
                </List>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Development Workflow</h3>
                <ListOl>
                    <List.Item>Setup development environment
                        <ListOl>
                            <List.Item>Install Node.js and npm</List.Item>
                            <List.Item>Clone the repository</List.Item>
                            <List.Item>Install dependencies</List.Item>
                        </ListOl>
                    </List.Item>
                    <List.Item>Development process
                        <ListOl>
                            <List.Item>Create feature branch</List.Item>
                            <List.Item>Make changes and test</List.Item>
                            <List.Item>Write documentation</List.Item>
                            <List.Item>Submit pull request</List.Item>
                        </ListOl>
                    </List.Item>
                    <List.Item>Deployment
                        <ListOl>
                            <List.Item>Run tests</List.Item>
                            <List.Item>Build for production</List.Item>
                            <List.Item>Deploy to staging</List.Item>
                            <List.Item>Deploy to production</List.Item>
                        </ListOl>
                    </List.Item>
                </ListOl>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows complex nested lists with multiple levels of hierarchy.',
            },
        },
    },
}; 