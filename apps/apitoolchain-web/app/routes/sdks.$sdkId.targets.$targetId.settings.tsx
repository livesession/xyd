import { Button } from "@apitoolchain/design-system";
import { useFetcher, useOutletContext } from "react-router";
import { DeleteConfirm } from "~/components/DeleteConfirm";
import type { SdkTargetContext } from "~/components/sdkTargetShared";

export { sdkTargetAction as action } from "~/lib/sdkTargetAction";

export default function SdkTargetSettingsTab() {
  const { label, base } = useOutletContext<SdkTargetContext>();
  const del = useFetcher();
  const deleting = del.state !== "idle";
  const delError = (del.data as { message?: string } | undefined)?.message;

  return (
    <div className="flex max-w-[640px] flex-col gap-3">
      <div className="text-sm font-semibold text-ink">Danger zone</div>
      <div className="flex items-center gap-3 rounded-control border border-line px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-ink">Delete target</div>
          <div className="text-xs text-subtle">
            Permanently remove this {label} target and its build history.
          </div>
        </div>
        <DeleteConfirm
          title="Delete target"
          description={`Permanently remove the ${label} target and its build history.`}
          warning="This can't be undone."
          confirmLabel="Delete target"
          confirming={deleting}
          busyLabel="Deleting…"
          error={delError}
          onConfirm={() =>
            del.submit({ intent: "delete" }, { method: "post", action: base })
          }
          trigger={(open) => (
            <Button variant="danger" onClick={open} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          )}
        />
      </div>
    </div>
  );
}
