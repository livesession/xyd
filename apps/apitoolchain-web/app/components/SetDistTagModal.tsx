import {
  Button,
  Field,
  Input,
  Modal,
  Select,
} from "@apitoolchain/design-system";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { RegistryEntry, SetDistTagResult } from "~/data";

export function SetDistTagModal({
  open,
  onClose,
  api,
}: {
  open: boolean;
  onClose: () => void;
  api: RegistryEntry;
}) {
  const fetcher = useFetcher();
  const currentVersion = api.versions.find((v) => v.current)?.version ?? "";
  const [tag, setTag] = useState("");
  const [version, setVersion] = useState(currentVersion);

  const submitting = fetcher.state !== "idle";
  const result = fetcher.data as SetDistTagResult | undefined;
  const error = result && !result.ok ? result.message : null;
  // Gate close-on-success to OUR submission — `fetcher.data` persists, so
  // reopening would otherwise re-fire this effect and snap the modal shut.
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current && fetcher.state === "idle" && result?.ok) {
      submitted.current = false;
      onClose();
      setTag("");
    }
  }, [fetcher.state, result, onClose]);

  const cleanTag = tag.trim();
  const existing = api.distTags.find((t) => t.tag === cleanTag);
  const canSubmit = cleanTag.length > 0 && version.length > 0;

  function submit() {
    if (!canSubmit || submitting) return;
    submitted.current = true;
    fetcher.submit(
      { intent: "set-dist-tag", tag: cleanTag, version },
      { method: "post", action: `/registry/${api.id}` },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Set dist-tag"
      description="Point a named tag (latest, canary, beta, …) at a version. Consumers can then resolve the spec by tag."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon="plus"
            onClick={submit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? "Saving…" : existing ? "Move tag" : "Create tag"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field
          label="Tag"
          hint={
            existing
              ? `Moves @${cleanTag} from v${existing.version}.`
              : "e.g. latest, canary, beta, stable."
          }
        >
          <Input value={tag} onChange={setTag} placeholder="canary" />
        </Field>

        <Field label="Version">
          <Select
            value={version}
            onChange={setVersion}
            options={api.versions.map((v) => ({
              value: v.version,
              label: `v${v.version}${v.current ? " · current" : ""}`,
            }))}
          />
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
