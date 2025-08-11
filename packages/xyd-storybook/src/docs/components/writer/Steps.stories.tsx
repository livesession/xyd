import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Steps } from '@xyd-js/components/writer';

const meta: Meta<typeof Steps> = {
    title: 'Components/Writer/Steps',
    component: Steps,
    parameters: {
        docs: {
            description: {
                component: 'Steps component provides a sequential step-by-step interface for guiding users through processes, tutorials, or workflows.',
            },
        },
    },
    argTypes: {
        children: {
            description: 'The step items to display',
            control: false,
        },
    },
};

export default meta;
type Story = StoryObj<typeof Steps>;

// Basic steps
export const Default: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <Steps>
                <Steps.Item>
                    First, you need to install the package.
                </Steps.Item>
                <Steps.Item>
                    Then you need to import the component.
                </Steps.Item>
                <Steps.Item>
                    Finally, you can use it in your application.
                </Steps.Item>
            </Steps>
        </div>
    ),
};

// Multiple steps
export const MultipleSteps: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <Steps>
                <Steps.Item>
                    Download the project files from the repository.
                </Steps.Item>
                <Steps.Item>
                    Install dependencies using npm or yarn.
                </Steps.Item>
                <Steps.Item>
                    Configure your environment variables.
                </Steps.Item>
                <Steps.Item>
                    Run the development server.
                </Steps.Item>
                <Steps.Item>
                    Open your browser and navigate to localhost:3000.
                </Steps.Item>
                <Steps.Item>
                    Start building your application!
                </Steps.Item>
            </Steps>
        </div>
    ),
};

// Long content steps
export const LongContent: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <Steps>
                <Steps.Item>
                    <div>
                        <h4 style={{ marginBottom: '8px' }}>Project Setup</h4>
                        <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                            Begin by creating a new project directory and initializing your development 
                            environment. This includes setting up your package manager, version control, 
                            and basic project structure.
                        </p>
                    </div>
                </Steps.Item>
                <Steps.Item>
                    <div>
                        <h4 style={{ marginBottom: '8px' }}>Install Dependencies</h4>
                        <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                            Install all required dependencies including React, TypeScript, and any 
                            additional libraries your project requires. Make sure to use the correct 
                            versions for compatibility.
                        </p>
                    </div>
                </Steps.Item>
                <Steps.Item>
                    <div>
                        <h4 style={{ marginBottom: '8px' }}>Configuration</h4>
                        <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                            Configure your build tools, linting rules, and development environment. 
                            This includes setting up TypeScript configuration, ESLint rules, and 
                            any other development tools.
                        </p>
                    </div>
                </Steps.Item>
                <Steps.Item>
                    <div>
                        <h4 style={{ marginBottom: '8px' }}>Development</h4>
                        <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                            Start developing your application with hot reloading enabled. Make sure 
                            to follow best practices and write clean, maintainable code.
                        </p>
                    </div>
                </Steps.Item>
            </Steps>
        </div>
    ),
};

// Steps with code examples
export const WithCodeExamples: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <Steps>
                <Steps.Item>
                    <div>
                        <h4 style={{ marginBottom: '8px' }}>Install Package</h4>
                        <p style={{ marginBottom: '8px', color: 'var(--xyd-text-color-secondary)' }}>
                            Install the component library using npm:
                        </p>
                        <pre style={{ 
                            background: 'var(--xyd-bgcolor-secondary)', 
                            padding: '12px', 
                            borderRadius: '4px',
                            margin: 0,
                            fontSize: '14px'
                        }}>
                            <code>npm install @xyd-js/components</code>
                        </pre>
                    </div>
                </Steps.Item>
                <Steps.Item>
                    <div>
                        <h4 style={{ marginBottom: '8px' }}>Import Component</h4>
                        <p style={{ marginBottom: '8px', color: 'var(--xyd-text-color-secondary)' }}>
                            Import the component in your file:
                        </p>
                        <pre style={{ 
                            background: 'var(--xyd-bgcolor-secondary)', 
                            padding: '12px', 
                            borderRadius: '4px',
                            margin: 0,
                            fontSize: '14px'
                        }}>
                            <code>{`import { Button } from '@xyd-js/components/writer';`}</code>
                        </pre>
                    </div>
                </Steps.Item>
                <Steps.Item>
                    <div>
                        <h4 style={{ marginBottom: '8px' }}>Use Component</h4>
                        <p style={{ marginBottom: '8px', color: 'var(--xyd-text-color-secondary)' }}>
                            Use the component in your JSX:
                        </p>
                        <pre style={{ 
                            background: 'var(--xyd-bgcolor-secondary)', 
                            padding: '12px', 
                            borderRadius: '4px',
                            margin: 0,
                            fontSize: '14px'
                        }}>
                            <code>{`<Button kind="primary">Click me</Button>`}</code>
                        </pre>
                    </div>
                </Steps.Item>
            </Steps>
        </div>
    ),
};

