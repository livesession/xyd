import {
  Button,
  Combobox,
  type ComboboxOption,
  Field,
  Input,
  Modal,
  Segmented,
  Toggle,
} from "@apitoolchain/design-system";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { RepoConnection } from "~/data";

/** Parse a connection's comma-joined `dist_tags` into an array (default latest). */
function parseDistTags(s?: string): string[] {
  const tags = (s ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return tags.length ? tags : ["latest"];
}

/**
 * Per-connection release settings state + save, decoupled from any chrome so it
 * can back either {@link ReleaseSettingsModal} or the repository modal's Settings
 * tab. Posts `intent=release-config` to the owning resource route's action and
 * calls `onSaved` once it lands.
 */
export function useReleaseSettings(
  connection: RepoConnection,
  actionPath: string,
  onSaved: () => void,
  distTagOptions: string[] = [],
) {
  const submit = useFetcher();
  const [mode, setMode] = useState(
    connection.releaseMode === "release" ? "release" : "push",
  );
  const [autoRelease, setAutoRelease] = useState(
    connection.autoRelease ?? true,
  );
  const [baseBranch, setBaseBranch] = useState(connection.baseBranch ?? "");
  const [prerelease, setPrerelease] = useState(connection.prerelease ?? false);
  const [distTags, setDistTags] = useState<string[]>(
    parseDistTags(connection.distTags),
  );

  const submitting = submit.state !== "idle";
  const submitted = useRef(false);
  const result = submit.data as { ok?: boolean; message?: string } | undefined;
  const error = result && result.ok === false ? result.message : null;

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset when the connection identity changes
  useEffect(() => {
    setMode(connection.releaseMode === "release" ? "release" : "push");
    setAutoRelease(connection.autoRelease ?? true);
    setBaseBranch(connection.baseBranch ?? "");
    setPrerelease(connection.prerelease ?? false);
    setDistTags(parseDistTags(connection.distTags));
  }, [connection.id]);

  useEffect(() => {
    if (
      submitted.current &&
      submit.state === "idle" &&
      result &&
      result.ok !== false
    ) {
      submitted.current = false;
      onSaved();
    }
  }, [submit.state, result, onSaved]);

  function save() {
    if (submitting) return;
    submitted.current = true;
    submit.submit(
      {
        intent: "release-config",
        id: connection.id,
        releaseMode: mode,
        // Auto-sync + its dist-tag filter apply to both modes (push commits
        // straight to the branch; release opens a PR). Base-branch/prerelease
        // are release-only.
        autoRelease: autoRelease ? "1" : "",
        baseBranch,
        prerelease: mode === "release" && prerelease ? "1" : "",
        distTags: autoRelease ? distTags.join(",") || "latest" : "",
      },
      { method: "post", action: actionPath },
    );
  }

  return {
    mode,
    setMode,
    autoRelease,
    setAutoRelease,
    baseBranch,
    setBaseBranch,
    prerelease,
    setPrerelease,
    distTags,
    setDistTags,
    distTagOptions,
    save,
    submitting,
    error,
  };
}

export type ReleaseSettings = ReturnType<typeof useReleaseSettings>;

/** The release-settings form fields — controlled by {@link useReleaseSettings}. */
export function ReleaseSettingsFields({
  mode,
  setMode,
  autoRelease,
  setAutoRelease,
  baseBranch,
  setBaseBranch,
  prerelease,
  setPrerelease,
  distTags,
  setDistTags,
  distTagOptions,
  error,
}: ReleaseSettings) {
  const tagOptions: ComboboxOption[] = [
    {
      value: "*",
      label: "All dist-tags",
      exclusive: true,
      icon: "tags-outline",
    },
    ...[...new Set(["latest", ...distTagOptions])].map((t) => ({ value: t })),
  ];
  return (
    <div className="flex flex-col gap-4">
      <Field
        label="Mode"
        labelHint="Direct push commits straight to the branch. Release opens a versioned PR (with a changelog) and tags + cuts a Release when it's merged."
      >
        <Segmented
          options={["Release PRs", "Direct push"]}
          value={mode === "release" ? "Release PRs" : "Direct push"}
          onChange={(v) => setMode(v === "Release PRs" ? "release" : "push")}
        />
      </Field>
      {/* Auto-sync + its dist-tag filter apply to both modes. */}
      <div className="flex items-center gap-2 text-[13px] text-subtle">
        <Toggle
          checked={autoRelease}
          onChange={setAutoRelease}
          aria-label="Auto-sync on new spec version"
        />
        {mode === "release"
          ? "Open/refresh a release PR on every new spec version"
          : "Commit the regenerated SDK to the branch on every new spec version"}
      </div>
      {autoRelease && (
        <Field
          label="Dist-tags"
          labelHint='Which published dist-tags trigger this. Default: latest. Pick "All", check tags, or type your own.'
        >
          <Combobox
            value={distTags}
            onChange={setDistTags}
            options={tagOptions}
            placeholder="latest"
          />
        </Field>
      )}
      {mode === "release" && (
        <>
          <Field
            label="Base branch"
            htmlFor="rs-base"
            hint="PR target branch — leave empty for the repo default."
          >
            <Input
              id="rs-base"
              value={baseBranch}
              onChange={setBaseBranch}
              placeholder="(repo default)"
            />
          </Field>
          <div className="flex items-center gap-2 text-[13px] text-subtle">
            <Toggle
              checked={prerelease}
              onChange={setPrerelease}
              aria-label="Mark releases as pre-release"
            />
            Mark the git Release as a pre-release
          </div>
        </>
      )}
      {error && (
        <div className="rounded-control bg-danger-bg px-3 py-2 text-[13px] text-danger">
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Per-connection release settings modal. Opened from the connection's row on the
 * SDK target page. Thin wrapper over {@link useReleaseSettings} +
 * {@link ReleaseSettingsFields}.
 */
export function ReleaseSettingsModal({
  open,
  onClose,
  connection,
  actionPath,
  distTagOptions = [],
}: {
  open: boolean;
  onClose: () => void;
  connection: RepoConnection;
  actionPath: string;
  /** The API's currently-available dist-tags, offered in the release filter. */
  distTagOptions?: string[];
}) {
  const settings = useReleaseSettings(
    connection,
    actionPath,
    onClose,
    distTagOptions,
  );
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={`Release settings · ${connection.repo}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={settings.save}
            disabled={settings.submitting}
          >
            {settings.submitting ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <ReleaseSettingsFields {...settings} />
    </Modal>
  );
}
