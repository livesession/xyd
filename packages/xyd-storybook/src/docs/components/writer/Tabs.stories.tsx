import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Tabs } from '@xyd-js/components/writer';

const meta: Meta<typeof Tabs> = {
    title: 'Components/Writer/Tabs',
    component: Tabs,
    parameters: {
        docs: {
            description: {
                component: 'Tabs component provides a tabbed interface for organizing content into multiple sections. It supports both primary and secondary variants with different styling and behavior.',
            },
        },
    },
    argTypes: {
        children: {
            description: 'The tab items and content sections',
            control: false,
        },
        value: {
            description: 'The currently selected tab value',
            control: 'text',
        },
        onChange: {
            description: 'Callback function triggered when a tab is selected',
            control: false,
        },
        slide: {
            description: 'Whether to enable sliding animation between tabs',
            control: 'boolean',
        },
        className: {
            description: 'Optional CSS class name for custom styling',
            control: 'text',
        },
        kind: {
            description: 'The variant of the tabs component',
            control: { type: 'select' },
            options: ['default', 'secondary'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

// Basic tabs
export const Default: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <Tabs value="tab1">
                <Tabs.Item value="tab1">
                    User Behavior
                </Tabs.Item>
                <Tabs.Item value="tab2">
                    Feature Adoption
                </Tabs.Item>
                <Tabs.Item value="tab3">
                    Churn Analysis
                </Tabs.Item>

                <Tabs.Content value="tab1">
                    <div style={{ padding: '20px' }}>
                        <h3>User Behavior Analysis</h3>
                        <p>
                            Gain insights into user behavior by replaying sessions and analyzing click patterns. 
                            This helps uncover friction points in your app's user experience.
                        </p>
                        <ul>
                            <li>Session replay functionality</li>
                            <li>Click pattern analysis</li>
                            <li>User journey mapping</li>
                            <li>Friction point identification</li>
                        </ul>
                    </div>
                </Tabs.Content>
                <Tabs.Content value="tab2">
                    <div style={{ padding: '20px' }}>
                        <h3>Feature Adoption Tracking</h3>
                        <p>
                            Understand how users engage with new features. Track metrics like time to adoption 
                            and overall usage to measure feature success.
                        </p>
                        <ul>
                            <li>Adoption rate tracking</li>
                            <li>Time-to-adoption metrics</li>
                            <li>Feature usage analytics</li>
                            <li>Success measurement</li>
                        </ul>
                    </div>
                </Tabs.Content>
                <Tabs.Content value="tab3">
                    <div style={{ padding: '20px' }}>
                        <h3>Churn Analysis</h3>
                        <p>
                            Use session data to identify behavioral patterns of users who are at risk of churning 
                            and implement targeted retention strategies.
                        </p>
                        <ul>
                            <li>Churn prediction models</li>
                            <li>Behavioral pattern analysis</li>
                            <li>Retention strategy implementation</li>
                            <li>Risk assessment</li>
                        </ul>
                    </div>
                </Tabs.Content>
            </Tabs>
        </div>
    ),
};

// Secondary variant
export const Secondary: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <Tabs value="overview" kind="secondary">
                <Tabs.Item value="overview">
                    Overview
                </Tabs.Item>
                <Tabs.Item value="details">
                    Details
                </Tabs.Item>
                <Tabs.Item value="settings">
                    Settings
                </Tabs.Item>

                <Tabs.Content value="overview">
                    <div style={{ padding: '20px' }}>
                        <h3>System Overview</h3>
                        <p>This is the overview tab with general information about the system.</p>
                        <div style={{ 
                            background: 'var(--xyd-bgcolor-secondary)', 
                            padding: '16px', 
                            borderRadius: '8px',
                            marginTop: '16px'
                        }}>
                            <h4>Key Metrics</h4>
                            <p>Display important system metrics and status information.</p>
                        </div>
                    </div>
                </Tabs.Content>
                <Tabs.Content value="details">
                    <div style={{ padding: '20px' }}>
                        <h3>Detailed Information</h3>
                        <p>This tab shows detailed information about the selected item.</p>
                        <div style={{ 
                            background: 'var(--xyd-bgcolor-secondary)', 
                            padding: '16px', 
                            borderRadius: '8px',
                            marginTop: '16px'
                        }}>
                            <h4>Active Tab Content</h4>
                            <p>This content is visible because the Details tab is currently active.</p>
                        </div>
                    </div>
                </Tabs.Content>
                <Tabs.Content value="settings">
                    <div style={{ padding: '20px' }}>
                        <h3>Configuration Settings</h3>
                        <p>Configure your preferences and system settings in this tab.</p>
                        <ul>
                            <li>User preferences</li>
                            <li>System configuration</li>
                            <li>Security settings</li>
                            <li>Notification options</li>
                        </ul>
                    </div>
                </Tabs.Content>
            </Tabs>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Secondary Tabs variant with different styling and behavior.',
            },
        },
    },
};

