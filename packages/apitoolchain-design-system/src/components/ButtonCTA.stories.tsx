import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";
import { ButtonCTA } from "./ButtonCTA";

const meta: Meta<typeof ButtonCTA> = {
  title: "Design System/ButtonCTA",
  component: ButtonCTA,
  parameters: { layout: "padded" },
  args: { children: "Get started" },
};

export default meta;
type Story = StoryObj<typeof ButtonCTA>;

export const Default: Story = {};

export const WithIcon: Story = {
  args: {
    icon: "sparkle",
    iconRight: "arrowUpRight",
    children: "Generate SDKs",
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <ButtonCTA variant="primary" icon="sparkle">
        Primary
      </ButtonCTA>
      <ButtonCTA variant="secondary" icon="registry">
        Secondary
      </ButtonCTA>
      <ButtonCTA variant="ghost">Ghost</ButtonCTA>
      <ButtonCTA disabled>Disabled</ButtonCTA>
    </div>
  ),
};

/** Next to a regular Button — the CTA is taller, rounded-full, and centered. */
export const VsButton: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button variant="primary" icon="sparkle">
        Button
      </Button>
      <ButtonCTA variant="primary" icon="sparkle">
        ButtonCTA
      </ButtonCTA>
    </div>
  ),
};
