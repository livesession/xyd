import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { DropdownMenu } from "./DropdownMenu";

const items = [
  {
    key: "production",
    label: "Production",
    icon: "bolt" as const,
    active: true,
  },
  { key: "staging", label: "Staging", icon: "cube" as const },
  { key: "development", label: "Development", icon: "box" as const },
];

const meta: Meta<typeof DropdownMenu> = {
  title: "Design System/DropdownMenu",
  component: DropdownMenu,
  parameters: { layout: "centered" },
  args: { items, align: "left" },
  decorators: [
    (Story) => (
      <div className="flex min-h-[260px] items-start justify-center pt-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

/** The trigger can be ANY element. A standard button trigger: */
export const ButtonTrigger: Story = {
  args: {
    trigger: (
      <Button variant="secondary" iconRight="chevronDown">
        Environment
      </Button>
    ),
  },
};

/** An icon-only ghost button trigger (a "kebab" menu). */
export const IconTrigger: Story = {
  args: {
    align: "right",
    trigger: (
      <Button variant="ghost" icon="more-down" size="sm">
        {""}
      </Button>
    ),
  },
};

/** A non-button trigger — here a Badge. Any clickable node works. */
export const BadgeTrigger: Story = {
  args: {
    trigger: <Badge tone="info">production ▾</Badge>,
  },
};

/** Plain text as a trigger. */
export const TextTrigger: Story = {
  args: {
    trigger: (
      <span className="cursor-pointer text-sm font-medium text-ink">
        Switch environment ▾
      </span>
    ),
  },
};
