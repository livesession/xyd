import type { Meta, StoryObj } from "@storybook/react";
import { LiveSessionWordmark } from "./LiveSessionWordmark";

const meta: Meta<typeof LiveSessionWordmark> = {
  title: "Design System/LiveSessionWordmark",
  component: LiveSessionWordmark,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof LiveSessionWordmark>;

export const Default: Story = {
  render: () => <LiveSessionWordmark className="h-4 w-auto text-ink" />,
};
