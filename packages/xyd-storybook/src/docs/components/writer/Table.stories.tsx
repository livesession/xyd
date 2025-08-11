import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Table } from '@xyd-js/components/writer';

const meta: Meta<typeof Table> = {
    title: 'Components/Writer/Table',
    component: Table,
    parameters: {
        docs: {
            description: {
                component: 'Table component provides structured data display with support for headers, body content, and various cell types including numeric and muted variants.',
            },
        },
    },
    argTypes: {
        children: {
            description: 'The table content including Head and Body components',
            control: false,
        },
    },
};

export default meta;
type Story = StoryObj<typeof Table>;

// Basic table
export const Default: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <Table>
                <Table.Head>
                    <Table.Tr>
                        <Table.Th>Model</Table.Th>
                        <Table.Th numeric>Training</Table.Th>
                        <Table.Th numeric>Input</Table.Th>
                        <Table.Th numeric>Cached input</Table.Th>
                        <Table.Th numeric>Output</Table.Th>
                    </Table.Tr>
                </Table.Head>
                <Table.Body>
                    <Table.Tr>
                        <Table.Td>
                            <Table.Cell>gpt-4o-2024-08-06</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric>
                            <Table.Cell>$25.00</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric>
                            <Table.Cell>$3.75</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric muted>
                            <Table.Cell>$1.875</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric>
                            <Table.Cell>$15.00</Table.Cell>
                        </Table.Td>
                    </Table.Tr>
                </Table.Body>
            </Table>
        </div>
    ),
};

// Multiple rows
export const MultipleRows: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <Table>
                <Table.Head>
                    <Table.Tr>
                        <Table.Th>Model</Table.Th>
                        <Table.Th numeric>Training</Table.Th>
                        <Table.Th numeric>Input</Table.Th>
                        <Table.Th numeric>Cached input</Table.Th>
                        <Table.Th numeric>Output</Table.Th>
                    </Table.Tr>
                </Table.Head>
                <Table.Body>
                    <Table.Tr>
                        <Table.Td>
                            <Table.Cell>gpt-4o-2024-08-06</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric>
                            <Table.Cell>$25.00</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric>
                            <Table.Cell>$3.75</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric muted>
                            <Table.Cell>$1.875</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric>
                            <Table.Cell>$15.00</Table.Cell>
                        </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                        <Table.Td>
                            <Table.Cell>gpt-4o-mini</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric>
                            <Table.Cell>$15.00</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric>
                            <Table.Cell>$0.15</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric muted>
                            <Table.Cell>$0.075</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric>
                            <Table.Cell>$0.60</Table.Cell>
                        </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                        <Table.Td>
                            <Table.Cell>gpt-3.5-turbo</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric>
                            <Table.Cell>$3.00</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric>
                            <Table.Cell>$0.0015</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric muted>
                            <Table.Cell>$0.002</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric>
                            <Table.Cell>$0.002</Table.Cell>
                        </Table.Td>
                    </Table.Tr>
                </Table.Body>
            </Table>
        </div>
    ),
};

// Different data types
export const DifferentDataTypes: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <Table>
                <Table.Head>
                    <Table.Tr>
                        <Table.Th>Feature</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th numeric>Usage</Table.Th>
                        <Table.Th>Last Updated</Table.Th>
                        <Table.Th numeric>Performance</Table.Th>
                    </Table.Tr>
                </Table.Head>
                <Table.Body>
                    <Table.Tr>
                        <Table.Td>
                            <Table.Cell>API Authentication</Table.Cell>
                        </Table.Td>
                        <Table.Td>
                            <Table.Cell>✅ Active</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric>
                            <Table.Cell>1,234</Table.Cell>
                        </Table.Td>
                        <Table.Td>
                            <Table.Cell>2024-01-15</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric>
                            <Table.Cell>99.9%</Table.Cell>
                        </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                        <Table.Td>
                            <Table.Cell>Data Processing</Table.Cell>
                        </Table.Td>
                        <Table.Td>
                            <Table.Cell>⚠️ Limited</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric>
                            <Table.Cell>567</Table.Cell>
                        </Table.Td>
                        <Table.Td>
                            <Table.Cell>2024-01-10</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric>
                            <Table.Cell>95.2%</Table.Cell>
                        </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                        <Table.Td>
                            <Table.Cell>Analytics Dashboard</Table.Cell>
                        </Table.Td>
                        <Table.Td>
                            <Table.Cell>❌ Disabled</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric>
                            <Table.Cell>0</Table.Cell>
                        </Table.Td>
                        <Table.Td>
                            <Table.Cell>2024-01-05</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric muted>
                            <Table.Cell>N/A</Table.Cell>
                        </Table.Td>
                    </Table.Tr>
                </Table.Body>
            </Table>
        </div>
    ),
};