// Real-world examples
export const RealWorldExamples: Story = {
    render: () => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h2>Onboarding Process</h2>
                <p>Steps components are perfect for user onboarding and getting started guides.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h3 style={{ marginBottom: '16px' }}>Welcome to Our Platform</h3>
                    <Steps>
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Create Account</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    Sign up with your email address and create a secure password.
                                </p>
                            </div>
                        </Steps.Item>
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Verify Email</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    Check your email and click the verification link to activate your account.
                                </p>
                            </div>
                        </Steps.Item>
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Complete Profile</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    Add your personal information and preferences to customize your experience.
                                </p>
                            </div>
                        </Steps.Item>
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Start Exploring</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    You're all set! Start exploring our features and tools.
                                </p>
                            </div>
                        </Steps.Item>
                    </Steps>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>API Integration Guide</h2>
                <p>Steps can guide developers through technical processes and integrations.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h3 style={{ marginBottom: '16px' }}>Integrate Our API</h3>
                    <Steps>
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Get API Key</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    Generate your API key from the dashboard under Settings &gt; API Keys.
                                </p>
                            </div>
                        </Steps.Item>
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Install SDK</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    Install our official SDK using your preferred package manager.
                                </p>
                            </div>
                        </Steps.Item>
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Initialize Client</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    Initialize the API client with your API key and configuration.
                                </p>
                            </div>
                        </Steps.Item>
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Make First Request</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    Test your integration by making a simple API request.
                                </p>
                            </div>
                        </Steps.Item>
                    </Steps>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>Troubleshooting Guide</h2>
                <p>Steps can help users troubleshoot issues step by step.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h3 style={{ marginBottom: '16px' }}>Fix Connection Issues</h3>
                    <Steps>
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Check Network</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    Verify your internet connection and try accessing other websites.
                                </p>
                            </div>
                        </Steps.Item>
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Clear Cache</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    Clear your browser cache and cookies, then refresh the page.
                                </p>
                            </div>
                        </Steps.Item>
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Check Firewall</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    Ensure your firewall isn't blocking the application.
                                </p>
                            </div>
                        </Steps.Item>
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Contact Support</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    If the issue persists, contact our support team with details.
                                </p>
                            </div>
                        </Steps.Item>
                    </Steps>
                </div>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how Steps components are typically used in real applications.',
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
                <h3 style={{ marginBottom: '16px' }}>Steps Component Demo</h3>
                <p style={{ marginBottom: '16px', color: 'var(--xyd-text-color)' }}>
                    This example demonstrates the Steps component with various content types and styling.
                </p>
                <Steps>
                    <Steps.Item>
                        <div>
                            <h4 style={{ marginBottom: '8px' }}>Step One</h4>
                            <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                This is the first step in the process with detailed instructions.
                            </p>
                        </div>
                    </Steps.Item>
                    <Steps.Item>
                        <div>
                            <h4 style={{ marginBottom: '8px' }}>Step Two</h4>
                            <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                The second step continues the process with additional guidance.
                            </p>
                        </div>
                    </Steps.Item>
                    <Steps.Item>
                        <div>
                            <h4 style={{ marginBottom: '8px' }}>Step Three</h4>
                            <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                The final step completes the process and provides next steps.
                            </p>
                        </div>
                    </Steps.Item>
                </Steps>
            </div>

            <div style={{ 
                background: 'var(--xyd-bgcolor)',
                border: '1px solid var(--xyd-border-color)',
                borderRadius: '8px',
                padding: '20px'
            }}>
                <h4 style={{ marginBottom: '12px' }}>Features</h4>
                <ul style={{ color: 'var(--xyd-text-color)' }}>
                    <li>Sequential step display</li>
                    <li>Support for rich content</li>
                    <li>Consistent styling</li>
                    <li>Accessible markup</li>
                    <li>Theme-aware colors</li>
                </ul>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This interactive example demonstrates the Steps component functionality and styling.',
            },
        },
    },
};

