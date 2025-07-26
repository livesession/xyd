import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { IconSocial } from '@xyd-js/components/writer';

const meta: Meta<typeof IconSocial> = {
    title: 'Components/Writer/IconSocial',
    component: IconSocial,
    parameters: {
        docs: {
            description: {
                component: 'IconSocial component provides social media icons for various platforms. Each icon is optimized for consistent styling and accessibility.',
            },
        },
    },
    argTypes: {
        kind: {
            description: 'The social media platform for the icon',
            control: { type: 'select' },
            options: [
                'x', 'facebook', 'youtube', 'discord', 'slack', 'github', 
                'linkedin', 'instagram', 'hackernews', 'medium', 'telegram', 
                'bluesky', 'reddit'
            ],
        },
        width: {
            description: 'Width of the icon',
            control: 'number',
        },
        height: {
            description: 'Height of the icon',
            control: 'number',
        },
        style: {
            description: 'Additional CSS styles',
            control: 'object',
        },
    },
};

export default meta;
type Story = StoryObj<typeof IconSocial>;

// Individual social icons
export const Twitter: Story = {
    args: {
        kind: 'x',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <IconSocial {...args} />
        </div>
    ),
};

export const Facebook: Story = {
    args: {
        kind: 'facebook',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <IconSocial {...args} />
        </div>
    ),
};

export const YouTube: Story = {
    args: {
        kind: 'youtube',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <IconSocial {...args} />
        </div>
    ),
};

export const Discord: Story = {
    args: {
        kind: 'discord',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <IconSocial {...args} />
        </div>
    ),
};

export const Slack: Story = {
    args: {
        kind: 'slack',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <IconSocial {...args} />
        </div>
    ),
};

export const GitHub: Story = {
    args: {
        kind: 'github',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <IconSocial {...args} />
        </div>
    ),
};

export const LinkedIn: Story = {
    args: {
        kind: 'linkedin',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <IconSocial {...args} />
        </div>
    ),
};

export const Instagram: Story = {
    args: {
        kind: 'instagram',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <IconSocial {...args} />
        </div>
    ),
};

export const HackerNews: Story = {
    args: {
        kind: 'hackernews',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <IconSocial {...args} />
        </div>
    ),
};

export const Medium: Story = {
    args: {
        kind: 'medium',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <IconSocial {...args} />
        </div>
    ),
};

export const Telegram: Story = {
    args: {
        kind: 'telegram',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <IconSocial {...args} />
        </div>
    ),
};

export const Bluesky: Story = {
    args: {
        kind: 'bluesky',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <IconSocial {...args} />
        </div>
    ),
};

export const Reddit: Story = {
    args: {
        kind: 'reddit',
    },
    render: (args) => (
        <div style={{ padding: '20px' }}>
            <IconSocial {...args} />
        </div>
    ),
};

// All social icons
export const AllSocialIcons: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                gap: '20px',
                maxWidth: '800px'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <IconSocial kind="x" />
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>Twitter/X</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <IconSocial kind="facebook" />
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>Facebook</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <IconSocial kind="youtube" />
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>YouTube</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <IconSocial kind="discord" />
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>Discord</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <IconSocial kind="slack" />
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>Slack</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <IconSocial kind="github" />
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>GitHub</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <IconSocial kind="linkedin" />
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>LinkedIn</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <IconSocial kind="instagram" />
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>Instagram</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <IconSocial kind="hackernews" />
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>Hacker News</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <IconSocial kind="medium" />
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>Medium</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <IconSocial kind="telegram" />
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>Telegram</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <IconSocial kind="bluesky" />
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>Bluesky</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <IconSocial kind="reddit" />
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>Reddit</div>
                </div>
            </div>
        </div>
    ),
};

// Different sizes
export const DifferentSizes: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Small Icons (16px)</h3>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <IconSocial kind="github" width={16} height={16} />
                    <IconSocial kind="x" width={16} height={16} />
                    <IconSocial kind="linkedin" width={16} height={16} />
                    <IconSocial kind="discord" width={16} height={16} />
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Medium Icons (24px)</h3>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <IconSocial kind="github" width={24} height={24} />
                    <IconSocial kind="x" width={24} height={24} />
                    <IconSocial kind="linkedin" width={24} height={24} />
                    <IconSocial kind="discord" width={24} height={24} />
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Large Icons (32px)</h3>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <IconSocial kind="github" width={32} height={32} />
                    <IconSocial kind="x" width={32} height={32} />
                    <IconSocial kind="linkedin" width={32} height={32} />
                    <IconSocial kind="discord" width={32} height={32} />
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Extra Large Icons (48px)</h3>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <IconSocial kind="github" width={48} height={48} />
                    <IconSocial kind="x" width={48} height={48} />
                    <IconSocial kind="linkedin" width={48} height={48} />
                    <IconSocial kind="discord" width={48} height={48} />
                </div>
            </div>
        </div>
    ),
};

