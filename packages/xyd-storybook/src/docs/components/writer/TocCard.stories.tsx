import { Meta, StoryObj } from '@storybook/react';

import { TocCard } from '@xyd-js/components/writer';

const meta: Meta<typeof TocCard> = {
  title: 'Components/Writer/TocCard',
  component: TocCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A server-side rendered card component for table of contents entries. Displays a title, description, and favicon for a linked resource without client-side fetching.',
      },
    },
  },
  tags: [],
};

export default meta;
type Story = StoryObj<typeof TocCard>;

export const Default: Story = {
  args: {
    title: 'Example App',
    description: 'Explore our example app to see how the TocCard component works.',
    href: 'https://github.com/livesession/xyd',
  },
};


