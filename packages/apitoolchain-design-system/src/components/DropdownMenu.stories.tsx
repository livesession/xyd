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
  { key: "staging", label: "Staging", icon: "box" as const },
  { key: "development", label: "Development", icon: "box" as const },
];

const meta: Meta<typeof DropdownMenu> = {
  title: "Components/DropdownMenu",
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

/** Just the open menu panel — the trigger is collapsed to zero size so only the
 * item list shows. */
export const Default: Story = {
  args: {
    defaultOpen: true,
    trigger: <span aria-hidden className="block h-0 w-0" />,
  },
};

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

/**
 * `maxHeight` caps a long list and scrolls its items instead of letting the
 * panel run off-screen — for menus with many entries (e.g. an API's endpoints).
 * A number is px; a string is raw CSS (`"60vh"`, `"min(360px,50vh)"`). Unset =
 * the panel grows to fit every item.
 */
export const Overflow: Story = {
  args: {
    defaultOpen: true,
    maxHeight: 240,
    trigger: <span aria-hidden className="block h-0 w-0" />,
    items: Array.from({ length: 28 }, (_, i) => ({
      key: `ep-${i}`,
      label: `${["GET", "POST", "DELETE"][i % 3]} /resource/${i}`,
      icon: "bolt" as const,
      active: i === 0,
    })),
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-[320px] items-start justify-center pt-8">
        <Story />
      </div>
    ),
  ],
};

/** The same overflow cap, driven from a real button trigger. */
export const OverflowWithTrigger: Story = {
  args: {
    align: "right",
    maxHeight: "min(360px, 50vh)",
    trigger: (
      <Button variant="secondary" iconRight="chevronDown">
        GET /resource/0
      </Button>
    ),
    items: Array.from({ length: 40 }, (_, i) => ({
      key: `ep-${i}`,
      label: `${["GET", "POST", "PATCH", "DELETE"][i % 4]} /resource/${i}`,
      icon: "bolt" as const,
      active: i === 0,
    })),
  },
};
