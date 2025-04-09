import type { Meta, StoryObj } from '@storybook/react';
import { VideoGuide } from '@xyd-js/components/writer';

const meta: Meta<typeof VideoGuide> = {
    title: 'Components/Writer/VideoGuide',
    component: VideoGuide,
    parameters: {
        layout: 'centered',
    },
};

export default meta;
type Story = StoryObj<typeof VideoGuide>;

export const Default: Story = {
    render: () => <VideoGuide />,
};

export const Miniature: Story = {
    render: () => <VideoGuide.Miniature />,
}; 