// Different step counts
export const DifferentStepCounts: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Two Steps</h3>
                <Steps>
                    <Steps.Item>First step</Steps.Item>
                    <Steps.Item>Second step</Steps.Item>
                </Steps>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Three Steps</h3>
                <Steps>
                    <Steps.Item>Step one</Steps.Item>
                    <Steps.Item>Step two</Steps.Item>
                    <Steps.Item>Step three</Steps.Item>
                </Steps>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Four Steps</h3>
                <Steps>
                    <Steps.Item>Initial setup</Steps.Item>
                    <Steps.Item>Configuration</Steps.Item>
                    <Steps.Item>Testing</Steps.Item>
                    <Steps.Item>Deployment</Steps.Item>
                </Steps>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Five Steps</h3>
                <Steps>
                    <Steps.Item>Planning</Steps.Item>
                    <Steps.Item>Design</Steps.Item>
                    <Steps.Item>Development</Steps.Item>
                    <Steps.Item>Testing</Steps.Item>
                    <Steps.Item>Launch</Steps.Item>
                </Steps>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how Steps components look with different numbers of steps.',
            },
        },
    },
};

// Secondary kind - basic
export const Secondary: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <Steps kind="secondary">
                <Steps.Item>
                    First, you need to install the package.
                </Steps.Item>
                <Steps.Item>
                    Then you need to import the component.
                </Steps.Item>
                <Steps.Item>
                    Finally, you can use it in your application.
                </Steps.Item>
            </Steps>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Secondary Steps variant with connecting lines between steps.',
            },
        },
    },
};

// Secondary kind - multiple steps
export const SecondaryMultipleSteps: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <Steps kind="secondary">
                <Steps.Item>
                    Download the project files from the repository.
                </Steps.Item>
                <Steps.Item>
                    Install dependencies using npm or yarn.
                </Steps.Item>
                <Steps.Item>
                    Configure your environment variables.
                </Steps.Item>
                <Steps.Item>
                    Run the development server.
                </Steps.Item>
                <Steps.Item>
                    Open your browser and navigate to localhost:3000.
                </Steps.Item>
                <Steps.Item>
                    Start building your application!
                </Steps.Item>
            </Steps>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Secondary Steps variant with multiple steps showing the connecting line effect.',
            },
        },
    },
};

// Secondary kind - long content
export const SecondaryLongContent: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <Steps kind="secondary">
                <Steps.Item>
                    <div>
                        <h4 style={{ marginBottom: '8px' }}>Project Setup</h4>
                        <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                            Begin by creating a new project directory and initializing your development 
                            environment. This includes setting up your package manager, version control, 
                            and basic project structure.
                        </p>
                    </div>
                </Steps.Item>
                <Steps.Item>
                    <div>
                        <h4 style={{ marginBottom: '8px' }}>Install Dependencies</h4>
                        <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                            Install all required dependencies including React, TypeScript, and any 
                            additional libraries your project requires. Make sure to use the correct 
                            versions for compatibility.
                        </p>
                    </div>
                </Steps.Item>
                <Steps.Item>
                    <div>
                        <h4 style={{ marginBottom: '8px' }}>Configuration</h4>
                        <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                            Configure your build tools, linting rules, and development environment. 
                            This includes setting up TypeScript configuration, ESLint rules, and 
                            any other development tools.
                        </p>
                    </div>
                </Steps.Item>
                <Steps.Item>
                    <div>
                        <h4 style={{ marginBottom: '8px' }}>Development</h4>
                        <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                            Start developing your application with hot reloading enabled. Make sure 
                            to follow best practices and write clean, maintainable code.
                        </p>
                    </div>
                </Steps.Item>
            </Steps>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Secondary Steps variant with detailed content showing how the connecting lines work with longer content.',
            },
        },
    },
};

