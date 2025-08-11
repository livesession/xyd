import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { PageFirstSlide } from '@xyd-js/components/pages';
import { CodeSample } from '@xyd-js/components/coder';

import syntaxHighlight from '@xyd-js/components/coder/themes/classic';
import '@xyd-js/components/coder/themes/classic.css'

import { DocsTemplateDecorator } from '../../../decorators/DocsTemplate';

// storybook-root
const meta: Meta<typeof PageFirstSlide> = {
    title: 'Components/Pages/PageFirstSlide',
    component: PageFirstSlide,
    decorators: [
        DocsTemplateDecorator({
            toc: false
        }),
        (Story) => <>
            <style dangerouslySetInnerHTML={{
                __html: `
                    #storybook-root {
                        height: 100%;
                    }
                `
            }} />
            <Story />
        </>,
    ],
    parameters: {
        docs: {
            description: {
                component: 'PageFirstSlide component creates a two-column layout with headings and buttons on the left, and image/logo/codeblocks on the right. Perfect for landing pages, product introductions, and feature showcases.',
            },
        },
    },
    argTypes: {
        content: {
            description: 'Content configuration with title, description, and buttons',
            control: 'object',
        },
        rightContent: {
            description: 'Content for the right side (image, logo, code block, etc.)',
            control: false,
        },
    },
};

export default meta;
type Story = StoryObj<typeof PageFirstSlide>;


const CODE_EXAMPLE = `
# Python SDK

@let(snippet = await snippets.py.getSettings())

Python \`Get Settings\` SDK snippet:

\`\`\`python [=mySnippet]
{snippet}
\`\`\`
@let(
    .mySnippet.descHead="TIP"
    .mySnippet.desc = (
         Use our [Python SDK](https://sdk.example.com/py) 
         to **integrate** your API settings.

         * Configure authentication and endpoints
         * Handle responses and error cases
    )
)

Get Settings reference:
@uniform({snippet})

`.trim()

// Basic PageFirstSlide with image
export const Default: Story = {
    render: () => (
        <PageFirstSlide
            content={{
                title: 'Xwrite - content framework designed for docs',
                description: 'Xwrite is a modern content framework that helps you build beautiful, fast, and accessible documentation sites. Create stunning docs with ease using our comprehensive component library.',
                primaryButton: {
                    title: 'Get Xwrite',
                    href: '/download',
                    kind: 'primary',
                },
                secondaryButton: {
                    title: 'View documentation',
                    href: '/docs',
                    kind: 'secondary',
                },
            }}
            rightContent={
                <CodeSample
                    lineNumbers={true}
                    size="full"
                    description="docs/python-sdk.md"
                    theme={syntaxHighlight || undefined}
                    descriptionHead='Code Example'
                    descriptionContent='This is a code example'
                    codeblocks={[
                        {
                            lang: "mdx",
                            meta: "md",
                            value: CODE_EXAMPLE
                        }
                    ]}
                />
            }
        />
    ),
    parameters: {
        docs: {
            description: {
                story: 'PageFirstSlide with Xwrite content, Python SDK code example, and matching footer.',
            },
        },
    },
};
