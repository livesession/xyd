import type { Meta, StoryObj } from "@storybook/react";
import { AuthBackground } from "./AuthBackground";

const meta: Meta<typeof AuthBackground> = {
  title: "Auth/AuthBackground",
  component: AuthBackground,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof AuthBackground>;

/**
 * The background on its own — the faded dotted shell that centers whatever you
 * put inside it. Full auth compositions live under **Examples**.
 */
export const Default: Story = {
  render: () => (
    <AuthBackground>
      <div className="rounded-panel border border-line border-dashed bg-surface/60 px-6 py-16 text-center text-sm text-subtle">
        Auth content
      </div>
    </AuthBackground>
  ),
};