// Long content
export const LongContent: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <Table>
                <Table.Head>
                    <Table.Tr>
                        <Table.Th>Description</Table.Th>
                        <Table.Th>Category</Table.Th>
                        <Table.Th numeric>Priority</Table.Th>
                        <Table.Th>Notes</Table.Th>
                    </Table.Tr>
                </Table.Head>
                <Table.Body>
                    <Table.Tr>
                        <Table.Td>
                            <Table.Cell>
                                Implement comprehensive user authentication system with support for 
                                multiple authentication providers including OAuth, SAML, and custom 
                                token-based authentication.
                            </Table.Cell>
                        </Table.Td>
                        <Table.Td>
                            <Table.Cell>Security</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric>
                            <Table.Cell>High</Table.Cell>
                        </Table.Td>
                        <Table.Td>
                            <Table.Cell>
                                This feature is critical for enterprise customers and requires 
                                thorough testing across different environments.
                            </Table.Cell>
                        </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                        <Table.Td>
                            <Table.Cell>
                                Create advanced analytics dashboard with real-time data visualization, 
                                customizable charts, and export functionality for business intelligence.
                            </Table.Cell>
                        </Table.Td>
                        <Table.Td>
                            <Table.Cell>Analytics</Table.Cell>
                        </Table.Td>
                        <Table.Td numeric>
                            <Table.Cell>Medium</Table.Cell>
                        </Table.Td>
                        <Table.Td>
                            <Table.Cell>
                                Should integrate with existing data pipeline and support multiple 
                                chart types including line, bar, and pie charts.
                            </Table.Cell>
                        </Table.Td>
                    </Table.Tr>
                </Table.Body>
            </Table>
        </div>
    ),
};

