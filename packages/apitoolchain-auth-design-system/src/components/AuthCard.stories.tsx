import type { Meta, StoryObj } from "@storybook/react";
import { AuthButton } from "./AuthButton";
import { AuthCard } from "./AuthCard";
import { AuthDivider } from "./AuthDivider";
import { AuthInput } from "./AuthInput";

const meta: Meta<typeof AuthCard> = {
  title: "Auth/AuthCard",
  component: AuthCard,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[420px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AuthCard>;

/** The card holding a typical sign-in form. */
export const Default: Story = {
  render: () => (
    <AuthCard>
      <AuthInput type="email" placeholder="Enter your email" />
      <AuthInput type="password" placeholder="Password" />
      <AuthButton type="button">Continue with email</AuthButton>
    </AuthCard>
  ),
};

/** Minimal — a single action. */
export const Minimal: Story = {
  render: () => (
    <AuthCard>
      <AuthButton type="button">Continue</AuthButton>
      <AuthDivider />
      <AuthButton type="button" variant="secondary">
        Use single sign-on
      </AuthButton>
    </AuthCard>
  ),
};
