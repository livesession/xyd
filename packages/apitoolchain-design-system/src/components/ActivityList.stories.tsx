import type { Meta, StoryObj } from "@storybook/react";
import type { ActivityItem } from "./ActivityList";
import { ActivityList } from "./ActivityList";

const items: ActivityItem[] = [
  {
    id: "1",
    icon: "check",
    tone: "success",
    when: "2 minutes ago",
    title: "Deployment succeeded",
    body: "v1.4.2 rolled out to production across all regions.",
  },
  {
    id: "2",
    icon: "box",
    tone: "info",
    when: "1 hour ago",
    title: "New model published",
    body: "Realtime-2 is now available in the registry.",
  },
  {
    id: "3",
    icon: "alert",
    tone: "warning",
    when: "Yesterday",
    title: "Rate limit approaching",
    body: "You have used 82% of your monthly request quota.",
  },
  {
    id: "4",
    icon: "key",
    tone: "accent",
    when: "3 days ago",
    title: "API key rotated",
  },
];

const meta: Meta<typeof ActivityList> = {
  title: "Design System/ActivityList",
  component: ActivityList,
  parameters: { layout: "padded" },
  args: {
    items,
  },
  decorators: [
    (Story) => (
      <div className="w-[520px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ActivityList>;

/** A vertical feed of icon + timestamp + title/body rows. */
export const Default: Story = {};

/** Every tone rendered side by side. */
export const Tones: Story = {
  args: {
    items: [
      {
        id: "n",
        icon: "box",
        tone: "neutral",
        when: "now",
        title: "Neutral event",
      },
      { id: "i", icon: "box", tone: "info", when: "now", title: "Info event" },
      {
        id: "s",
        icon: "check",
        tone: "success",
        when: "now",
        title: "Success event",
      },
      {
        id: "w",
        icon: "alert",
        tone: "warning",
        when: "now",
        title: "Warning event",
      },
      {
        id: "e",
        icon: "alert",
        tone: "error",
        when: "now",
        title: "Error event",
      },
      {
        id: "a",
        icon: "key",
        tone: "accent",
        when: "now",
        title: "Accent event",
      },
    ],
  },
};

/** Falls back to the `empty` node when there are no items. */
export const Empty: Story = {
  args: {
    items: [],
    empty: (
      <div className="rounded-box border border-line p-8 text-center text-sm text-muted">
        No activity yet.
      </div>
    ),
  },
};