// Social media links
export const SocialMediaLinks: Story = {
    render: () => (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Footer Social Links</h3>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>© 2024 Documentation</span>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <a href="#" style={{ color: 'var(--xyd-text-color)' }}>
                                <IconSocial kind="github" />
                            </a>
                            <a href="#" style={{ color: 'var(--xyd-text-color)' }}>
                                <IconSocial kind="x" />
                            </a>
                            <a href="#" style={{ color: 'var(--xyd-text-color)' }}>
                                <IconSocial kind="discord" />
                            </a>
                            <a href="#" style={{ color: 'var(--xyd-text-color)' }}>
                                <IconSocial kind="linkedin" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px', color: '#666' }}>Share Buttons</h3>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h4 style={{ marginBottom: '16px' }}>Share this page</h4>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '4px',
                            color: 'var(--xyd-text-color)'
                        }}>
                            <IconSocial kind="x" />
                        </button>
                        <button style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '4px',
                            color: 'var(--xyd-text-color)'
                        }}>
                            <IconSocial kind="facebook" />
                        </button>
                        <button style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '4px',
                            color: 'var(--xyd-text-color)'
                        }}>
                            <IconSocial kind="linkedin" />
                        </button>
                        <button style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '4px',
                            color: 'var(--xyd-text-color)'
                        }}>
                            <IconSocial kind="reddit" />
                        </button>
                    </div>
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
                <h2>Documentation Footer</h2>
                <p>Social media icons are commonly used in documentation site footers.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}>
                        <div>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Documentation</div>
                            <div style={{ fontSize: '14px', color: 'var(--xyd-text-color-secondary)' }}>
                                Built with ❤️ by the community
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <a href="#" style={{ color: 'var(--xyd-text-color)' }}>
                                <IconSocial kind="github" />
                            </a>
                            <a href="#" style={{ color: 'var(--xyd-text-color)' }}>
                                <IconSocial kind="discord" />
                            </a>
                            <a href="#" style={{ color: 'var(--xyd-text-color)' }}>
                                <IconSocial kind="x" />
                            </a>
                            <a href="#" style={{ color: 'var(--xyd-text-color)' }}>
                                <IconSocial kind="youtube" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>Community Links</h2>
                <p>Social icons for community engagement and support.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h3 style={{ marginBottom: '16px' }}>Join Our Community</h3>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <a href="#" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            color: 'var(--xyd-text-color)',
                            textDecoration: 'none',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid var(--xyd-border-color)'
                        }}>
                            <IconSocial kind="discord" />
                            <span>Discord</span>
                        </a>
                        <a href="#" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            color: 'var(--xyd-text-color)',
                            textDecoration: 'none',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid var(--xyd-border-color)'
                        }}>
                            <IconSocial kind="slack" />
                            <span>Slack</span>
                        </a>
                        <a href="#" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            color: 'var(--xyd-text-color)',
                            textDecoration: 'none',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid var(--xyd-border-color)'
                        }}>
                            <IconSocial kind="github" />
                            <span>GitHub</span>
                        </a>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>Social Media Feed</h2>
                <p>Social icons in a content feed or news section.</p>
                <div style={{ 
                    background: 'var(--xyd-bgcolor)',
                    border: '1px solid var(--xyd-border-color)',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h3 style={{ marginBottom: '16px' }}>Latest Updates</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <IconSocial kind="x" />
                            <div>
                                <div style={{ fontWeight: 'bold' }}>New feature released!</div>
                                <div style={{ fontSize: '14px', color: 'var(--xyd-text-color-secondary)' }}>
                                    Check out our latest updates on Twitter
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <IconSocial kind="youtube" />
                            <div>
                                <div style={{ fontWeight: 'bold' }}>Video tutorial available</div>
                                <div style={{ fontSize: '14px', color: 'var(--xyd-text-color-secondary)' }}>
                                    Watch our latest tutorial on YouTube
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <IconSocial kind="medium" />
                            <div>
                                <div style={{ fontWeight: 'bold' }}>Blog post published</div>
                                <div style={{ fontSize: '14px', color: 'var(--xyd-text-color-secondary)' }}>
                                    Read our latest insights on Medium
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This example shows how social media icons are typically used in real applications.',
            },
        },
    },
};

// Interactive example
export const Interactive: Story = {
    args: {
        kind: 'github',
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
                <h3 style={{ marginBottom: '16px' }}>Social Icon Demo</h3>
                <p style={{ marginBottom: '16px', color: 'var(--xyd-text-color)' }}>
                    This example demonstrates the IconSocial component with different platforms and sizes.
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <IconSocial {...args} />
                    <IconSocial kind="x" />
                    <IconSocial kind="linkedin" />
                    <IconSocial kind="discord" />
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
                    <li>Consistent styling across all platforms</li>
                    <li>Scalable vector graphics</li>
                    <li>Accessible design</li>
                    <li>Theme-aware colors</li>
                    <li>Customizable size and styling</li>
                </ul>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'This interactive example demonstrates the IconSocial component functionality and styling.',
            },
        },
    },
}; 