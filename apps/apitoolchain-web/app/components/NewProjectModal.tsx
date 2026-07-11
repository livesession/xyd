import { Button, Field, Input, Modal } from "@apitoolchain/design-system";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";

/**
 * Create a project. Posts `intent=create` to the `/projects` resource route
 * (which revalidates the app-layout context), then closes on success. Replaces
 * the old `window.prompt`.
 */
export function NewProjectModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const fetcher = useFetcher();
  const [name, setName] = useState("");
  const submitting = fetcher.state !== "idle";
  const submitted = useRef(false);
  const result = fetcher.data as { ok?: boolean; message?: string } | undefined;
  const error =
    submitted.current && result && result.ok === false ? result.message : null;

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  useEffect(() => {
    if (submitted.current && fetcher.state === "idle" && result?.ok) {
      submitted.current = false;
      onClose();
    }
  }, [fetcher.state, result, onClose]);

  const clean = name.trim();
  function create() {
    if (!clean || submitting) return;
    submitted.current = true;
    fetcher.submit(
      { intent: "create", name: clean },
      { method: "post", action: "/projects" },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="New project"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={create}
            disabled={!clean || submitting}
          >
            {submitting ? "Creating…" : "Create project"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Project name" required>
          <Input value={name} onChange={setName} placeholder="e.g. Staging" />
        </Field>
        {error && (
          <div className="rounded-control bg-danger-bg px-3 py-2 text-[13px] text-danger">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
