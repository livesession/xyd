import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "./Button";
import { ModalAnnounce, type ModalAnnounceStep } from "./ModalAnnounce";

const meta: Meta<typeof ModalAnnounce> = {
  title: "Components/ModalAnnounce",
  component: ModalAnnounce,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof ModalAnnounce>;

const STEPS: ModalAnnounceStep[] = [
  {
    title: "We proactively block requests",
    description:
      "We identify suspicious requests and automatically block them. You can now see insights about this activity.",
    media: <ModalAnnounce.HeroIcon icon="shield" tone="blue" />,
  },
  {
    title: "Generate SDKs in one click",
    description:
      "Ship typed client libraries for every language straight from a registered OpenAPI spec.",
    media: <ModalAnnounce.HeroIcon icon="sdk" tone="green" />,
  },
  {
    title: "Publish docs and MCP servers",
    description:
      "Turn the same spec into beautiful reference docs and an MCP server your agents can call.",
    media: <ModalAnnounce.HeroIcon icon="sparkle" tone="pink" />,
  },
];

/** Interactive: click to open the multi-step announcement. */
export const ThreeSteps: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div className="flex flex-col items-center gap-4">
        <Button variant="primary" onClick={() => setOpen(true)}>
          Show announcement
        </Button>
        <ModalAnnounce
          open={open}
          onClose={() => setOpen(false)}
          steps={STEPS}
          finishLabel="Get started"
        />
      </div>
    );
  },
};

/** A single-step announcement — no dots, the button reads as the finish label. */
export const SingleStep: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div className="flex flex-col items-center gap-4">
        <Button variant="primary" onClick={() => setOpen(true)}>
          Show announcement
        </Button>
        <ModalAnnounce
          open={open}
          onClose={() => setOpen(false)}
          steps={[STEPS[0]]}
          finishLabel="Got it"
        />
      </div>
    );
  },
};
