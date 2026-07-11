import { Button, StatusPill } from "@apitoolchain/design-system";
import { useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import type { Release, RepoConnection } from "~/data";
import { DeleteConfirm } from "./DeleteConfirm";
import {
  ReleaseSettingsFields,
  useReleaseSettings,
} from "./ReleaseSettingsModal";
import { ReleasesPanel } from "./ReleasesModal";

/**
 * The RELEASE management for one connected repo — the rolling PR (release mode)
 * or a manual sync (direct-push mode). Lives under the API page's Releases tab.
 */
export function RepositoryReleases({
  connection,
  releases,
  actionPath,
}: {
  connection: RepoConnection;
  releases: Release[];
  actionPath: string;
}) {
  return connection.releaseMode === "release" ? (
    <ReleasesPanel
      connection={connection}
      releases={releases}
      actionPath={actionPath}
    />
  ) : (
    <SyncPanel connection={connection} actionPath={actionPath} />
  );
}

/**
 * The SETTINGS for one connected repo — release mode + Save + Remove. Lives
 * under the API page's Repository tab.
 */
export function RepositorySettings({
  connection,
  actionPath,
  onRemoved,
}: {
  connection: RepoConnection;
  actionPath: string;
  onRemoved?: () => void;
}) {
  const settings = useReleaseSettings(
    connection,
    actionPath,
    onRemoved ?? (() => {}),
  );
  return (
    <div className="flex flex-col gap-5">
      <ReleaseSettingsFields {...settings} />
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={settings.save}
          disabled={settings.submitting}
        >
          {settings.submitting ? "Saving…" : "Save settings"}
        </Button>
      </div>
      <RemoveConnection
        connection={connection}
        actionPath={actionPath}
        onRemoved={onRemoved ?? (() => {})}
      />
    </div>
  );
}

/** Direct-push connections don't do PR releases — offer a manual Sync instead. */
function SyncPanel({
  connection,
  actionPath,
}: {
  connection: RepoConnection;
  actionPath: string;
}) {
  const sync = useFetcher();
  const busy = sync.state !== "idle";
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-subtle">
        Direct-push mode — commits are synced straight to the branch. Switch to{" "}
        <strong>Release PRs</strong> in the Repository tab for versioned,
        PR-based releases.
      </p>
      <div className="flex items-center justify-between gap-3 rounded-control border border-line bg-surface p-3">
        <StatusPill
          status={busy ? "building" : (connection.lastSyncStatus ?? "draft")}
        />
        <sync.Form method="post" action={actionPath}>
          <input type="hidden" name="intent" value="sync-repo" />
          <input type="hidden" name="id" value={connection.id} />
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            icon="git"
            disabled={busy}
          >
            {busy ? "Syncing…" : "Sync now"}
          </Button>
        </sync.Form>
      </div>
    </div>
  );
}

/** The danger action inside Settings — disconnect the repo. */
function RemoveConnection({
  connection,
  actionPath,
  onRemoved,
}: {
  connection: RepoConnection;
  actionPath: string;
  onRemoved: () => void;
}) {
  const disconnect = useFetcher();
  const removing = disconnect.state !== "idle";
  const removed = useRef(false);
  useEffect(() => {
    if (removed.current && disconnect.state === "idle") {
      removed.current = false;
      onRemoved();
    }
  }, [disconnect.state, onRemoved]);

  return (
    <div className="flex items-center justify-between gap-3 rounded-control border border-line-soft bg-surface-muted p-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-ink">Remove connection</span>
        <span className="text-[13px] text-subtle">
          Disconnect this repo. Generated files already pushed stay in the repo.
        </span>
      </div>
      <DeleteConfirm
        title="Remove connection"
        description={`Disconnect ${connection.repo}? Files already pushed stay in the repo — it just stops syncing.`}
        confirmLabel="Remove"
        confirming={removing}
        busyLabel="Removing…"
        onConfirm={() => {
          removed.current = true;
          disconnect.submit(
            { intent: "disconnect-repo", id: connection.id },
            { method: "post", action: actionPath },
          );
        }}
        trigger={(open) => (
          <Button variant="danger" size="sm" onClick={open} disabled={removing}>
            Remove
          </Button>
        )}
      />
    </div>
  );
}
