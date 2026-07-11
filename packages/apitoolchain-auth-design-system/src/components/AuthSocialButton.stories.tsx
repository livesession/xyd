import type { Meta, StoryObj } from "@storybook/react";
import { AuthGoogleMark } from "./AuthGoogleMark";
import { AuthSocialButton } from "./AuthSocialButton";

const meta: Meta<typeof AuthSocialButton> = {
  title: "Auth/AuthSocialButton",
  component: AuthSocialButton,
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
type Story = StoryObj<typeof AuthSocialButton>;

export const Google: Story = {
  args: {
    icon: <AuthGoogleMark />,
    children: "Continue with Google",
  },
};

export const Disabled: Story = {
  args: {
    icon: <AuthGoogleMark />,
    children: "Continue with Google",
    disabled: true,
  },
};

export const NoIcon: Story = {
  args: { children: "Continue with SSO" },
};
