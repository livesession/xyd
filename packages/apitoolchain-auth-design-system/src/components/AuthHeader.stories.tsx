import type { Meta, StoryObj } from "@storybook/react";
import { AuthHeader } from "./AuthHeader";

const meta: Meta<typeof AuthHeader> = {
  title: "Auth/AuthHeader",
  component: AuthHeader,
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
type Story = StoryObj<typeof AuthHeader>;

export const Default: Story = {
  args: {
    title: "Sign in to apitoolchain",
    subtitle:
      "Register API specs, SDKs, docs, and MCP servers from one source of truth.",
  },
};

export const TitleOnly: Story = {
  args: { title: "Create your account" },
};