// Real-world examples
export const RealWorldExamples: Story = {
    render: () => (
        <div style={{ padding: '20px', maxWidth: '1000px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h2>API Pricing Table</h2>
                <p>Tables are commonly used to display pricing information and feature comparisons.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <Table>
                        <Table.Head>
                            <Table.Tr>
                                <Table.Th>Plan</Table.Th>
                                <Table.Th numeric>Price</Table.Th>
                                <Table.Th numeric>API Calls</Table.Th>
                                <Table.Th numeric>Storage</Table.Th>
                                <Table.Th>Support</Table.Th>
                            </Table.Tr>
                        </Table.Head>
                        <Table.Body>
                            <Table.Tr>
                                <Table.Td>
                                    <Table.Cell>Starter</Table.Cell>
                                </Table.Td>
                                <Table.Td numeric>
                                    <Table.Cell>$29/month</Table.Cell>
                                </Table.Td>
                                <Table.Td numeric>
                                    <Table.Cell>10,000</Table.Cell>
                                </Table.Td>
                                <Table.Td numeric>
                                    <Table.Cell>5GB</Table.Cell>
                                </Table.Td>
                                <Table.Td>
                                    <Table.Cell>Email</Table.Cell>
                                </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td>
                                    <Table.Cell>Professional</Table.Cell>
                                </Table.Td>
                                <Table.Td numeric>
                                    <Table.Cell>$99/month</Table.Cell>
                                </Table.Td>
                                <Table.Td numeric>
                                    <Table.Cell>100,000</Table.Cell>
                                </Table.Td>
                                <Table.Td numeric>
                                    <Table.Cell>50GB</Table.Cell>
                                </Table.Td>
                                <Table.Td>
                                    <Table.Cell>Priority</Table.Cell>
                                </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td>
                                    <Table.Cell>Enterprise</Table.Cell>
                                </Table.Td>
                                <Table.Td numeric>
                                    <Table.Cell>Custom</Table.Cell>
                                </Table.Td>
                                <Table.Td numeric>
                                    <Table.Cell>Unlimited</Table.Cell>
                                </Table.Td>
                                <Table.Td numeric>
                                    <Table.Cell>Unlimited</Table.Cell>
                                </Table.Td>
                                <Table.Td>
                                    <Table.Cell>24/7 Phone</Table.Cell>
                                </Table.Td>
                            </Table.Tr>
                        </Table.Body>
                    </Table>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>System Status</h2>
                <p>Tables can display system status and monitoring information.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <Table>
                        <Table.Head>
                            <Table.Tr>
                                <Table.Th>Service</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th numeric>Uptime</Table.Th>
                                <Table.Th numeric>Response Time</Table.Th>
                                <Table.Th>Last Incident</Table.Th>
                            </Table.Tr>
                        </Table.Head>
                        <Table.Body>
                            <Table.Tr>
                                <Table.Td>
                                    <Table.Cell>API Gateway</Table.Cell>
                                </Table.Td>
                                <Table.Td>
                                    <Table.Cell>🟢 Operational</Table.Cell>
                                </Table.Td>
                                <Table.Td numeric>
                                    <Table.Cell>99.99%</Table.Cell>
                                </Table.Td>
                                <Table.Td numeric>
                                    <Table.Cell>45ms</Table.Cell>
                                </Table.Td>
                                <Table.Td>
                                    <Table.Cell>2024-01-10</Table.Cell>
                                </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td>
                                    <Table.Cell>Database</Table.Cell>
                                </Table.Td>
                                <Table.Td>
                                    <Table.Cell>🟡 Degraded</Table.Cell>
                                </Table.Td>
                                <Table.Td numeric>
                                    <Table.Cell>99.85%</Table.Cell>
                                </Table.Td>
                                <Table.Td numeric>
                                    <Table.Cell>120ms</Table.Cell>
                                </Table.Td>
                                <Table.Td>
                                    <Table.Cell>2024-01-15</Table.Cell>
                                </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td>
                                    <Table.Cell>CDN</Table.Cell>
                                </Table.Td>
                                <Table.Td>
                                    <Table.Cell>🟢 Operational</Table.Cell>
                                </Table.Td>
                                <Table.Td numeric>
                                    <Table.Cell>99.98%</Table.Cell>
                                </Table.Td>
                                <Table.Td numeric>
                                    <Table.Cell>25ms</Table.Cell>
                                </Table.Td>
                                <Table.Td>
                                    <Table.Cell>2024-01-08</Table.Cell>
                                </Table.Td>
                            </Table.Tr>
                        </Table.Body>
                    </Table>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>User Management</h2>
                <p>Tables are perfect for displaying user lists and management interfaces.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <Table>
                        <Table.Head>
                            <Table.Tr>
                                <Table.Th>User</Table.Th>
                                <Table.Th>Role</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th numeric>Last Login</Table.Th>
                                <Table.Th numeric>Actions</Table.Th>
                            </Table.Tr>
                        </Table.Head>
                        <Table.Body>
                            <Table.Tr>
                                <Table.Td>
                                    <Table.Cell>john.doe@company.com</Table.Cell>
                                </Table.Td>
                                <Table.Td>
                                    <Table.Cell>Admin</Table.Cell>
                                </Table.Td>
                                <Table.Td>
                                    <Table.Cell>🟢 Active</Table.Cell>
                                </Table.Td>
                                <Table.Td numeric>
                                    <Table.Cell>2 hours ago</Table.Cell>
                                </Table.Td>
                                <Table.Td numeric>
                                    <Table.Cell>Edit | Delete</Table.Cell>
                                </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td>
                                    <Table.Cell>jane.smith@company.com</Table.Cell>
                                </Table.Td>
                                <Table.Td>
                                    <Table.Cell>User</Table.Cell>
                                </Table.Td>
                                <Table.Td>
                                    <Table.Cell>🟡 Pending</Table.Cell>
                                </Table.Td>
                                <Table.Td numeric>
                                    <Table.Cell>Never</Table.Cell>
                                </Table.Td>
                                <Table.Td numeric>
                                    <Table.Cell>Edit | Delete</Table.Cell>
                                </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td>
                                    <Table.Cell>bob.wilson@company.com</Table.Cell>
                                </Table.Td>
                                <Table.Td>
                                    <Table.Cell>Manager</Table.Cell>
                                </Table.Td>
                                <Table.Td>
                                    <Table.Cell>🟢 Active</Table.Cell>
                                </Table.Td>
                                <Table.Td numeric>
                                    <Table.Cell>1 day ago</Table.Cell>
                                </Table.Td>
                                <Table.Td numeric>
                                    <Table.Cell>Edit | Delete</Table.Cell>
                                </Table.Td>
                            </Table.Tr>
                        </Table.Body>
                    </Table>
                </div>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how tables are typically used in real applications for data display.',
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
                <h3 style={{ marginBottom: '16px' }}>Table Component Demo</h3>
                <p style={{ marginBottom: '16px', color: 'var(--xyd-text-color)' }}>
                    This example demonstrates the Table component with various cell types and data formats.
                </p>
                <Table>
                    <Table.Head>
                        <Table.Tr>
                            <Table.Th>Component</Table.Th>
                            <Table.Th>Type</Table.Th>
                            <Table.Th numeric>Complexity</Table.Th>
                            <Table.Th>Status</Table.Th>
                        </Table.Tr>
                    </Table.Head>
                    <Table.Body>
                        <Table.Tr>
                            <Table.Td>
                                <Table.Cell>Button</Table.Cell>
                            </Table.Td>
                            <Table.Td>
                                <Table.Cell>Interactive</Table.Cell>
                            </Table.Td>
                            <Table.Td numeric>
                                <Table.Cell>Low</Table.Cell>
                            </Table.Td>
                            <Table.Td>
                                <Table.Cell>✅ Complete</Table.Cell>
                            </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Td>
                                <Table.Cell>Table</Table.Cell>
                            </Table.Td>
                            <Table.Td>
                                <Table.Cell>Data Display</Table.Cell>
                            </Table.Td>
                            <Table.Td numeric>
                                <Table.Cell>Medium</Table.Cell>
                            </Table.Td>
                            <Table.Td>
                                <Table.Cell>🔄 In Progress</Table.Cell>
                            </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Td>
                                <Table.Cell>Steps</Table.Cell>
                            </Table.Td>
                            <Table.Td>
                                <Table.Cell>Navigation</Table.Cell>
                            </Table.Td>
                            <Table.Td numeric>
                                <Table.Cell>Low</Table.Cell>
                            </Table.Td>
                            <Table.Td>
                                <Table.Cell>✅ Complete</Table.Cell>
                            </Table.Td>
                        </Table.Tr>
                    </Table.Body>
                </Table>
            </div>

            <div style={{ 
                background: 'var(--xyd-bgcolor)',
                border: '1px solid var(--xyd-border-color)',
                borderRadius: '8px',
                padding: '20px'
            }}>
                <h4 style={{ marginBottom: '12px' }}>Features</h4>
                <ul style={{ color: 'var(--xyd-text-color)' }}>
                    <li>Structured data display</li>
                    <li>Numeric cell alignment</li>
                    <li>Muted cell styling</li>
                    <li>Responsive design</li>
                    <li>Accessible markup</li>
                </ul>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This interactive example demonstrates the Table component functionality and styling.',
            },
        },
    },
};

