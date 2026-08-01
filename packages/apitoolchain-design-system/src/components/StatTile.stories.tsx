import type { Meta, StoryObj } from "@storybook/react";
import { StatTile } from "./StatTile";

const meta: Meta<typeof StatTile> = {
  title: "Components/StatTile",
  component: StatTile,
  parameters: { layout: "centered" },
  argTypes: {
    lineStyle: {
      control: "inline-radio",
      options: ["solid", "dashed", "none"],
    },
    tone: { control: "inline-radio", options: ["default", "warning"] },
    dotSide: { control: "inline-radio", options: ["left", "right"] },
    lineTone: {
      control: "inline-radio",
      options: ["pink", "green", "blue", "orange", "amber"],
    },
    onAction: { action: "action" },
  },
  args: {
    label: "Total tokens",
    value: "0",
    lineTone: "pink",
    lineStyle: "solid",
  },
  decorators: [
    (Story) => (
      <div className="w-[320px] overflow-hidden rounded-box border border-line">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StatTile>;

export const SolidLine: Story = {};

export const DashedLine: Story = {
  args: { label: "Responses and Chat Completions", lineStyle: "dashed" },
};

export const GreenRightDot: Story = {
  args: { label: "Total requests", lineTone: "green", dotSide: "right" },
};

/** The warning variant with a CTA button instead of a trend line. */
export const WarningWithButton: Story = {
  args: {
    label: "Credit remaining",
    value: "$0.00",
    warning: true,
    showChevron: false,
    tone: "warning",
    buttonLabel: "Add credits",
  },
};
