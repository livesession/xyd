import type { Meta, StoryObj } from "@storybook/react";
import { StatGrid } from "./StatGrid";
import { StatTile } from "./StatTile";

const meta: Meta<typeof StatGrid> = {
  title: "Components/StatGrid",
  component: StatGrid,
  parameters: { layout: "padded" },
  argTypes: {
    columns: { control: "inline-radio", options: [2, 3, 4] },
  },
  args: {
    columns: 4,
  },
  render: (args) => (
    <div className="w-[760px] overflow-hidden rounded-box border border-line">
      <StatGrid {...args}>
        <StatTile label="Total tokens" value="1.2M" lineTone="pink" />
        <StatTile label="Total requests" value="8,421" lineTone="green" />
        <StatTile
          label="Responses and Chat Completions"
          value="3,104"
          lineTone="blue"
          lineStyle="dashed"
        />
        <StatTile
          label="Credit remaining"
          value="$0.00"
          warning
          showChevron={false}
          tone="warning"
          buttonLabel="Add credits"
        />
      </StatGrid>
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof StatGrid>;

/** The default four-column metrics row with hairline dividers. */
export const Default: Story = {};

/** Two columns — tiles wrap into a 2x2 grid. */
export const TwoColumns: Story = {
  args: { columns: 2 },
};

/** Three columns using only the first three tiles' worth of cells. */
export const ThreeColumns: Story = {
  args: { columns: 3 },
  render: (args) => (
    <div className="w-[760px] overflow-hidden rounded-box border border-line">
      <StatGrid {...args}>
        <StatTile label="Total tokens" value="1.2M" lineTone="pink" />
        <StatTile
          label="Total requests"
          value="8,421"
          lineTone="green"
          dotSide="right"
        />
        <StatTile label="Errors" value="12" lineTone="amber" lineStyle="none" />
      </StatGrid>
    </div>
  ),
};
