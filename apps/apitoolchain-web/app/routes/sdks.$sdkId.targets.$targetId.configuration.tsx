import { Button, Callout } from "@apitoolchain/design-system";
import {
  createFetchPreview,
  normalizeSdkJsonSections,
  type SdkJson,
  SdkJsonWizard,
} from "@apitoolchain/sdkjson-wizard";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFetcher, useOutletContext } from "react-router";
import { RouterLink } from "~/components/RouterLink";
import type { SdkTargetContext } from "~/components/sdkTargetShared";

// Persisting the edited config posts back to the target path (`base`).
export { sdkTargetAction as action } from "~/lib/sdkTargetAction";

const fetchPreview = createFetchPreview("/api/sdk-preview");

/**
 * The target's regeneration config as a live sdk.json wizard, scoped to THIS
 * target's language. Seeded from the current built sdk.json; "Save" persists the
 * edited config to the target — applied when a new version is built (a built
 * version is immutable).
 */
export default function SdkTargetConfigurationTab() {
  const { target, sdkId, base, label, sdkJson } =
    useOutletContext<SdkTargetContext>();
  const fetcher = useFetcher();

  // Seed from the current built sdk.json (what the Overview shows). Normalize the
  // section key to canonical (a built sdk.json keys node's section by "node", the
  // language id — the wizard reads/edits/validates "typescript"). Fall back to a
  // minimal object if it's missing/unparseable.
  const seed = useMemo<SdkJson>(() => {
    try {
      if (sdkJson)
        return normalizeSdkJsonSections(JSON.parse(sdkJson) as SdkJson);
    } catch {
      // ignore — fall through to the minimal seed
    }
    return { version: 1 } as SdkJson;
  }, [sdkJson]);

  const [value, setValue] = useState<SdkJson>(seed);
  // The last PERSISTED config — what `value` is compared against to know if there
  // are unsaved edits. Starts at the seed (nothing to save on open).
  const [savedValue, setSavedValue] = useState<SdkJson>(seed);
  const saving = fetcher.state !== "idle";
  const result = fetcher.data as { ok: boolean; message?: string } | undefined;

  const dirty = useMemo(
    () => JSON.stringify(value) !== JSON.stringify(savedValue),
    [value, savedValue],
  );

  // Remember what we submitted so a successful save adopts exactly that as the new
  // baseline (flipping `dirty` back to false, even if the user kept typing).
  const pendingSave = useRef<SdkJson | null>(null);
  const save = () => {
    pendingSave.current = value;
    const fd = new FormData();
    fd.set("intent", "save-config");
    fd.set("sdkJson", JSON.stringify(value, null, 2));
    fetcher.submit(fd, { method: "post", action: base });
  };

  useEffect(() => {
    if (fetcher.state === "idle" && result?.ok && pendingSave.current) {
      setSavedValue(pendingSave.current);
      pendingSave.current = null;
    }
  }, [fetcher.state, result]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-0 text-base font-semibold text-ink">
            Configuration
          </h2>
          <p className="m-0 mt-1 text-sm text-subtle">
            The {label} sdk.json this SDK is regenerated from. Saved changes
            apply when you create a new version.
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          {dirty && (
            <span className="inline-flex items-center gap-1.5 text-sm text-subtle">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "#f59e0b" }}
              />
              Unsaved changes
            </span>
          )}
          <Button
            variant="primary"
            icon="sdk"
            onClick={save}
            disabled={saving || !dirty}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {result && !result.ok && (
        <Callout tone="error" title="Save failed">
          {result.message ?? "Could not save the configuration."}
        </Callout>
      )}
      {/* Persistent pending state (from the backend, survives refresh + shows on
          every tab): the saved config isn't applied until the SDK is rebuilt. */}
      {target.configPending && (
        <Callout tone="warning" icon="alert" title="Saved — not in a build yet">
          <p className="m-0">
            SDK versions are immutable, so this config applies when you create a
            new version — the live {label} SDK keeps its current build until
            then.
          </p>
          <RouterLink
            href={`/sdks/${sdkId}?new-version`}
            className="mt-1.5 inline-block font-medium text-current underline-offset-2 hover:underline"
          >
            Create a new version to apply →
          </RouterLink>
        </Callout>
      )}

      <SdkJsonWizard
        value={value}
        onChange={setValue}
        languages={[target.language]}
        generatePreview={fetchPreview}
        defaultEditMode="form"
        // Diff the Changes panel against the first generation (state 0), so it
        // shows the cumulative effect of the config vs the pristine SDK — not
        // just the delta from the previous keystroke (matches GenerateSdkModal).
        diffBase="initial"
        // Identity is fixed by the SDK/target — hide it from the Form (it stays
        // in the JSON config, read-only).
        readOnlyFields={["$schema", "version", "sdkName", "api", "sdk"]}
        sticky={false}
      />
    </div>
  );
}
