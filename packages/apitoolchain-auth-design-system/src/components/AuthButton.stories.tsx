import type { Meta, StoryObj } from "@storybook/react";
import { AuthButton } from "./AuthButton";

const meta: Meta<typeof AuthButton> = {
  title: "Auth/AuthButton",
  component: AuthButton,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
  args: { type: "button" },
};

export default meta;
type Story = StoryObj<typeof AuthButton>;

export const Primary: Story = {
  args: { children: "Continue with email", variant: "primary" },
};

export const Secondary: Story = {
  args: { children: "Back", variant: "secondary" },
};

export const Disabled: Story = {
  args: { children: "Continue with email", disabled: true },
};
