import type { Meta, StoryObj } from "@storybook/react";
import { AuthDivider } from "./AuthDivider";

const meta: Meta<typeof AuthDivider> = {
  title: "Auth/AuthDivider",
  component: AuthDivider,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AuthDivider>;

export const Default: Story = {};

export const CustomLabel: Story = {
  args: { label: "or continue with" },
};
