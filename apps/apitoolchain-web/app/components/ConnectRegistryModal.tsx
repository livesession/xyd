import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  Toggle,
} from "@apitoolchain/design-system";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { PackageRegistry, SdkLanguage } from "~/data";
import { LANG_TO_REGISTRY_KIND, REGISTRY_KIND_LABEL } from "~/lib/registryKind";

type ConnectResult = { ok: boolean; message?: string };

/**
 * Link this SDK target to a package registry it publishes into. Only registries
 * whose kind matches the target's language are offered (node → npm, …). Posts
 * `intent=connect-registry` to the route action.
 */
export function ConnectRegistryModal({
  open,
  onClose,
  registries,
  actionPath,
  language,
  defaultPackageName,
}: {
  open: boolean;
  onClose: () => void;
  registries: PackageRegistry[];
  actionPath: string;
  language: SdkLanguage;
  defaultPackageName: string;
}) {
  const kind = LANG_TO_REGISTRY_KIND[language];
  const eligible = registries.filter((r) => r.kind === kind);

  const submit = useFetcher();
  const [registryId, setRegistryId] = useState(eligible[0]?.id ?? "");
  const [packageName, setPackageName] = useState(defaultPackageName);
  const [autoPublish, setAutoPublish] = useState(true);
  const submitting = submit.state !== "idle";
  const submitted = useRef(false);
  const [dirty, setDirty] = useState(false);
  const result = submit.data as ConnectResult | undefined;
  const error = dirty && result && !result.ok ? result.message : null;

  const firstEligibleId = eligible[0]?.id ?? "";
  useEffect(() => {
    if (open) {
      setRegistryId(firstEligibleId);
      setPackageName(defaultPackageName);
      setAutoPublish(true);
      setDirty(false);
    }
  }, [open, defaultPackageName, firstEligibleId]);

  useEffect(() => {
    if (submitted.current && submit.state === "idle" && result?.ok) {
      submitted.current = false;
      onClose();
    }
  }, [submit.state, result, onClose]);

  function connect() {
    if (!registryId || submitting) return;
    submitted.current = true;
    setDirty(true);
    submit.submit(
      {
        intent: "connect-registry",
        registryId,
        packageName: packageName.trim(),
        autoPublish: autoPublish ? "1" : "",
      },
      { method: "post", action: actionPath },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Connect a registry"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {eligible.length > 0 && (
            <Button
              variant="primary"
              icon="sdk"
              onClick={connect}
              disabled={!registryId || submitting}
            >
              {submitting ? "Connecting…" : "Connect"}
            </Button>
          )}
        </>
      }
    >
      {eligible.length === 0 ? (
        <p className="text-sm text-subtle">
          No {REGISTRY_KIND_LABEL[kind]} registry connected yet. Add one under{" "}
          <a
            href="/settings/publishing"
            className="font-medium text-ink underline underline-offset-2"
          >
            Settings → Publishing
          </a>{" "}
          first.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <Field label="Registry" htmlFor="cr-registry" required>
            <Select
              id="cr-registry"
              value={registryId}
              onChange={setRegistryId}
              options={eligible.map((r) => ({
                value: r.id,
                label: `${r.name} (${r.url})`,
              }))}
            />
          </Field>
          <Field
            label="Package name"
            htmlFor="cr-pkg"
            hint="Defaults to the SDK's generated package name."
          >
            <Input
              id="cr-pkg"
              value={packageName}
              onChange={setPackageName}
              placeholder={defaultPackageName || "package name"}
            />
          </Field>
          <div className="flex items-center gap-2 text-[13px] text-subtle">
            <Toggle
              checked={autoPublish}
              onChange={setAutoPublish}
              aria-label="Publish automatically on release"
            />
            Publish automatically when a release is merged
          </div>
          {error && (
            <div className="rounded-control bg-danger-bg px-3 py-2 text-[13px] text-danger">
              {error}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