// Many tabs with scrolling
export const ManyTabs: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <Tabs value="users">
                <Tabs.Item value="users">User Behavior</Tabs.Item>
                <Tabs.Item value="features">Feature Adoption</Tabs.Item>
                <Tabs.Item value="churn">Churn Analysis</Tabs.Item>
                <Tabs.Item value="revenue">Revenue Analytics</Tabs.Item>
                <Tabs.Item value="performance">Performance Metrics</Tabs.Item>
                <Tabs.Item value="security">Security Monitoring</Tabs.Item>
                <Tabs.Item value="api">API Usage</Tabs.Item>
                <Tabs.Item value="database">Database Health</Tabs.Item>

                <Tabs.Content value="users">
                    <div style={{ padding: '20px' }}>
                        <h3>User Behavior Analysis</h3>
                        <p>Track and analyze user interactions to understand behavior patterns.</p>
                    </div>
                </Tabs.Content>
                <Tabs.Content value="features">
                    <div style={{ padding: '20px' }}>
                        <h3>Feature Adoption</h3>
                        <p>Monitor how users adopt and use new features in your application.</p>
                    </div>
                </Tabs.Content>
                <Tabs.Content value="churn">
                    <div style={{ padding: '20px' }}>
                        <h3>Churn Analysis</h3>
                        <p>Identify users at risk of leaving and implement retention strategies.</p>
                    </div>
                </Tabs.Content>
                <Tabs.Content value="revenue">
                    <div style={{ padding: '20px' }}>
                        <h3>Revenue Analytics</h3>
                        <p>Track revenue metrics and analyze business performance.</p>
                    </div>
                </Tabs.Content>
                <Tabs.Content value="performance">
                    <div style={{ padding: '20px' }}>
                        <h3>Performance Metrics</h3>
                        <p>Monitor application performance and system health.</p>
                    </div>
                </Tabs.Content>
                <Tabs.Content value="security">
                    <div style={{ padding: '20px' }}>
                        <h3>Security Monitoring</h3>
                        <p>Track security events and monitor for potential threats.</p>
                    </div>
                </Tabs.Content>
                <Tabs.Content value="api">
                    <div style={{ padding: '20px' }}>
                        <h3>API Usage</h3>
                        <p>Monitor API calls, rate limits, and usage patterns.</p>
                    </div>
                </Tabs.Content>
                <Tabs.Content value="database">
                    <div style={{ padding: '20px' }}>
                        <h3>Database Health</h3>
                        <p>Track database performance, connections, and query optimization.</p>
                    </div>
                </Tabs.Content>
            </Tabs>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how the Tabs component handles many tabs with horizontal scrolling.',
            },
        },
    },
};

