import type { Meta, StoryObj } from "@storybook/react";
import { Callout, type CalloutTone } from "./Callout";

const TONES: CalloutTone[] = ["error", "warning", "success", "info"];

const meta: Meta<typeof Callout> = {
  title: "Design System/Callout",
  component: Callout,
  parameters: { layout: "padded" },
  argTypes: {
    tone: { control: "inline-radio", options: TONES },
    title: { control: "text" },
    children: { control: "text" },
  },
  args: {
    tone: "error",
    children: 'Namespace "acme" is already taken.',
  },
};

export default meta;
type Story = StoryObj<typeof Callout>;

export const Default: Story = {};

export const WithTitle: Story = {
  args: {
    tone: "warning",
    title: "Heads up",
    children: "Generating this SDK will overwrite the previous artifact.",
  },
};

export const AllTones: Story = {
  render: () => (
    <div className="flex max-w-[420px] flex-col gap-3">
      {TONES.map((tone) => (
        <Callout key={tone} tone={tone}>
          This is a {tone} callout.
        </Callout>
      ))}
    </div>
  ),
};
