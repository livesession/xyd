import type { Meta, StoryObj } from "@storybook/react";
import { Icon } from "../icons";
import { OptionCard } from "./OptionCard";

const meta: Meta<typeof OptionCard> = {
  title: "Components/OptionCard",
  component: OptionCard,
  parameters: { layout: "padded" },
  args: {
    title: "Start fresh",
    description: "Pick the languages to generate.",
  },
};

export default meta;
type Story = StoryObj<typeof OptionCard>;

export const Default: Story = {
  render: (args) => (
    <div className="w-64">
      <OptionCard
        {...args}
        media={<Icon icon="sdk" size={20} />}
        onClick={() => {}}
      />
    </div>
  ),
};

/** A clickable card next to a disabled ("coming soon") one. */
export const Pair: Story = {
  render: () => (
    <div className="grid w-[420px] grid-cols-2 gap-2">
      <OptionCard
        title="Start fresh"
        description="Pick the languages to generate."
        media={<Icon icon="sdk" size={20} />}
        onClick={() => {}}
      />
      <OptionCard
        title="Import config"
        description="Bring an SDK config. Coming soon."
        media={<Icon icon="download" size={20} />}
        disabled
      />
    </div>
  ),
};