// Secondary kind - with code examples
export const SecondaryWithCodeExamples: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <Steps kind="secondary">
                <Steps.Item>
                    <div>
                        <h4 style={{ marginBottom: '8px' }}>Install Package</h4>
                        <p style={{ marginBottom: '8px', color: 'var(--xyd-text-color-secondary)' }}>
                            Install the component library using npm:
                        </p>
                        <pre style={{ 
                            background: 'var(--xyd-bgcolor-secondary)', 
                            padding: '12px', 
                            borderRadius: '4px',
                            margin: 0,
                            fontSize: '14px'
                        }}>
                            <code>npm install @xyd-js/components</code>
                        </pre>
                    </div>
                </Steps.Item>
                <Steps.Item>
                    <div>
                        <h4 style={{ marginBottom: '8px' }}>Import Component</h4>
                        <p style={{ marginBottom: '8px', color: 'var(--xyd-text-color-secondary)' }}>
                            Import the component in your file:
                        </p>
                        <pre style={{ 
                            background: 'var(--xyd-bgcolor-secondary)', 
                            padding: '12px', 
                            borderRadius: '4px',
                            margin: 0,
                            fontSize: '14px'
                        }}>
                            <code>{`import { Button } from '@xyd-js/components/writer';`}</code>
                        </pre>
                    </div>
                </Steps.Item>
                <Steps.Item>
                    <div>
                        <h4 style={{ marginBottom: '8px' }}>Use Component</h4>
                        <p style={{ marginBottom: '8px', color: 'var(--xyd-text-color-secondary)' }}>
                            Use the component in your JSX:
                        </p>
                        <pre style={{ 
                            background: 'var(--xyd-bgcolor-secondary)', 
                            padding: '12px', 
                            borderRadius: '4px',
                            margin: 0,
                            fontSize: '14px'
                        }}>
                            <code>{`<Button kind="primary">Click me</Button>`}</code>
                        </pre>
                    </div>
                </Steps.Item>
            </Steps>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Secondary Steps variant with code examples showing technical implementation steps.',
            },
        },
    },
};

// Secondary kind - real-world examples
export const SecondaryRealWorldExamples: Story = {
    render: () => (
        <div style={{ padding: '20px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h2>Development Workflow</h2>
                <p>Secondary Steps are perfect for development workflows and technical processes.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h3 style={{ marginBottom: '16px' }}>Git Workflow</h3>
                    <Steps kind="secondary">
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Create Feature Branch</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    Create a new branch for your feature: <code>git checkout -b feature/new-component</code>
                                </p>
                            </div>
                        </Steps.Item>
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Make Changes</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    Implement your changes and test thoroughly before committing.
                                </p>
                            </div>
                        </Steps.Item>
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Commit Changes</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    Stage and commit your changes with a descriptive message.
                                </p>
                            </div>
                        </Steps.Item>
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Push and Create PR</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    Push your branch and create a pull request for review.
                                </p>
                            </div>
                        </Steps.Item>
                    </Steps>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>Deployment Process</h2>
                <p>Secondary Steps can guide through deployment and release processes.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h3 style={{ marginBottom: '16px' }}>Production Deployment</h3>
                    <Steps kind="secondary">
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Build Application</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    Run the build command to create optimized production files.
                                </p>
                            </div>
                        </Steps.Item>
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Run Tests</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    Execute all tests to ensure code quality and functionality.
                                </p>
                            </div>
                        </Steps.Item>
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Deploy to Staging</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    Deploy to staging environment for final testing and validation.
                                </p>
                            </div>
                        </Steps.Item>
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Deploy to Production</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    Deploy to production environment and monitor for issues.
                                </p>
                            </div>
                        </Steps.Item>
                    </Steps>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>User Onboarding</h2>
                <p>Secondary Steps work well for user onboarding with connecting visual flow.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h3 style={{ marginBottom: '16px' }}>Account Setup</h3>
                    <Steps kind="secondary">
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Sign Up</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    Create your account with email and password.
                                </p>
                            </div>
                        </Steps.Item>
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Verify Email</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    Check your email and click the verification link.
                                </p>
                            </div>
                        </Steps.Item>
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Complete Profile</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    Add your personal information and preferences.
                                </p>
                            </div>
                        </Steps.Item>
                        <Steps.Item>
                            <div>
                                <h4 style={{ marginBottom: '8px' }}>Start Using</h4>
                                <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                    You're all set! Start exploring our features.
                                </p>
                            </div>
                        </Steps.Item>
                    </Steps>
                </div>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how Secondary Steps components are typically used in real applications with connecting lines.',
            },
        },
    },
};

