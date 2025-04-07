import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '@xyd-js/components/writer';

const meta: Meta<typeof Badge> = {
    title: 'Writer/Badge',
    component: Badge,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Badge>;

// Basic usage
export const Default: Story = {
    args: {
        children: 'Default Badge',
        kind: 'warning',
    },
};
