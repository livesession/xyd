import React from "react";
import type {Meta, StoryObj} from '@storybook/react';
import {MemoryRouter} from "react-router";

import {Full} from './demo.tsx';

const meta = {
    title: 'Themes/Default',
    component: Full,
    parameters: {
        // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
        layout: 'fullscreen',
    },
    decorators: [
        (Story) => <MemoryRouter>
            <Story/>
        </MemoryRouter>
    ]
} satisfies Meta<typeof Full>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
