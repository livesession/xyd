import type { Meta, StoryObj } from "@storybook/react";
import { Heading } from "./Heading";

const meta: Meta<typeof Heading> = {
  title: "Components/Heading",
  component: Heading,
  parameters: { layout: "padded" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    as: { control: "inline-radio", options: ["h1", "h2", "h3"] },
  },
  args: {
    children: "Recommended models",
    size: "md",
    as: "h2",
  },
};

export default meta;
type Story = StoryObj<typeof Heading>;

export const Default: Story = {};

export const Small: Story = {
  args: { size: "sm", children: "Usage this month" },
};

export const Large: Story = {
  args: { size: "lg", as: "h1", children: "Developer platform" },
};

/** All three sizes stacked to compare the type scale. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Heading size="lg">Large heading</Heading>
      <Heading size="md">Medium heading</Heading>
      <Heading size="sm">Small heading</Heading>
    </div>
  ),
};
