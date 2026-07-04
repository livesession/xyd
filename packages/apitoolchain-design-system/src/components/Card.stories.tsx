import type { Meta, StoryObj } from "@storybook/react";
import { ICON_NAMES } from "../icons";
import { Card } from "./Card";

const meta: Meta<typeof Card> = {
  title: "Design System/Card",
  component: Card,
  parameters: { layout: "centered" },
  argTypes: {
    icon: { control: "select", options: ["", ...ICON_NAMES] },
    onClick: { action: "clicked" },
  },
  args: {
    title: "Developer quickstart",
    description: "Make your first API request in minutes",
    showArrow: true,
  },
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Card>;

/** The link-style card (fSPaI): 14px/400 title with an up-right arrow. */
export const LinkCard: Story = {};

/** The heavier icon-tile variant used in "Recommended models". */
export const IconTile: Story = {
  args: {
    icon: "box",
    title: "Realtime-2",
    description: "Low-latency speech-to-speech across audio and text",
    showArrow: false,
  },
};

export const WithoutArrow: Story = {
  args: { showArrow: false },
};
