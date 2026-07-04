import type { Meta, StoryObj } from "@storybook/react";
import { Icon } from "./Icon";
import { ICON_NAMES } from "./registry";

const meta: Meta<typeof Icon> = {
  title: "Design System/Icon",
  component: Icon,
  parameters: { layout: "centered" },
  argTypes: {
    icon: { control: "select", options: ICON_NAMES },
    size: { control: { type: "range", min: 12, max: 64, step: 1 } },
    strokeWidth: { control: { type: "range", min: 1, max: 3, step: 0.1 } },
  },
  args: { icon: "home", size: 24 },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Default: Story = {};

export const Tinted: Story = {
  args: { icon: "shield", size: 40 },
  render: (args) => (
    <div className="text-pink">
      <Icon {...args} />
    </div>
  ),
};

/** The full registry — every glyph available via `<Icon icon="..." />`. */
export const Gallery: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-3 font-sans">
      {ICON_NAMES.map((name) => (
        <div
          key={name}
          className="flex flex-col items-center gap-2.5 rounded-panel border border-line px-2 py-4 text-ink"
        >
          <Icon icon={name} size={24} />
          <span className="break-words text-center text-[11px] text-muted">
            {name}
          </span>
        </div>
      ))}
    </div>
  ),
};
