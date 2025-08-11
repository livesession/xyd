import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { ContentDecorator } from '@xyd-js/components/content';
import { Heading, Image, List, Text, Update } from '@xyd-js/components/writer';

const meta: Meta<typeof Update> = {
    title: 'Components/Writer/Update',
    component: Update,
    parameters: {
        docs: {
            description: {
                component: 'Update component displays version information, release dates, and changelog content. Perfect for documenting software releases, feature updates, and version history with rich content support.',
            },
        },
    },
    argTypes: {
        date: {
            description: 'The release date in YYYY-MM-DD format',
            control: 'text',
        },
        version: {
            description: 'The version number or release identifier',
            control: 'text',
        },
        children: {
            description: 'Rich content including images, text, and other components',
            control: false,
        },
    },
};

export default meta;
type Story = StoryObj<typeof Update>;

// Basic update
export const Default: Story = {
    args: {
        date: '2024-10-12',
        version: 'v0.1.1',
        children: (
            <ContentDecorator>
                <Image
                    src="https://placehold.co/600x300?text=Screenshot+or+Content"
                    alt="Screenshot placeholder"
                />
                <Heading size={2}>
                    Changelog
                </Heading>
                <Text>
                    You can add anything here, like a screenshot, a code snippet, or a list of changes.
                </Text>

                <Heading size={3}>
                    Features
                </Heading>
                <List>
                    <List.Item>Initial layout</List.Item>
                    <List.Item>Basic navigation</List.Item>
                </List>
            </ContentDecorator>
        ),
    },
};

// Major release
export const MajorRelease: Story = {
    args: {
        date: '2024-12-01',
        version: 'v2.0.0',
        children: (
            <ContentDecorator>
                <Image
                    src="https://placehold.co/600x300?text=Major+Release+Screenshot"
                    alt="Major release screenshot"
                />
                <Heading size={2}>
                    Major Release - v2.0.0
                </Heading>
                <Text>
                    This is a major release with significant improvements and new features. 
                    We've completely redesigned the user interface and introduced a new component library.
                </Text>

                <Heading size={3}>
                    What's New
                </Heading>
                <List>
                    <List.Item>Complete UI redesign with modern aesthetics</List.Item>
                    <List.Item>New component library with 50+ components</List.Item>
                    <List.Item>Performance improvements up to 40% faster</List.Item>
                    <List.Item>Enhanced accessibility with WCAG 2.1 compliance</List.Item>
                    <List.Item>New dark mode support</List.Item>
                    <List.Item>Improved TypeScript support</List.Item>
                </List>

                <Heading size={3}>
                    Breaking Changes
                </Heading>
                <Text>
                    This release includes breaking changes. Please review the migration guide 
                    before updating your applications.
                </Text>
            </ContentDecorator>
        ),
    },
    parameters: {
        docs: {
            description: {
                story: 'Major release example with significant features and breaking changes.',
            },
        },
    },
};

// Minor release
export const MinorRelease: Story = {
    args: {
        date: '2024-11-15',
        version: 'v1.5.0',
        children: (
            <ContentDecorator>
                <Image
                    src="https://placehold.co/600x300?text=Minor+Release+Screenshot"
                    alt="Minor release screenshot"
                />
                <Heading size={2}>
                    Minor Release - v1.5.0
                </Heading>
                <Text>
                    This minor release adds new components and includes various bug fixes 
                    and performance improvements.
                </Text>

                <Heading size={3}>
                    New Components
                </Heading>
                <List>
                    <List.Item>DataTable component for displaying tabular data</List.Item>
                    <List.Item>Modal component with backdrop and animations</List.Item>
                    <List.Item>Toast notification system</List.Item>
                    <List.Item>Progress bar component</List.Item>
                </List>

                <Heading size={3}>
                    Improvements
                </Heading>
                <List>
                    <List.Item>Fixed accessibility issues in form components</List.Item>
                    <List.Item>Improved performance of list rendering</List.Item>
                    <List.Item>Updated documentation with new examples</List.Item>
                    <List.Item>Enhanced TypeScript type definitions</List.Item>
                </List>
            </ContentDecorator>
        ),
    },
    parameters: {
        docs: {
            description: {
                story: 'Minor release example with new features and improvements.',
            },
        },
    },
};

