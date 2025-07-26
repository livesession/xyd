import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { PageBlogHome } from '@xyd-js/components/pages';

import { DocsTemplateDecorator } from '../../../decorators/DocsTemplate';

// storybook-root
const meta: Meta<typeof PageBlogHome> = {
    title: 'Components/Pages/PageBlogHome',
    component: PageBlogHome,
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
                component: 'PageBlogHome component creates a blog home page with a list of blog posts.',
            },
        },
    },
    argTypes: {},
};

export default meta;
type Story = StoryObj<typeof PageBlogHome>;

export const Default: Story = {
    render: () => (
        <PageBlogHome
        />
    ),
    parameters: {
        docs: {
            description: {
                story: 'PageBlogHome component creates a blog home page with a list of blog posts.',
            },
        },
    },
};
