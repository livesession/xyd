import {
  Button,
  Field,
  Input,
  Modal,
  Segmented,
  Toggle,
} from "@apitoolchain/design-system";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { RepoConnection } from "~/data";

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
        autoRelease: mode === "release" && autoRelease ? "1" : "",
        baseBranch,
        prerelease: mode === "release" && prerelease ? "1" : "",
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
  error,
}: ReleaseSettings) {
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
      {mode === "release" && (
        <>
          <div className="flex items-center gap-2 text-[13px] text-subtle">
            <Toggle
              checked={autoRelease}
              onChange={setAutoRelease}
              aria-label="Auto-release on new spec version"
            />
            Open/refresh a release PR on every new spec version
          </div>
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
}: {
  open: boolean;
  onClose: () => void;
  connection: RepoConnection;
  actionPath: string;
}) {
  const settings = useReleaseSettings(connection, actionPath, onClose);
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
