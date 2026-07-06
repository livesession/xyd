import type { Meta, StoryObj } from "@storybook/react";
import { AuthLink } from "./AuthLink";

const meta: Meta<typeof AuthLink> = {
  title: "Auth/AuthLink",
  component: AuthLink,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof AuthLink>;

export const Default: Story = {
  args: { href: "#", children: "Create an account" },
};

export const InSentence: Story = {
  render: () => (
    <p className="text-[13px] text-subtle">
      New here?{" "}
      <AuthLink href="#" className="ml-0.5">
        Create an account
      </AuthLink>
    </p>
  ),
};
