import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Badge, type BadgeStyles } from '@xyd-js/components/writer';
import { useStyle } from '@xyd-js/components/utils';

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

// Custom styled version
const CustomStyledBadge = () => {
    const styled = useStyle<BadgeStyles>(Badge);
    
    // Override warning style
    const warningClass = styled.BadgeHostWarning`
        background-color: #fff3dc;
        border: 2px solid #ffb020;
    `;

    // Override info style
    const infoClass = styled.BadgeHostInfo`
        background-color: #d8f3ff;
        border: 2px solid #0288d1;
    `;

    return (
        <div style={{ display: 'flex', gap: '16px' }}>
            <Badge kind="warning" className={warningClass}>
                Custom Warning Badge
            </Badge>
            <Badge kind="info" className={infoClass}>
                Custom Info Badge
            </Badge>
        </div>
    );
};

export const CustomStyled: Story = {
    render: () => <CustomStyledBadge />,
};