// Patch release
export const PatchRelease: Story = {
    args: {
        date: '2024-11-08',
        version: 'v1.4.3',
        children: (
            <ContentDecorator>
                <Heading size={2}>
                    Patch Release - v1.4.3
                </Heading>
                <Text>
                    This patch release focuses on bug fixes and security updates to ensure 
                    stability and security.
                </Text>

                <Heading size={3}>
                    Bug Fixes
                </Heading>
                <List>
                    <List.Item>Fixed issue with button hover states in Safari</List.Item>
                    <List.Item>Resolved memory leak in dropdown components</List.Item>
                    <List.Item>Fixed alignment issues in grid layouts</List.Item>
                    <List.Item>Corrected typography scaling on mobile devices</List.Item>
                </List>

                <Heading size={3}>
                    Security Updates
                </Heading>
                <List>
                    <List.Item>Updated dependencies to patch known vulnerabilities</List.Item>
                    <List.Item>Enhanced input validation for form components</List.Item>
                </List>
            </ContentDecorator>
        ),
    },
    parameters: {
        docs: {
            description: {
                story: 'Patch release example focusing on bug fixes and security updates.',
            },
        },
    },
};

// Beta release
export const BetaRelease: Story = {
    args: {
        date: '2024-11-20',
        version: 'v2.0.0-beta.1',
        children: (
            <ContentDecorator>
                <Image
                    src="https://placehold.co/600x300?text=Beta+Release+Screenshot"
                    alt="Beta release screenshot"
                />
                <Heading size={2}>
                    Beta Release - v2.0.0-beta.1
                </Heading>
                <Text>
                    This beta release introduces experimental features and improvements. 
                    We're seeking community feedback to refine these features before the final release.
                </Text>

                <Heading size={3}>
                    Experimental Features
                </Heading>
                <List>
                    <List.Item>New animation system with Framer Motion integration</List.Item>
                    <List.Item>Advanced theming with CSS custom properties</List.Item>
                    <List.Item>Component composition patterns</List.Item>
                    <List.Item>Real-time collaboration features</List.Item>
                </List>

                <Heading size={3}>
                    Known Issues
                </Heading>
                <List>
                    <List.Item>Animation performance may vary on older devices</List.Item>
                    <List.Item>Some components may have inconsistent styling</List.Item>
                    <List.Item>Documentation is still being updated</List.Item>
                </List>

                <Text>
                    <strong>Note:</strong> This is a beta release intended for testing and feedback. 
                    Please report any issues you encounter.
                </Text>
            </ContentDecorator>
        ),
    },
    parameters: {
        docs: {
            description: {
                story: 'Beta release example with experimental features and known issues.',
            },
        },
    },
};

// Multiple updates
export const MultipleUpdates: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', alignItems: 'stretch' }}>
            <Update date="2024-12-01" version="v2.0.0">
                <ContentDecorator>
                    <Image
                        src="https://placehold.co/600x300?text=Major+Release+v2.0.0"
                        alt="Major release screenshot"
                    />
                    <Heading size={2}>Major Release - v2.0.0</Heading>
                    <Text>
                        A complete redesign with new components, improved performance, and enhanced accessibility.
                    </Text>
                    <Heading size={3}>Highlights</Heading>
                    <List>
                        <List.Item>Complete UI redesign with modern aesthetics</List.Item>
                        <List.Item>New component library with 50+ components</List.Item>
                        <List.Item>Performance improvements up to 40% faster</List.Item>
                        <List.Item>Enhanced accessibility with WCAG 2.1 compliance</List.Item>
                    </List>
                </ContentDecorator>
            </Update>

            <Update date="2024-11-15" version="v1.5.0">
                <ContentDecorator>
                    <Image
                        src="https://placehold.co/600x300?text=Minor+Release+v1.5.0"
                        alt="Minor release screenshot"
                    />
                    <Heading size={2}>Minor Release - v1.5.0</Heading>
                    <Text>
                        Added new components and various improvements to existing functionality.
                    </Text>
                    <Heading size={3}>New Components</Heading>
                    <List>
                        <List.Item>DataTable component for displaying tabular data</List.Item>
                        <List.Item>Modal component with backdrop and animations</List.Item>
                        <List.Item>Toast notification system</List.Item>
                    </List>
                </ContentDecorator>
            </Update>

            <Update date="2024-11-08" version="v1.4.3">
                <ContentDecorator>
                    <Heading size={2}>Patch Release - v1.4.3</Heading>
                    <Text>
                        Focused on bug fixes and security updates to ensure stability.
                    </Text>
                    <Heading size={3}>Bug Fixes</Heading>
                    <List>
                        <List.Item>Fixed issue with button hover states in Safari</List.Item>
                        <List.Item>Resolved memory leak in dropdown components</List.Item>
                        <List.Item>Fixed alignment issues in grid layouts</List.Item>
                    </List>
                </ContentDecorator>
            </Update>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows multiple updates in a changelog format, demonstrating how the Update component can be used to create a complete release history.',
            },
        },
    },
};

