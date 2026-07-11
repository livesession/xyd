import { Callout } from "@apitoolchain/design-system";
import { useState } from "react";
import type { SdkJson } from "../model/types";
import { JsonCodeEditor } from "./JsonCodeEditor";

/** Edit the sdk.json directly (the alternative to the UI form). Two-way: a valid
 * parse commits to the shared state (→ live preview); invalid JSON surfaces an
 * error and keeps the last valid config. Seeded from the current config on mount
 * (so toggling Form↔JSON always starts from the latest state). */
export function SdkJsonEditor({
  sdkJson,
  onChange,
}: {
  sdkJson: SdkJson;
  onChange: (next: SdkJson) => void;
}) {
  const [draft, setDraft] = useState(
    () => `${JSON.stringify(sdkJson, null, 2)}\n`,
  );
  const [error, setError] = useState<string | null>(null);

  const apply = (text: string) => {
    setDraft(text);
    try {
      const parsed = JSON.parse(text) as SdkJson;
      setError(null);
      onChange(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <JsonCodeEditor value={draft} onChange={apply} />
      {error && (
        <Callout tone="error" title="Invalid JSON">
          {error}
        </Callout>
      )}
    </div>
  );
}