// Tabs with links
export const WithLinks: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <Tabs value="tab1">
                <Tabs.Item value="tab1" href="#tab1">
                    Documentation
                </Tabs.Item>
                <Tabs.Item value="tab2" href="#tab2">
                    Examples
                </Tabs.Item>
                <Tabs.Item value="tab3" href="#tab3">
                    API Reference
                </Tabs.Item>

                <Tabs.Content value="tab1">
                    <div style={{ padding: '20px' }}>
                        <h3>Component Documentation</h3>
                        <p>
                            The Tabs component provides a clean and accessible way to organize content into 
                            multiple sections. It supports horizontal scrolling when there are many tabs and 
                            includes arrow navigation for better user experience.
                        </p>
                        
                        <h4>Key Features</h4>
                        <ul>
                            <li><strong>Accessible:</strong> Built with proper ARIA attributes and keyboard navigation</li>
                            <li><strong>Responsive:</strong> Adapts to different screen sizes</li>
                            <li><strong>Scrollable:</strong> Handles many tabs with horizontal scrolling</li>
                            <li><strong>Customizable:</strong> Supports custom styling via className prop</li>
                        </ul>
                    </div>
                </Tabs.Content>
                <Tabs.Content value="tab2">
                    <div style={{ padding: '20px' }}>
                        <h3>Usage Examples</h3>
                        
                        <div style={{ marginBottom: '24px' }}>
                            <h4>Basic Tabs</h4>
                            <p>Simple tab interface with a few sections:</p>
                            <div style={{ 
                                background: 'var(--xyd-bgcolor-secondary)', 
                                padding: '16px', 
                                borderRadius: '8px'
                            }}>
                                <strong>Example:</strong> Settings, Profile, Notifications
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <h4>Many Tabs</h4>
                            <p>When you have many tabs, the component automatically adds scrolling:</p>
                            <div style={{ 
                                background: 'var(--xyd-bgcolor-secondary)', 
                                padding: '16px', 
                                borderRadius: '8px'
                            }}>
                                <strong>Example:</strong> Analytics, Users, Reports, Settings, Help, etc.
                            </div>
                        </div>
                    </div>
                </Tabs.Content>
                <Tabs.Content value="tab3">
                    <div style={{ padding: '20px' }}>
                        <h3>API Reference</h3>
                        
                        <h4>Props</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--xyd-border-color)' }}>
                                    <th style={{ textAlign: 'left', padding: '8px' }}>Prop</th>
                                    <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                                    <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid var(--xyd-border-color)' }}>
                                    <td style={{ padding: '8px' }}><code>children</code></td>
                                    <td style={{ padding: '8px' }}>React.ReactNode</td>
                                    <td style={{ padding: '8px' }}>Tab items and content sections</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--xyd-border-color)' }}>
                                    <td style={{ padding: '8px' }}><code>value</code></td>
                                    <td style={{ padding: '8px' }}>string</td>
                                    <td style={{ padding: '8px' }}>Currently selected tab value</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--xyd-border-color)' }}>
                                    <td style={{ padding: '8px' }}><code>onChange</code></td>
                                    <td style={{ padding: '8px' }}>function</td>
                                    <td style={{ padding: '8px' }}>Callback when tab is selected</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '8px' }}><code>kind</code></td>
                                    <td style={{ padding: '8px' }}>string</td>
                                    <td style={{ padding: '8px' }}>Tab variant (default/secondary)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Tabs.Content>
            </Tabs>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows tabs with href links for navigation.',
            },
        },
    },
};

