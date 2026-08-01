import type { Meta, StoryObj } from "@storybook/react";
import { AuthGoogleMark } from "./AuthGoogleMark";

const meta: Meta<typeof AuthGoogleMark> = {
  title: "Auth/AuthGoogleMark",
  component: AuthGoogleMark,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof AuthGoogleMark>;

export const Default: Story = {};

export const Large: Story = {
  args: { size: 40 },
};
