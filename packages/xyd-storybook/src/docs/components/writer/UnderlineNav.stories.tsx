import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { UnderlineNav } from '@xyd-js/components/writer';

const meta: Meta<typeof UnderlineNav> = {
  title: 'Components/Writer/UnderlineNav',
  component: UnderlineNav,
  parameters: {
    layout: 'padded',
  },
  tags: [],
};

export default meta;
type Story = StoryObj<typeof UnderlineNav>;

export const Default: Story = {
  args: {
    value: 'tab1',
    onChange: (value) => console.log('Selected tab:', value),
  },
  render: (args) => {
    const [value, setValue] = useState('tab1');

    return <div style={{ width: 600 }}>
      <UnderlineNav value={value} onChange={setValue}>
        <UnderlineNav.Item value="tab1" href="#tab1">
          First Tab
        </UnderlineNav.Item>
        <UnderlineNav.Item value="tab2" href="#tab2">
          Second Tab
        </UnderlineNav.Item>
        <UnderlineNav.Item value="tab3" href="#tab3">
          Third Tab
        </UnderlineNav.Item>

        <UnderlineNav.Content value="tab1">
          This is tab 1
        </UnderlineNav.Content>
        <UnderlineNav.Content value="tab2">
          This is tab 2
        </UnderlineNav.Content>
        <UnderlineNav.Content value="tab3">
          This is tab 3
        </UnderlineNav.Content>
      </UnderlineNav>
    </div>
  }
};

export const WithoutSlide: Story = {
  args: {
    value: 'tab1',
    onChange: (value) => console.log('Selected tab:', value),
    slide: false,
  },
  render: (args) => {
    const [value, setValue] = useState('tab1');

    return <div style={{ width: 600 }}>
      <UnderlineNav value={value} onChange={setValue} slide={false}>
        <UnderlineNav.Item value="tab1" href="#tab1">
          First Tab
        </UnderlineNav.Item>
        <UnderlineNav.Item value="tab2" href="#tab2">
          Second Tab
        </UnderlineNav.Item>
        <UnderlineNav.Item value="tab3" href="#tab3">
          Third Tab
        </UnderlineNav.Item>

        <UnderlineNav.Content value="tab1">
          This is tab 1
        </UnderlineNav.Content>
        <UnderlineNav.Content value="tab2">
          This is tab 2
        </UnderlineNav.Content>
        <UnderlineNav.Content value="tab3">
          This is tab 3
        </UnderlineNav.Content>
      </UnderlineNav>
    </div>
  }
};

export const Uncontrolled: Story = {
  render: () => {
    return <div style={{ width: 600 }}>
      <UnderlineNav>
        <UnderlineNav.Item value="tab1" href="#tab1">
          First Tab
        </UnderlineNav.Item>
        <UnderlineNav.Item value="tab2" href="#tab2">
          Second Tab
        </UnderlineNav.Item>
        <UnderlineNav.Item value="tab3" href="#tab3">
          Third Tab
        </UnderlineNav.Item>

        <UnderlineNav.Content value="tab1">
          This is tab 1
        </UnderlineNav.Content>
        <UnderlineNav.Content value="tab2">
          This is tab 2
        </UnderlineNav.Content>
        <UnderlineNav.Content value="tab3">
          This is tab 3
        </UnderlineNav.Content>
      </UnderlineNav>
    </div>
  }
};

