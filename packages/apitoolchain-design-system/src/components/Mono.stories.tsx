import type { Meta, StoryObj } from "@storybook/react";
import { Mono } from "./Mono";

const meta: Meta<typeof Mono> = {
  title: "Design System/Mono",
  component: Mono,
  parameters: { layout: "centered" },
  argTypes: {
    tone: { control: "inline-radio", options: ["ink", "muted"] },
  },
  args: {
    children: "@apitoolchain/web",
    tone: "ink",
  },
};

export default meta;
type Story = StoryObj<typeof Mono>;

export const Ink: Story = {};

export const Muted: Story = {
  args: { children: "GET /v1/specs/{id}", tone: "muted" },
};

/** Inline monospace inside a sentence, showing ink vs muted side by side. */
export const InlineInText: Story = {
  render: () => (
    <p className="text-ink">
      Install <Mono>xyd-js</Mono> then run <Mono tone="muted">xyd build</Mono>.
    </p>
  ),
};
