import type { Meta, StoryObj } from "@storybook/react";
import { AuthInput } from "./AuthInput";

const meta: Meta<typeof AuthInput> = {
  title: "Auth/AuthInput",
  component: AuthInput,
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
type Story = StoryObj<typeof AuthInput>;

export const Email: Story = {
  args: { type: "email", placeholder: "Enter your email" },
};

export const Password: Story = {
  args: { type: "password", placeholder: "Password" },
};

export const Filled: Story = {
  args: { defaultValue: "jane@company.com" },
};

export const Disabled: Story = {
  args: { defaultValue: "jane@company.com", disabled: true },
};
