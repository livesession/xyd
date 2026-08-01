import {
  Button,
  Field,
  Input,
  Modal,
  Select,
} from "@apitoolchain/design-system";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { ApiVersion } from "~/data";
import { formatVersion } from "~/version";

/** Suggest the next SDK version — bump the last numeric (patch) segment. */
function suggestNextVersion(current: string): string {
  const m = current.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return current || "0.1.0";
  return `${m[1]}.${m[2]}.${Number(m[3]) + 1}`;
}

/**
 * Create a new SDK version: bump the SDK's own version and rebuild every target
 * from a chosen API spec version. Recorded as a build in the version history.
 * Posts `intent=create-version` to the SDK-detail action.
 */
export function NewVersionModal({
  open,
  onClose,
  actionPath,
  currentSdkVersion,
  apiVersions,
  currentApiVersion,
}: {
  open: boolean;
  onClose: () => void;
  actionPath: string;
  /** The SDK's current version — used to suggest the next one. */
  currentSdkVersion: string;
  /** The parent API's spec versions to build from. */
  apiVersions: ApiVersion[];
  /** Default API-version selection — the API's current version. */
  currentApiVersion: string;
}) {
  const submit = useFetcher();
  const [version, setVersion] = useState("");
  const [apiVersion, setApiVersion] = useState(currentApiVersion);
  const submitting = submit.state !== "idle";
  const submitted = useRef(false);
  const result = submit.data as { ok?: boolean; message?: string } | undefined;
  const error = result && result.ok === false ? result.message : null;

  useEffect(() => {
    if (open) {
      setVersion(suggestNextVersion(currentSdkVersion));
      setApiVersion(currentApiVersion);
    }
  }, [open, currentSdkVersion, currentApiVersion]);

  useEffect(() => {
    if (submitted.current && submit.state === "idle" && result?.ok) {
      submitted.current = false;
      onClose();
    }
  }, [submit.state, result, onClose]);

  function create() {
    if (submitting || !version.trim()) return;
    submitted.current = true;
    submit.submit(
      { intent: "create-version", version: version.trim(), apiVersion },
      { method: "post", action: actionPath },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="New SDK version"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon="sdk"
            onClick={create}
            disabled={submitting || !version.trim() || apiVersions.length === 0}
          >
            {submitting ? "Building…" : "Create & build"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-subtle">
          Bump the SDK's version and rebuild every target from the chosen API
          spec version. The build is recorded in the version history.
        </p>
        <Field label="SDK version" required>
          <Input
            value={version}
            onChange={setVersion}
            placeholder="0.2.0"
            leadingIcon="tags-outline"
          />
        </Field>
        <Field label="API version" required>
          <Select
            value={apiVersion}
            onChange={setApiVersion}
            leadingIcon="tags-outline"
            options={apiVersions.map((v) => ({
              value: v.version,
              label: v.current
                ? `${formatVersion(v.version)} (current)`
                : formatVersion(v.version),
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