// Real-world examples
export const RealWorldExamples: Story = {
    render: () => (
        <div style={{ padding: '20px', maxWidth: '1000px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h2>Dashboard Analytics</h2>
                <p>Tabs are commonly used in dashboards to organize different types of analytics and data.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h3 style={{ marginBottom: '16px' }}>Analytics Dashboard</h3>
                    <Tabs value="overview">
                        <Tabs.Item value="overview">Overview</Tabs.Item>
                        <Tabs.Item value="users">Users</Tabs.Item>
                        <Tabs.Item value="revenue">Revenue</Tabs.Item>
                        <Tabs.Item value="performance">Performance</Tabs.Item>
                        <Tabs.Item value="settings">Settings</Tabs.Item>

                        <Tabs.Content value="overview">
                            <div style={{ padding: '20px' }}>
                                <h4>Dashboard Overview</h4>
                                <p>Key metrics and summary information for your application.</p>
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                                    gap: '16px',
                                    marginTop: '16px'
                                }}>
                                    <div style={{ 
                                        background: 'var(--xyd-bgcolor-secondary)', 
                                        padding: '16px', 
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <h5>Total Users</h5>
                                        <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>12,345</p>
                                    </div>
                                    <div style={{ 
                                        background: 'var(--xyd-bgcolor-secondary)', 
                                        padding: '16px', 
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <h5>Active Sessions</h5>
                                        <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>1,234</p>
                                    </div>
                                    <div style={{ 
                                        background: 'var(--xyd-bgcolor-secondary)', 
                                        padding: '16px', 
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <h5>Revenue</h5>
                                        <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>$45,678</p>
                                    </div>
                                </div>
                            </div>
                        </Tabs.Content>
                        <Tabs.Content value="users">
                            <div style={{ padding: '20px' }}>
                                <h4>User Analytics</h4>
                                <p>Detailed user behavior and engagement metrics.</p>
                                <ul>
                                    <li>User acquisition trends</li>
                                    <li>Engagement metrics</li>
                                    <li>Retention analysis</li>
                                    <li>User segmentation</li>
                                </ul>
                            </div>
                        </Tabs.Content>
                        <Tabs.Content value="revenue">
                            <div style={{ padding: '20px' }}>
                                <h4>Revenue Analytics</h4>
                                <p>Financial metrics and revenue tracking.</p>
                                <ul>
                                    <li>Monthly recurring revenue</li>
                                    <li>Customer lifetime value</li>
                                    <li>Churn rate analysis</li>
                                    <li>Pricing optimization</li>
                                </ul>
                            </div>
                        </Tabs.Content>
                        <Tabs.Content value="performance">
                            <div style={{ padding: '20px' }}>
                                <h4>System Performance</h4>
                                <p>Application performance and system health metrics.</p>
                                <ul>
                                    <li>Response time monitoring</li>
                                    <li>Error rate tracking</li>
                                    <li>Resource utilization</li>
                                    <li>Uptime statistics</li>
                                </ul>
                            </div>
                        </Tabs.Content>
                        <Tabs.Content value="settings">
                            <div style={{ padding: '20px' }}>
                                <h4>Dashboard Settings</h4>
                                <p>Configure your dashboard preferences and display options.</p>
                                <ul>
                                    <li>Widget customization</li>
                                    <li>Theme selection</li>
                                    <li>Notification preferences</li>
                                    <li>Data refresh intervals</li>
                                </ul>
                            </div>
                        </Tabs.Content>
                    </Tabs>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>Product Documentation</h2>
                <p>Tabs are perfect for organizing product documentation and user guides.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h3 style={{ marginBottom: '16px' }}>API Documentation</h3>
                    <Tabs value="getting-started">
                        <Tabs.Item value="getting-started">Getting Started</Tabs.Item>
                        <Tabs.Item value="authentication">Authentication</Tabs.Item>
                        <Tabs.Item value="endpoints">Endpoints</Tabs.Item>
                        <Tabs.Item value="examples">Examples</Tabs.Item>
                        <Tabs.Item value="sdks">SDKs</Tabs.Item>

                        <Tabs.Content value="getting-started">
                            <div style={{ padding: '20px' }}>
                                <h4>Quick Start Guide</h4>
                                <p>Get up and running with our API in minutes.</p>
                                <ol>
                                    <li>Sign up for an API key</li>
                                    <li>Install the SDK</li>
                                    <li>Make your first request</li>
                                    <li>Explore the documentation</li>
                                </ol>
                            </div>
                        </Tabs.Content>
                        <Tabs.Content value="authentication">
                            <div style={{ padding: '20px' }}>
                                <h4>API Authentication</h4>
                                <p>Learn how to authenticate your API requests.</p>
                                <pre style={{ 
                                    background: 'var(--xyd-bgcolor-secondary)', 
                                    padding: '12px', 
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}>
                                    <code>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.example.com/v1/data`}</code>
                                </pre>
                            </div>
                        </Tabs.Content>
                        <Tabs.Content value="endpoints">
                            <div style={{ padding: '20px' }}>
                                <h4>API Endpoints</h4>
                                <p>Complete reference of all available API endpoints.</p>
                                <ul>
                                    <li>GET /users - List users</li>
                                    <li>POST /users - Create user</li>
                                    <li>PUT /users/{'{id}'} - Update user</li>
                                    <li>DELETE /users/{'{id}'} - Delete user</li>
                                </ul>
                            </div>
                        </Tabs.Content>
                        <Tabs.Content value="examples">
                            <div style={{ padding: '20px' }}>
                                <h4>Code Examples</h4>
                                <p>Real-world examples in multiple programming languages.</p>
                                <ul>
                                    <li>JavaScript/Node.js examples</li>
                                    <li>Python examples</li>
                                    <li>PHP examples</li>
                                    <li>cURL examples</li>
                                </ul>
                            </div>
                        </Tabs.Content>
                        <Tabs.Content value="sdks">
                            <div style={{ padding: '20px' }}>
                                <h4>Software Development Kits</h4>
                                <p>Official SDKs for popular programming languages.</p>
                                <ul>
                                    <li>JavaScript SDK</li>
                                    <li>Python SDK</li>
                                    <li>PHP SDK</li>
                                    <li>Ruby SDK</li>
                                </ul>
                            </div>
                        </Tabs.Content>
                    </Tabs>
                </div>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how Tabs components are typically used in real applications.',
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
                <h3 style={{ marginBottom: '16px' }}>Tabs Component Demo</h3>
                <p style={{ marginBottom: '16px', color: 'var(--xyd-text-color)' }}>
                    This example demonstrates the Tabs component with various content types and interactive features.
                </p>
                <Tabs value="features">
                    <Tabs.Item value="features">Features</Tabs.Item>
                    <Tabs.Item value="implementation">Implementation</Tabs.Item>
                    <Tabs.Item value="customization">Customization</Tabs.Item>

                    <Tabs.Content value="features">
                        <div style={{ padding: '20px' }}>
                            <h4>Key Features</h4>
                            <ul style={{ color: 'var(--xyd-text-color)' }}>
                                <li>Horizontal scrolling for many tabs</li>
                                <li>Arrow navigation when tabs overflow</li>
                                <li>Accessible keyboard navigation</li>
                                <li>Customizable styling</li>
                                <li>Rich content support</li>
                                <li>Responsive design</li>
                            </ul>
                        </div>
                    </Tabs.Content>
                    <Tabs.Content value="implementation">
                        <div style={{ padding: '20px' }}>
                            <h4>Implementation Details</h4>
                            <p style={{ color: 'var(--xyd-text-color)' }}>
                                The Tabs component is built using Radix UI primitives for accessibility and 
                                includes custom scrolling behavior for handling many tabs efficiently.
                            </p>
                            <pre style={{ 
                                background: 'var(--xyd-bgcolor-secondary)', 
                                padding: '12px', 
                                borderRadius: '4px',
                                fontSize: '14px',
                                marginTop: '16px'
                            }}>
                                <code>{`// Basic usage
<Tabs value="tab1">
  <Tabs.Item value="tab1">Tab 1</Tabs.Item>
  <Tabs.Item value="tab2">Tab 2</Tabs.Item>
  <Tabs.Content value="tab1">Content 1</Tabs.Content>
  <Tabs.Content value="tab2">Content 2</Tabs.Content>
</Tabs>`}</code>
                            </pre>
                        </div>
                    </Tabs.Content>
                    <Tabs.Content value="customization">
                        <div style={{ padding: '20px' }}>
                            <h4>Customization Options</h4>
                            <p style={{ color: 'var(--xyd-text-color)' }}>
                                The component supports various customization options through props and CSS classes.
                            </p>
                            <ul style={{ color: 'var(--xyd-text-color)' }}>
                                <li><code>value</code> - Set active tab</li>
                                <li><code>onChange</code> - Handle tab changes</li>
                                <li><code>className</code> - Add custom CSS classes</li>
                                <li><code>kind</code> - Choose variant (default/secondary)</li>
                                <li>CSS custom properties for theming</li>
                            </ul>
                        </div>
                    </Tabs.Content>
                </Tabs>
            </div>

            <div style={{ 
                background: 'var(--xyd-bgcolor)',
                border: '1px solid var(--xyd-border-color)',
                borderRadius: '8px',
                padding: '20px'
            }}>
                <h4 style={{ marginBottom: '12px' }}>Usage Guidelines</h4>
                <ul style={{ color: 'var(--xyd-text-color)' }}>
                    <li>Use for organizing related content into sections</li>
                    <li>Keep tab labels short and descriptive</li>
                    <li>Ensure each tab has meaningful content</li>
                    <li>Consider mobile responsiveness</li>
                    <li>Test with many tabs for scrolling behavior</li>
                    <li>Use href prop for navigation when needed</li>
                </ul>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This interactive example demonstrates the Tabs component functionality and customization options.',
            },
        },
    },
};

// Comparison between variants
export const PrimaryVsSecondary: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ marginBottom: '16px', color: '#666' }}>Primary Tabs (Default)</h3>
                <Tabs value="tab1">
                    <Tabs.Item value="tab1">First Tab</Tabs.Item>
                    <Tabs.Item value="tab2">Second Tab</Tabs.Item>
                    <Tabs.Item value="tab3">Third Tab</Tabs.Item>

                    <Tabs.Content value="tab1">
                        <div style={{ padding: '20px' }}>
                            <h4>Primary Tab Content</h4>
                            <p>This is the primary variant with default styling.</p>
                        </div>
                    </Tabs.Content>
                    <Tabs.Content value="tab2">
                        <div style={{ padding: '20px' }}>
                            <h4>Second Tab</h4>
                            <p>Content for the second tab.</p>
                        </div>
                    </Tabs.Content>
                    <Tabs.Content value="tab3">
                        <div style={{ padding: '20px' }}>
                            <h4>Third Tab</h4>
                            <p>Content for the third tab.</p>
                        </div>
                    </Tabs.Content>
                </Tabs>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ marginBottom: '16px', color: '#666' }}>Secondary Tabs</h3>
                <Tabs value="tab1" kind="secondary">
                    <Tabs.Item value="tab1">First Tab</Tabs.Item>
                    <Tabs.Item value="tab2">Second Tab</Tabs.Item>
                    <Tabs.Item value="tab3">Third Tab</Tabs.Item>

                    <Tabs.Content value="tab1">
                        <div style={{ padding: '20px' }}>
                            <h4>Secondary Tab Content</h4>
                            <p>This is the secondary variant with different styling.</p>
                        </div>
                    </Tabs.Content>
                    <Tabs.Content value="tab2">
                        <div style={{ padding: '20px' }}>
                            <h4>Second Tab</h4>
                            <p>Content for the second tab.</p>
                        </div>
                    </Tabs.Content>
                    <Tabs.Content value="tab3">
                        <div style={{ padding: '20px' }}>
                            <h4>Third Tab</h4>
                            <p>Content for the third tab.</p>
                        </div>
                    </Tabs.Content>
                </Tabs>
            </div>

            <div style={{ 
                background: 'var(--xyd-bgcolor)',
                border: '1px solid var(--xyd-border-color)',
                borderRadius: '8px',
                padding: '20px'
            }}>
                <h4 style={{ marginBottom: '12px' }}>Key Differences</h4>
                <ul style={{ color: 'var(--xyd-text-color)' }}>
                    <li><strong>Primary:</strong> Default styling with underline indicator</li>
                    <li><strong>Secondary:</strong> Different visual styling and behavior</li>
                    <li><strong>Use Primary:</strong> For general content organization</li>
                    <li><strong>Use Secondary:</strong> For specific use cases requiring different styling</li>
                </ul>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example compares the primary and secondary variants of the Tabs component.',
            },
        },
    },
};
