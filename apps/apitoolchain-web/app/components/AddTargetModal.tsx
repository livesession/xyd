import { Button, Callout, Modal } from "@apitoolchain/design-system";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { SdkLanguage } from "~/data";
import { SDK_LANGS, SdkLangIcon } from "./SdkLangIcon";

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className={`relative ml-auto h-3.5 w-6 min-w-6 shrink-0 rounded-full transition-colors ${on ? "bg-blue" : "bg-surface-pill"}`}
    >
      <span
        className={`absolute top-px left-px size-3 rounded-full bg-white transition-transform ${on ? "translate-x-[10px]" : ""}`}
      />
    </span>
  );
}

/** Pick language(s) to add to an existing SDK; posts to the SDK detail action. */
export function AddTargetModal({
  open,
  onClose,
  sdkId,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  sdkId: string;
  /** Languages already present — hidden from the picker. */
  existing: SdkLanguage[];
}) {
  const fetcher = useFetcher();
  const [langs, setLangs] = useState<Set<SdkLanguage>>(new Set());
  const submitting = fetcher.state !== "idle";
  const submitted = useRef(false);
  const result = fetcher.data as { ok?: boolean; message?: string } | undefined;
  const [dirty, setDirty] = useState(false);
  const error = dirty && result && result.ok === false ? result.message : null;

  useEffect(() => {
    if (open) {
      setLangs(new Set());
      setDirty(false);
    }
  }, [open]);

  useEffect(() => {
    if (submitted.current && fetcher.state === "idle" && result?.ok) {
      submitted.current = false;
      onClose();
    }
  }, [fetcher.state, result, onClose]);

  const available = SDK_LANGS.filter((l) => !existing.includes(l.value));

  function toggle(l: SdkLanguage) {
    setLangs((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });
  }

  function add() {
    if (langs.size === 0 || submitting) return;
    submitted.current = true;
    setDirty(true);
    fetcher.submit(
      { intent: "add-target", langs: [...langs].join(",") },
      { method: "post", action: `/sdks/${sdkId}` },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Add SDK targets"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon="plus"
            disabled={langs.size === 0 || submitting}
            onClick={add}
          >
            {submitting ? "Adding…" : "Add targets"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        {available.length === 0 ? (
          <div className="py-6 text-center text-sm text-subtle">
            Every supported language is already a target.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {available.map((l) => {
              const on = langs.has(l.value);
              return (
                <button
                  key={l.value}
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => toggle(l.value)}
                  className="relative flex h-10 min-w-0 cursor-pointer items-center gap-2 rounded-control border border-transparent bg-surface-muted px-3 py-2 text-left hover:bg-hover"
                >
                  <SdkLangIcon language={l.value} />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">
                    {l.label}
                  </span>
                  <Toggle on={on} />
                </button>
              );
            })}
          </div>
        )}
        {error && <Callout tone="error">{error}</Callout>}
      </div>
    </Modal>
  );
}
