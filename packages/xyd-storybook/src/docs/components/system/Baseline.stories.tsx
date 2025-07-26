import React, { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import * as htmlToImage from 'html-to-image';
import download from 'downloadjs';

import { Baseline } from '@xyd-js/components/system';

function ExportableWrapper({ children }: { children: React.ReactNode }) {
    const containerRef = React.useRef<HTMLDivElement>(null);

    const exportAsSvg = () => {
        if (!containerRef.current) return;
        htmlToImage
            .toSvg(containerRef.current)
            .then((dataUrl) => {
                download(dataUrl, 'exported-component.svg', 'image/svg+xml');
            })
            .catch((err) => {
                console.error('Failed to export as SVG:', err);
            });
    };

    return (
        <div>
            <div ref={containerRef}>{children}</div>
            <button onClick={exportAsSvg}>Download as SVG</button>
        </div>
    );
}

const meta: Meta<typeof Baseline> = {
    title: 'Components/System/Baseline',
    component: Baseline,
    parameters: {
        docs: {
            description: {
                component: 'Baseline component is used to display a baseline for the design system.',
            },
        },
    },
    argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Baseline>;

export const Default: Story = {
    args: {
        title: 'Node.js Support',
        toolGroups: [
            [
                { tool: 'bun', supported: true },
                { tool: 'node', supported: true, label: '22' },
                { tool: 'node', supported: true, label: '23' },
                { tool: 'node', supported: true, label: '24' },
            ],
            [
                { tool: 'npm', supported: true },
                { tool: 'node', supported: true, label: '22' },
            ],
            [
                { tool: 'pnpm', supported: false },
            ],
        ],
    },
};

export const WithRefAndClick: Story = {
    render: (args) => {
        const ref = useRef<HTMLDetailsElement>(null);
        return (
            <Baseline
                {...args}
                ref={ref}
                onClick={() => {
                    console.log('Baseline clicked!', ref.current);
                }}
            />
        );
    },
    args: {
        title: 'Node.js Support',
        toolGroups: [
            [
                { tool: 'bun', supported: true },
                { tool: 'node', supported: true, label: '22' },
                { tool: 'node', supported: true, label: '23' },
                { tool: 'node', supported: true, label: '24' },
            ],
            [
                { tool: 'npm', supported: true },
                { tool: 'node', supported: true, label: '22' },
            ],
            [
                { tool: 'pnpm', supported: false },
            ],
        ],
    },
};

export const ExportableBaseline: Story = {
    render: (args) => (
        <ExportableWrapper>
            <Baseline {...args} />
        </ExportableWrapper>
    ),
    args: {
        title: 'Node.js Support',
        toolGroups: [
            [
                { tool: 'bun', supported: true },
                { tool: 'node', supported: true, label: '22' },
                { tool: 'node', supported: true, label: '23' },
                { tool: 'node', supported: true, label: '24' },
            ],
            [
                { tool: 'npm', supported: true },
                { tool: 'node', supported: true, label: '22' },
            ],
            [
                { tool: 'pnpm', supported: false },
            ],
        ],
    },
};
