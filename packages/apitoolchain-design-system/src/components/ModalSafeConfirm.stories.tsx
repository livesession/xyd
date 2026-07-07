import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "./Button";
import { ModalSafeConfirm } from "./ModalSafeConfirm";
import { Mono } from "./Mono";

const meta: Meta<typeof ModalSafeConfirm> = {
  title: "Design System/ModalSafeConfirm",
  component: ModalSafeConfirm,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof ModalSafeConfirm>;

/** A plain destructive confirm — Cancel / Delete, with an irreversibility warning. */
export const DeleteConfirm: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Delete SDK
        </Button>
        <ModalSafeConfirm
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={() => setOpen(false)}
          title="Delete SDK"
          description={
            <>
              Permanently remove <Mono>@livesession/sdk</Mono> and every
              generated target.
            </>
          }
          warning="This can't be undone."
          confirmLabel="Delete"
        />
      </>
    );
  },
};

/** Type-to-confirm: the Delete button unlocks only after the exact name is typed. */
export const TypeToConfirm: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Delete repository
        </Button>
        <ModalSafeConfirm
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={() => setOpen(false)}
          title="Delete repository"
          description="This removes the repository, its releases and all connections."
          warning="This action is irreversible."
          confirmText="livesession-openapi"
          confirmLabel="Delete repository"
        />
      </>
    );
  },
};

/** A non-destructive "apply" confirm — primary tone, no warning. */
export const ApplyChanges: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Publish version
        </Button>
        <ModalSafeConfirm
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={() => setOpen(false)}
          title="Publish v2.0.0?"
          description="This publishes the Go SDK to the registry and tags a release."
          tone="primary"
          confirmLabel="Publish"
        />
      </>
    );
  },
};
