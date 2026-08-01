import type { Meta, StoryObj } from "@storybook/react";
import { AuthFormFooter } from "./AuthFormFooter";

const meta: Meta<typeof AuthFormFooter> = {
  title: "Auth/AuthFormFooter",
  component: AuthFormFooter,
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
type Story = StoryObj<typeof AuthFormFooter>;

export const Legal: Story = {
  args: {
    children:
      "By continuing, you agree to apitoolchain's Terms and acknowledge our Privacy Policy.",
  },
};

export const WithLinks: Story = {
  render: () => (
    <AuthFormFooter>
      By continuing, you agree to our{" "}
      <a href="/terms" className="text-nav underline">
        Terms
      </a>{" "}
      and{" "}
      <a href="/privacy" className="text-nav underline">
        Privacy Policy
      </a>
      .
    </AuthFormFooter>
  ),
};
