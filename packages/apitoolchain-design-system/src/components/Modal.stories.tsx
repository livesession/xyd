import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "./Button";
import { Field } from "./Field";
import { Input } from "./Input";
import { Modal } from "./Modal";

const meta: Meta<typeof Modal> = {
  title: "Design System/Modal",
  component: Modal,
  parameters: { layout: "centered" },
  argTypes: {
    size: { control: "inline-radio", options: ["md", "lg"] },
    open: { control: false },
    onClose: { action: "closed" },
  },
  args: {
    title: "Create API key",
    description:
      "Give your key a memorable name so you can recognize it later.",
    size: "md",
  },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex items-center justify-center">
        <Button variant="primary" onClick={() => setOpen(true)}>
          Create API key
        </Button>
        <Modal
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setOpen(false)}>
                Confirm
              </Button>
            </>
          }
        >
          <Field label="Name" hint="This is only shown to your team.">
            <Input placeholder="Production server" />
          </Field>
        </Modal>
      </div>
    );
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

/** The default medium modal with a title, description and a single field body. */
export const Default: Story = {};

/** The wide (`lg`) variant for denser forms. */
export const Large: Story = {
  args: { size: "lg" },
};

/** A title-only modal with no description subtext. */
export const WithoutDescription: Story = {
  args: {
    title: "Delete environment",
    description: undefined,
  },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex items-center justify-center">
        <Button variant="warning" onClick={() => setOpen(true)}>
          Delete environment
        </Button>
        <Modal
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="warning" onClick={() => setOpen(false)}>
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted">
            This permanently removes the environment and all of its secrets.
          </p>
        </Modal>
      </div>
    );
  },
};
