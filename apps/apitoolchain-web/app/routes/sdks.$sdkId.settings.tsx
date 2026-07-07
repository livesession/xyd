import { Button, Callout } from "@apitoolchain/design-system";
import { useFetcher, useOutletContext } from "react-router";
import type { SdkDetailContext } from "~/components/sdkDetailShared";

export { sdkDetailAction as action } from "~/lib/sdkDetailAction";

export default function SdkSettingsTab() {
  const { sdk, base } = useOutletContext<SdkDetailContext>();
  const del = useFetcher();
  const deleting = del.state !== "idle";
  const delError = (del.data as { message?: string } | undefined)?.message;

  function onDelete() {
    if (
      !window.confirm(
        `Delete "${sdk.name}" and all its targets? This can't be undone.`,
      ) ||
      deleting
    )
      return;
    del.submit({ intent: "delete" }, { method: "post", action: base });
  }

  return (
    <div className="flex max-w-[640px] flex-col gap-3">
      <div className="text-sm font-semibold text-ink">Danger zone</div>
      <div className="flex items-center gap-3 rounded-control border border-line px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-ink">Delete SDK</div>
          <div className="text-xs text-subtle">
            Permanently remove this SDK and every generated target.
          </div>
        </div>
        <Button variant="danger" onClick={onDelete} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete"}
        </Button>
      </div>
      {delError && <Callout tone="error">{delError}</Callout>}
    </div>
  );
}
