import type { Meta, StoryObj } from "@storybook/react";
import { FromLiveSession } from "./FromLiveSession";

const meta: Meta<typeof FromLiveSession> = {
  title: "Components/FromLiveSession",
  component: FromLiveSession,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof FromLiveSession>;

export const Default: Story = {};
