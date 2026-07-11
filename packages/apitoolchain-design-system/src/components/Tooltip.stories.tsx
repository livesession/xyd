import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";
import { Tooltip } from "./Tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: { layout: "centered" },
  args: { content: "A short explanation shown on hover or keyboard focus." },
  argTypes: {
    side: {
      control: "inline-radio",
      options: ["top", "bottom", "left", "right"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

/** Any trigger works — here a button. */
export const Default: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <Button variant="secondary">Hover me</Button>
    </Tooltip>
  ),
};

/** Wrap an inline word to explain a term in running text. */
export const OnText: Story = {
  render: (args) => (
    <p className="font-sans text-sm text-ink">
      Hover the{" "}
      <Tooltip {...args}>
        <span className="cursor-help underline decoration-dotted underline-offset-2">
          underlined term
        </span>
      </Tooltip>{" "}
      to learn more.
    </p>
  ),
};

/** The four placements. */
export const Sides: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap items-center gap-8 p-16 font-sans">
      {(["top", "bottom", "left", "right"] as const).map((side) => (
        <Tooltip key={side} side={side} content={`Tooltip on the ${side}`}>
          <Button variant="secondary">{side}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};
