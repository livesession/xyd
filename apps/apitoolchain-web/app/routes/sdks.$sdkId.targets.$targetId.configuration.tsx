import { Button, Callout } from "@apitoolchain/design-system";
import {
  createFetchPreview,
  type SdkJson,
  SdkJsonWizard,
} from "@apitoolchain/sdkjson-wizard";
import { useMemo, useState } from "react";
import { useFetcher, useOutletContext } from "react-router";
import type { SdkTargetContext } from "~/components/sdkTargetShared";

// Persisting the edited config posts back to the target path (`base`).
export { sdkTargetAction as action } from "~/lib/sdkTargetAction";

const fetchPreview = createFetchPreview("/api/sdk-preview");

/**
 * The target's regeneration config as a live sdk.json wizard, scoped to THIS
 * target's language. Seeded from the current built sdk.json; "Save" persists the
 * edited config to the target (applied on the next rebuild).
 */
export default function SdkTargetConfigurationTab() {
  const { target, base, label, sdkJson } = useOutletContext<SdkTargetContext>();
  const fetcher = useFetcher();

  // Seed from the current built sdk.json (what the Overview shows). Fall back to
  // a minimal object if it's missing/unparseable.
  const seed = useMemo<SdkJson>(() => {
    try {
      if (sdkJson) return JSON.parse(sdkJson) as SdkJson;
    } catch {
      // ignore — fall through to the minimal seed
    }
    return { version: 1 } as SdkJson;
  }, [sdkJson]);

  const [value, setValue] = useState<SdkJson>(seed);
  const saving = fetcher.state !== "idle";
  const result = fetcher.data as { ok: boolean; message?: string } | undefined;

  const save = () => {
    const fd = new FormData();
    fd.set("intent", "save-config");
    fd.set("sdkJson", JSON.stringify(value, null, 2));
    fetcher.submit(fd, { method: "post", action: base });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-0 text-base font-semibold text-ink">
            Configuration
          </h2>
          <p className="m-0 mt-1 text-sm text-subtle">
            The {label} sdk.json this SDK is regenerated from. Saved changes
            apply on the next rebuild.
          </p>
        </div>
        <Button variant="primary" icon="sdk" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>

      {result && !result.ok && (
        <Callout tone="error" title="Save failed">
          {result.message ?? "Could not save the configuration."}
        </Callout>
      )}
      {result?.ok && !saving && (
        <Callout tone="success">
          Saved — applies the next time this SDK is rebuilt.
        </Callout>
      )}

      <SdkJsonWizard
        value={value}
        onChange={setValue}
        languages={[target.language]}
        generatePreview={fetchPreview}
        defaultEditMode="json"
        // Identity is fixed by the SDK/target — hide it from the Form (it stays
        // in the JSON config, read-only).
        readOnlyFields={["$schema", "version", "sdkName", "api", "sdk"]}
        sticky={false}
      />
    </div>
  );
}
