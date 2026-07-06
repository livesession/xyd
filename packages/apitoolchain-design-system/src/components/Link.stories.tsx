import type { Meta, StoryObj } from "@storybook/react";
import { Link } from "./Link";

const meta: Meta<typeof Link> = {
  title: "Design System/Link",
  component: Link,
  parameters: { layout: "centered" },
  argTypes: {
    external: { control: "boolean" },
    mono: { control: "boolean" },
    subtle: { control: "boolean" },
    sliding: { control: "boolean" },
  },
  args: {
    href: "https://github.com/apitoolchain/livesession-openapi",
    children: "apitoolchain/livesession-openapi",
    external: true,
    mono: true,
  },
};

export default meta;
type Story = StoryObj<typeof Link>;

/** The connected-repo link: monospace, external (opens in a new tab). */
export const Repo: Story = {};

/** A regular prose link (non-mono). */
export const Text: Story = {
  args: { mono: false, children: "View documentation" },
};

/**
 * Sliding: the underline animates in from the left on hover (a `currentColor`
 * gradient) instead of snapping in. Hover the link to see it. Composes with
 * `subtle` — the sliding underline tracks whatever colour the link inherits.
 */
export const Sliding: Story = {
  args: {
    mono: false,
    sliding: true,
    children: "Hover to slide the underline",
  },
};

/**
 * Subtle: adds no colour of its own — it inherits the parent's text colour and
 * only reveals an underline on hover. Compare the two rows: the subtle link
 * matches its surrounding text, the default link is always blue.
 */
export const Subtle: Story = {
  render: () => (
    <div className="flex w-[360px] flex-col gap-4">
      <p className="text-sm text-muted">
        Managed by{" "}
        <Link href="https://livesession.io" subtle>
          LiveSession
        </Link>{" "}
        — inherits this muted colour.
      </p>
      <p className="text-sm text-ink">
        On darker heading text it stays{" "}
        <Link href="https://livesession.io" subtle>
          ink-coloured
        </Link>
        .
      </p>
      <p className="text-sm text-muted">
        The default link is always{" "}
        <Link href="https://livesession.io">blue</Link>.
      </p>
    </div>
  ),
};

/** Action mode: no `href`, an `onClick` — a link-styled button (e.g. opens a
 * modal). Used for the "No repositories connected." empty state. */
export const Action: Story = {
  args: {
    mono: false,
    href: undefined,
    children: "No repositories connected.",
    onClick: () => {},
  },
};

/** Inline inside a repo row, next to a status pill + actions. */
export const InRepoRow: Story = {
  render: () => (
    <div className="flex w-[420px] items-center justify-between gap-3 rounded-control border border-line bg-surface px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <Link href="https://github.com/apitoolchain/livesession-openapi" mono>
          apitoolchain/livesession-openapi
        </Link>
        <span className="shrink-0 rounded-pill bg-surface-muted px-2 py-0.5 text-xs text-subtle">
          Draft
        </span>
      </div>
      <span className="shrink-0 text-xs text-muted">
        Sync · Settings · Remove
      </span>
    </div>
  ),
};