// Secondary kind - interactive example
export const SecondaryInteractive: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ 
                background: 'var(--xyd-bgcolor)',
                border: '1px solid var(--xyd-border-color)',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px'
            }}>
                <h3 style={{ marginBottom: '16px' }}>Secondary Steps Component Demo</h3>
                <p style={{ marginBottom: '16px', color: 'var(--xyd-text-color)' }}>
                    This example demonstrates the Secondary Steps component with connecting lines between steps.
                </p>
                <Steps kind="secondary">
                    <Steps.Item>
                        <div>
                            <h4 style={{ marginBottom: '8px' }}>Step One</h4>
                            <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                This is the first step in the process with detailed instructions.
                            </p>
                        </div>
                    </Steps.Item>
                    <Steps.Item>
                        <div>
                            <h4 style={{ marginBottom: '8px' }}>Step Two</h4>
                            <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                The second step continues the process with additional guidance.
                            </p>
                        </div>
                    </Steps.Item>
                    <Steps.Item>
                        <div>
                            <h4 style={{ marginBottom: '8px' }}>Step Three</h4>
                            <p style={{ margin: 0, color: 'var(--xyd-text-color-secondary)' }}>
                                The final step completes the process and provides next steps.
                            </p>
                        </div>
                    </Steps.Item>
                </Steps>
            </div>

            <div style={{ 
                background: 'var(--xyd-bgcolor)',
                border: '1px solid var(--xyd-border-color)',
                borderRadius: '8px',
                padding: '20px'
            }}>
                <h4 style={{ marginBottom: '12px' }}>Secondary Features</h4>
                <ul style={{ color: 'var(--xyd-text-color)' }}>
                    <li>Connecting lines between steps</li>
                    <li>Enhanced visual flow</li>
                    <li>Support for rich content</li>
                    <li>Consistent styling</li>
                    <li>Theme-aware colors</li>
                </ul>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This interactive example demonstrates the Secondary Steps component functionality with connecting lines.',
            },
        },
    },
};

// Comparison between primary and secondary
export const PrimaryVsSecondary: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ marginBottom: '16px', color: '#666' }}>Primary Steps (Default)</h3>
                <Steps>
                    <Steps.Item>First step</Steps.Item>
                    <Steps.Item>Second step</Steps.Item>
                    <Steps.Item>Third step</Steps.Item>
                </Steps>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ marginBottom: '16px', color: '#666' }}>Secondary Steps (With Connecting Lines)</h3>
                <Steps kind="secondary">
                    <Steps.Item>First step</Steps.Item>
                    <Steps.Item>Second step</Steps.Item>
                    <Steps.Item>Third step</Steps.Item>
                </Steps>
            </div>

            <div style={{ 
                background: 'var(--xyd-bgcolor)',
                border: '1px solid var(--xyd-border-color)',
                borderRadius: '8px',
                padding: '20px'
            }}>
                <h4 style={{ marginBottom: '12px' }}>Key Differences</h4>
                <ul style={{ color: 'var(--xyd-text-color)' }}>
                    <li><strong>Primary:</strong> Simple numbered steps without connecting lines</li>
                    <li><strong>Secondary:</strong> Steps with connecting lines showing visual flow</li>
                    <li><strong>Use Primary:</strong> For simple step lists and basic instructions</li>
                    <li><strong>Use Secondary:</strong> For workflows, processes, and guided tours</li>
                </ul>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example compares the primary and secondary variants of the Steps component.',
            },
        },
    },
};
