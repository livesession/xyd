import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { ColorSchemeButton } from '@xyd-js/components/writer';

const meta: Meta<typeof ColorSchemeButton> = {
    title: 'Components/Writer/ColorSchemeButton',
    component: ColorSchemeButton,
    parameters: {
        docs: {
            description: {
                component: 'ColorSchemeButton component provides a toggle button for switching between light and dark color schemes. It automatically detects the current scheme and updates the UI accordingly.',
            },
        },
    },
    argTypes: {
        // ColorSchemeButton doesn't accept props, but we can document the behavior
    },
};

export default meta;
type Story = StoryObj<typeof ColorSchemeButton>;

// Basic usage
export const Default: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <ColorSchemeButton />
        </div>
    ),
};

// In navigation context
export const InNavigation: Story = {
    render: () => (
        <div style={{ 
            padding: '20px',
            background: 'var(--xyd-bgcolor)',
            border: '1px solid var(--xyd-border-color)',
            borderRadius: '8px'
        }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '16px'
            }}>
                <div style={{ fontWeight: 'bold' }}>Documentation</div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px' }}>Theme:</span>
                    <ColorSchemeButton />
                </div>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how the ColorSchemeButton is typically used in navigation bars or headers.',
            },
        },
    },
};

// Multiple buttons
export const MultipleButtons: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Header Button</h3>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px',
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '4px'
                }}>
                    <span>Site Header</span>
                    <ColorSchemeButton />
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Sidebar Button</h3>
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '12px',
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '4px',
                    width: '200px'
                }}>
                    <span>Navigation</span>
                    <span>Getting Started</span>
                    <span>API Reference</span>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center' }}>
                        <ColorSchemeButton />
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Footer Button</h3>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px',
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '4px'
                }}>
                    <span>© 2024 Documentation</span>
                    <ColorSchemeButton />
                </div>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how ColorSchemeButton can be used in different contexts throughout an application.',
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
                <h3 style={{ marginBottom: '16px' }}>Theme Toggle Demo</h3>
                <p style={{ marginBottom: '16px', color: 'var(--xyd-text-color)' }}>
                    Click the button below to toggle between light and dark themes. 
                    The button will automatically show the appropriate icon for the current theme.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ColorSchemeButton />
                </div>
            </div>

            <div style={{ 
                background: 'var(--xyd-bgcolor)',
                border: '1px solid var(--xyd-border-color)',
                borderRadius: '8px',
                padding: '20px'
            }}>
                <h4 style={{ marginBottom: '12px' }}>Current Theme Information</h4>
                <ul style={{ color: 'var(--xyd-text-color)' }}>
                    <li>The button automatically detects the current color scheme</li>
                    <li>Shows a sun icon for light mode</li>
                    <li>Shows a moon icon for dark mode</li>
                    <li>Persists the selection in localStorage</li>
                    <li>Respects system preferences when set to "os"</li>
                </ul>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This interactive example demonstrates the ColorSchemeButton functionality and behavior.',
            },
        },
    },
};

// Real-world examples
export const RealWorldExamples: Story = {
    render: () => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h2>Documentation Site Header</h2>
                <p>Typical usage in a documentation site header with navigation and theme toggle.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '16px'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Docs</span>
                            <nav style={{ display: 'flex', gap: '16px' }}>
                                <a href="#" style={{ color: 'var(--xyd-text-color)', textDecoration: 'none' }}>Guide</a>
                                <a href="#" style={{ color: 'var(--xyd-text-color)', textDecoration: 'none' }}>API</a>
                                <a href="#" style={{ color: 'var(--xyd-text-color)', textDecoration: 'none' }}>Examples</a>
                            </nav>
                        </div>
                        <ColorSchemeButton />
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>Application Settings</h2>
                <p>Theme toggle in an application settings panel.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h3 style={{ marginBottom: '16px' }}>Appearance</h3>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '12px',
                        background: 'var(--xyd-bgcolor-secondary)',
                        borderRadius: '4px',
                        marginBottom: '12px'
                    }}>
                        <div>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Theme</div>
                            <div style={{ fontSize: '14px', color: 'var(--xyd-text-color-secondary)' }}>
                                Choose your preferred color scheme
                            </div>
                        </div>
                        <ColorSchemeButton />
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>Sidebar Navigation</h2>
                <p>Theme toggle in a sidebar navigation component.</p>
                <div style={{ 
                    display: 'flex',
                    gap: '20px'
                }}>
                    <div style={{ 
                        background: 'var(--xyd-bgcolor)',
                        border: '1px solid var(--xyd-border-color)',
                        borderRadius: '8px',
                        padding: '16px',
                        width: '250px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Navigation</div>
                        <a href="#" style={{ color: 'var(--xyd-text-color)', textDecoration: 'none' }}>Dashboard</a>
                        <a href="#" style={{ color: 'var(--xyd-text-color)', textDecoration: 'none' }}>Projects</a>
                        <a href="#" style={{ color: 'var(--xyd-text-color)', textDecoration: 'none' }}>Settings</a>
                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center' }}>
                            <ColorSchemeButton />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows practical use cases for the ColorSchemeButton in real applications.',
            },
        },
    },
};

// Theme demonstration
export const ThemeDemonstration: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ 
                background: 'var(--xyd-bgcolor)',
                border: '1px solid var(--xyd-border-color)',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px'
            }}>
                <h3 style={{ marginBottom: '16px', color: 'var(--xyd-text-color)' }}>Theme Toggle</h3>
                <p style={{ marginBottom: '16px', color: 'var(--xyd-text-color)' }}>
                    This button automatically adapts to the current theme and provides a way to switch between light and dark modes.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ColorSchemeButton />
                </div>
            </div>

            <div style={{ 
                background: 'var(--xyd-bgcolor)',
                border: '1px solid var(--xyd-border-color)',
                borderRadius: '8px',
                padding: '20px'
            }}>
                <h4 style={{ marginBottom: '12px', color: 'var(--xyd-text-color)' }}>Features</h4>
                <ul style={{ color: 'var(--xyd-text-color)' }}>
                    <li>Automatic theme detection</li>
                    <li>System preference support</li>
                    <li>Local storage persistence</li>
                    <li>Accessible button design</li>
                    <li>Consistent with design system</li>
                </ul>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example demonstrates the ColorSchemeButton features and capabilities.',
            },
        },
    },
}; 