// Real-world example
export const RealWorldExample: Story = {
    render: () => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <div style={{ 
                background: 'var(--xyd-bgcolor)',
                border: '1px solid var(--xyd-border-color)',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px'
            }}>
                <h2 style={{ marginBottom: '16px' }}>Product Changelog</h2>
                <p style={{ marginBottom: '16px', color: 'var(--xyd-text-color)' }}>
                    Track the evolution of our product with detailed release notes and feature updates.
                </p>
            </div>

            <Update date="2024-12-01" version="v2.0.0">
                <ContentDecorator>
                    <Image
                        src="https://placehold.co/600x300?text=Product+Redesign"
                        alt="Product redesign screenshot"
                    />
                    <Heading size={2}>🎉 Major Release - v2.0.0</Heading>
                    <Text>
                        We're excited to announce our biggest release yet! This version brings a complete 
                        redesign, new features, and significant performance improvements.
                    </Text>

                    <Heading size={3}>✨ What's New</Heading>
                    <List>
                        <List.Item>Complete UI redesign with modern, clean aesthetics</List.Item>
                        <List.Item>New dashboard with customizable widgets</List.Item>
                        <List.Item>Advanced analytics with real-time data visualization</List.Item>
                        <List.Item>Enhanced collaboration features with real-time editing</List.Item>
                        <List.Item>Mobile app for iOS and Android</List.Item>
                    </List>

                    <Heading size={3}>🚀 Performance Improvements</Heading>
                    <List>
                        <List.Item>40% faster page load times</List.Item>
                        <List.Item>Reduced memory usage by 30%</List.Item>
                        <List.Item>Improved search functionality with instant results</List.Item>
                    </List>

                    <Heading size={3}>🔧 Breaking Changes</Heading>
                    <Text>
                        This release includes some breaking changes. Please review our 
                        <a href="#migration-guide" style={{ color: 'var(--xyd-link-color)' }}> migration guide</a> 
                        before updating.
                    </Text>
                </ContentDecorator>
            </Update>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how the Update component is typically used in real applications for product changelogs and release notes.',
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
                <h3 style={{ marginBottom: '16px' }}>Update Component Demo</h3>
                <p style={{ marginBottom: '16px', color: 'var(--xyd-text-color)' }}>
                    This example demonstrates the Update component with various content types and use cases.
                </p>
                
                <Update date="2024-11-20" version="v1.6.0">
                    <ContentDecorator>
                        <Heading size={2}>Component Improvements</Heading>
                        <Text>
                            This release focuses on improving existing components and adding better documentation.
                        </Text>
                        <Heading size={3}>Improvements</Heading>
                        <List>
                            <List.Item>Enhanced accessibility for all form components</List.Item>
                            <List.Item>Better TypeScript support with improved type definitions</List.Item>
                            <List.Item>Updated documentation with comprehensive examples</List.Item>
                            <List.Item>Improved error handling and validation</List.Item>
                        </List>
                    </ContentDecorator>
                </Update>
            </div>

            <div style={{ 
                background: 'var(--xyd-bgcolor)',
                border: '1px solid var(--xyd-border-color)',
                borderRadius: '8px',
                padding: '20px'
            }}>
                <h4 style={{ marginBottom: '12px' }}>Usage Guidelines</h4>
                <ul style={{ color: 'var(--xyd-text-color)' }}>
                    <li>Use semantic versioning for version numbers (e.g., v1.2.3)</li>
                    <li>Include the release date in YYYY-MM-DD format</li>
                    <li>Provide a concise list of key features or changes</li>
                    <li>Use rich content to explain changes in detail</li>
                    <li>Include screenshots or demos for visual changes</li>
                    <li>Document breaking changes clearly</li>
                    <li>Consider using emojis for visual appeal</li>
                </ul>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This interactive example demonstrates the Update component functionality and usage guidelines.',
            },
        },
    },
};


