import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Pagination } from "./Pagination";

const meta: Meta<typeof Pagination> = {
  title: "Components/Pagination",
  component: Pagination,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[560px] p-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Pagination>;

/** Stateful wrapper so the stories are actually clickable. */
function Demo({
  pageCount,
  perPage = 20,
  total,
}: {
  pageCount: number;
  perPage?: number;
  total?: number;
}) {
  const [page, setPage] = useState(1);
  const summary =
    total != null
      ? `${(page - 1) * perPage + 1}–${Math.min(page * perPage, total)} of ${total}`
      : undefined;
  return (
    <Pagination
      page={page}
      pageCount={pageCount}
      onPageChange={setPage}
      summary={summary}
    />
  );
}

/** Many pages — windowed numbers with "…" gaps and an item-range summary. */
export const Default: Story = {
  render: () => <Demo pageCount={14} total={273} />,
};

/** A handful of pages — every page is shown, no ellipsis. */
export const FewPages: Story = {
  render: () => <Demo pageCount={4} total={68} />,
};

/** Arrows + numbers only, without the left-hand summary. */
export const NoSummary: Story = {
  render: () => <Demo pageCount={9} />,
};

/** A single page renders nothing on its own — pass a `summary` to still show a
 * range label (the pager itself is hidden when there's only one page). */
export const SinglePage: Story = {
  render: () => (
    <Pagination
      page={1}
      pageCount={1}
      onPageChange={() => {}}
      summary="1–7 of 7"
    />
  ),
};
