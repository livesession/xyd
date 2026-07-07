import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";
import { Collapse } from "./Collapse";
import { Mono } from "./Mono";

const meta: Meta<typeof Collapse> = {
  title: "Design System/Collapse",
  component: Collapse,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-[560px] bg-surface text-ink">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Collapse>;

const Changelog = () => (
  <div className="flex flex-col gap-2 text-subtle">
    <p className="text-ink">
      Adds cursor pagination to <Mono>listInvoices</Mono> and fixes a retry loop
      on 429s.
    </p>
    <ul className="ml-4 list-disc space-y-1">
      <li>feat: cursor-based pagination for list endpoints</li>
      <li>fix: honour Retry-After on rate-limit responses</li>
      <li>chore: bump the generated runtime to 1.4.0</li>
    </ul>
    <div className="pt-1">
      <Mono tone="muted">git tag v2.1.0 · 14 commits</Mono>
    </div>
  </div>
);

/** A muted meta strip — the kind of thing the footer is for. */
const ReleaseMeta = () => (
  <div className="flex items-center justify-between gap-3">
    <span>
      Published by Ada Lovelace · <Mono tone="muted">a3f9c2b</Mono>
    </span>
    <a href="#pr" className="text-blue no-underline hover:underline">
      View PR #482
    </a>
  </div>
);

/** A single collapsed panel — click the header to reveal the content. */
export const Default: Story = {
  args: {
    title: "What changed in this release",
    children: <Changelog />,
  },
};

/** Open by default, with a leading icon, a trailing badge, and a meta footer. */
export const WithHeaderMeta: Story = {
  args: {
    icon: "git",
    title: "v2.1.0",
    description: "Released 3 days ago",
    trailing: <Badge tone="success">latest</Badge>,
    defaultOpen: true,
    children: <Changelog />,
    footer: <ReleaseMeta />,
  },
};

/** Disabled — the header can't be toggled. */
export const Disabled: Story = {
  args: {
    title: "v0.9.0 (yanked)",
    trailing: <Badge tone="error">yanked</Badge>,
    disabled: true,
    children: <Changelog />,
  },
};

/** The intended use: a long list of releases, each independently collapsible. */
export const ReleaseList: Story = {
  render: () => {
    const releases = [
      { version: "v2.1.0", when: "3 days ago", tag: "latest" as const },
      { version: "v2.0.0", when: "3 weeks ago", tag: "major" as const },
      { version: "v1.4.2", when: "2 months ago", tag: null },
      { version: "v1.4.1", when: "2 months ago", tag: null },
    ];
    const tone = (t: string | null) =>
      t === "latest" ? "success" : t === "major" ? "warning" : "neutral";
    return (
      <div className="flex flex-col gap-2">
        {releases.map((r, i) => (
          <Collapse
            key={r.version}
            icon="git"
            title={r.version}
            description={`Released ${r.when}`}
            defaultOpen={i === 0}
            trailing={r.tag ? <Badge tone={tone(r.tag)}>{r.tag}</Badge> : null}
            footer={<ReleaseMeta />}
          >
            <Changelog />
          </Collapse>
        ))}
      </div>
    );
  },
};
