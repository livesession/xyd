import { Button, Field, Modal, Select } from "@apitoolchain/design-system";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { ApiVersion } from "~/data";
import { formatVersion } from "~/version";

/**
 * Retry a FAILED build: re-run generation of the SDK's targets from an API spec
 * version, in place. A successful version is immutable, so this is only for
 * recovering a build that errored — config/spec changes ship as a New version.
 * Posts `intent=build-sdk` to the SDK-detail action.
 */
export function BuildSdkModal({
  open,
  onClose,
  actionPath,
  apiVersions,
  currentApiVersion,
}: {
  open: boolean;
  onClose: () => void;
  actionPath: string;
  /** The parent API's spec versions to choose from. */
  apiVersions: ApiVersion[];
  /** Default selection — the API's current version. */
  currentApiVersion: string;
}) {
  const submit = useFetcher();
  const [version, setVersion] = useState(currentApiVersion);
  const submitting = submit.state !== "idle";
  const submitted = useRef(false);
  const result = submit.data as { ok?: boolean; message?: string } | undefined;
  const error = result && result.ok === false ? result.message : null;

  useEffect(() => {
    if (open) setVersion(currentApiVersion);
  }, [open, currentApiVersion]);

  useEffect(() => {
    if (submitted.current && submit.state === "idle" && result?.ok) {
      submitted.current = false;
      onClose();
    }
  }, [submit.state, result, onClose]);

  function build() {
    if (submitting) return;
    submitted.current = true;
    submit.submit(
      { intent: "build-sdk", apiVersion: version },
      { method: "post", action: actionPath },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Retry build"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon="sdk"
            onClick={build}
            disabled={submitting || apiVersions.length === 0}
          >
            {submitting ? "Building…" : "Retry build"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-subtle">
          Re-run generation of this SDK's targets from an API spec version — for
          recovering a build that failed. It doesn't bump the version; to apply
          config or spec changes, create a New version instead.
        </p>
        <Field label="API version" required>
          <Select
            value={version}
            onChange={setVersion}
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
