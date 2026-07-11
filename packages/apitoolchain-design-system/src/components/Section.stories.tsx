import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";
import { Section } from "./Section";

const meta: Meta<typeof Section> = {
  title: "Components/Section",
  component: Section,
  parameters: { layout: "padded" },
  args: {
    title: "Overview",
    children: (
      <div className="rounded-control border border-line p-4 text-sm text-ink">
        Section content goes here.
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-[560px] bg-surface text-ink">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Section>;

export const Default: Story = {};

/** With a right-aligned action in the header. */
export const WithAction: Story = {
  args: {
    title: "Targets",
    action: (
      <Button variant="ghost" icon="plus">
        Add target
      </Button>
    ),
  },
};
