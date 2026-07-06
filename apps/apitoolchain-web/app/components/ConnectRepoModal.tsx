import {
  Badge,
  Button,
  Field,
  type IconName,
  Input,
  Modal,
  OptionCard,
  Segmented,
  Select,
  Toggle,
} from "@apitoolchain/design-system";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { GitProvider, GitProviderKind, GitRepoOption } from "~/data";

type ConnectResult = { ok: boolean; message?: string };
type Mode = "existing" | "create" | null;

/** Brand icon per provider kind (design-system icon registry). */
export const KIND_ICON: Record<GitProviderKind, IconName> = {
  gitea: "gitea",
  github: "github",
  gitlab: "gitlab",
  bitbucket: "bitbucket",
};

/**
 * Link the current entity (API spec or SDK target) to a repo.
 * Step 1: pick a provider + choose a mode (OptionCard). Step 2: for an existing
 * repo it's a wizard (Select repo → Select branch); for a new repo, name +
 * visibility. Posts `intent=connect-repo` to the route action.
 */
export function ConnectRepoModal({
  open,
  onClose,
  providers,
  actionPath,
  targetKind = "sdk",
}: {
  open: boolean;
  onClose: () => void;
  providers: GitProvider[];
  actionPath: string;
  /** What's being connected — drives copy (e.g. the new-repo name placeholder). */
  targetKind?: "spec" | "sdk";
}) {
  const submit = useFetcher();
  const repos = useFetcher(); // GET /git/repos?providerId=…
  const branches = useFetcher(); // GET /git/repos?providerId=…&repo=…
  const [providerId, setProviderId] = useState(providers[0]?.id ?? "");
  const [mode, setMode] = useState<Mode>(null);
  const [repo, setRepo] = useState(""); // existing fullName OR new repo name
  const [branch, setBranch] = useState("");
  const [prefix, setPrefix] = useState("");
  const [makePrivate, setMakePrivate] = useState(false);
  // New connections default to PR-based release mode (auto-release on).
  const [releaseMode, setReleaseMode] = useState("release");
  const [autoRelease, setAutoRelease] = useState(true);

  const submitting = submit.state !== "idle";
  const submitted = useRef(false);
  const [dirty, setDirty] = useState(false);
  const result = submit.data as ConnectResult | undefined;
  const error = dirty && result && !result.ok ? result.message : null;

  useEffect(() => {
    if (open) {
      setProviderId(providers[0]?.id ?? "");
      setMode(null);
      setRepo("");
      setBranch("");
      setPrefix("");
      setMakePrivate(false);
      setReleaseMode("release");
      setAutoRelease(true);
      setDirty(false);
    }
  }, [open, providers]);

  useEffect(() => {
    if (submitted.current && submit.state === "idle" && result?.ok) {
      submitted.current = false;
      onClose();
    }
  }, [submit.state, result, onClose]);

  // Load repos when entering "existing" mode / switching provider.
  const loadRepos = repos.load;
  useEffect(() => {
    if (open && mode === "existing" && providerId) {
      loadRepos(`/git/repos?providerId=${encodeURIComponent(providerId)}`);
      setRepo("");
      setBranch("");
    }
  }, [open, mode, providerId, loadRepos]);

  // Wizard step 2: load the chosen repo's branches.
  const loadBranches = branches.load;
  useEffect(() => {
    if (open && mode === "existing" && providerId && repo) {
      loadBranches(
        `/git/repos?providerId=${encodeURIComponent(providerId)}&repo=${encodeURIComponent(repo)}`,
      );
    }
  }, [open, mode, providerId, repo, loadBranches]);

  const repoList =
    (repos.data as { repos?: GitRepoOption[] } | undefined)?.repos ?? [];
  const reposLoading = repos.state !== "idle";
  const branchList =
    (branches.data as { branches?: string[] } | undefined)?.branches ?? [];
  const branchesLoading = branches.state !== "idle";
  const provider = providers.find((p) => p.id === providerId);

  // Keep the selected branch valid: once the real branches load, if the current
  // pick isn't among them, snap to the first one (avoids submitting a phantom
  // branch that doesn't exist in the repo).
  useEffect(() => {
    if (
      mode === "existing" &&
      repo &&
      branchList.length > 0 &&
      !branchList.includes(branch)
    ) {
      setBranch(branchList[0]);
    }
  }, [mode, repo, branch, branchList]);

  function onPickRepo(fullName: string) {
    setRepo(fullName);
    const r = repoList.find((x) => x.fullName === fullName);
    setBranch(r?.defaultBranch ?? "");
  }

  const canSubmit =
    !!providerId &&
    !!mode &&
    repo.trim().length > 0 &&
    (mode === "create" || branch.length > 0);

  function connect() {
    if (!canSubmit || submitting) return;
    submitted.current = true;
    setDirty(true);
    submit.submit(
      {
        intent: "connect-repo",
        providerId,
        repo: repo.trim(),
        createRepo: mode === "create" ? "1" : "",
        makePrivate: mode === "create" && makePrivate ? "1" : "",
        branch,
        prefix,
        releaseMode,
        autoRelease: releaseMode === "release" && autoRelease ? "1" : "",
      },
      { method: "post", action: actionPath },
    );
  }

  const prefixField = (
    <Field
      label="Path prefix"
      htmlFor="cr-prefix"
      hint="Optional subdirectory — leave empty to push to the repo root."
    >
      <Input
        id="cr-prefix"
        value={prefix}
        onChange={setPrefix}
        placeholder="(repo root)"
      />
    </Field>
  );

  const releaseModeField = (
    <Field
      label="Release mode"
      labelHint="Direct push commits straight to the branch. Release opens a versioned PR (with a changelog) and tags + cuts a Release when it's merged."
    >
      <Segmented
        options={["Release PRs", "Direct push"]}
        value={releaseMode === "release" ? "Release PRs" : "Direct push"}
        onChange={(v) =>
          setReleaseMode(v === "Release PRs" ? "release" : "push")
        }
      />
      {releaseMode === "release" && (
        <div className="mt-2 flex items-center gap-2 text-[13px] text-subtle">
          <Toggle
            checked={autoRelease}
            onChange={setAutoRelease}
            aria-label="Auto-release on new spec version"
          />
          Open/refresh a release PR on every new spec version
        </div>
      )}
    </Field>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Connect a repo"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {providers.length > 0 && mode && (
            <Button
              variant="primary"
              icon="git"
              onClick={connect}
              disabled={!canSubmit || submitting}
            >
              {submitting ? "Connecting…" : "Connect"}
            </Button>
          )}
        </>
      }
    >
      {providers.length === 0 ? (
        <p className="text-sm text-subtle">
          No git providers connected yet. Add one under{" "}
          <a
            href="/settings/connections"
            className="font-medium text-ink underline underline-offset-2"
          >
            Settings → Connections
          </a>{" "}
          first.
        </p>
      ) : mode === null ? (
        // Step 1: pick a provider + a mode.
        <div className="flex flex-col gap-4">
          <Field label="Provider" htmlFor="cr-provider">
            <Select
              id="cr-provider"
              value={providerId}
              onChange={setProviderId}
              leadingIcon={provider ? KIND_ICON[provider.kind] : undefined}
              options={providers.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.connectedAs})`,
              }))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <OptionCard
              title="Pick an existing repo"
              description="Choose a repo, then a branch."
              onClick={() => setMode("existing")}
            />
            <OptionCard
              title="Create a new repo"
              description={`New repo under ${provider?.connectedAs ?? "your account"}.`}
              onClick={() => {
                setMode("create");
                setRepo("");
                setBranch("");
              }}
            />
          </div>
        </div>
      ) : (
        // Step 2: chosen provider (compact) + the mode's form.
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode(null)}
              aria-label="Back"
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control border border-line text-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <span aria-hidden>←</span>
            </button>
            {provider && (
              <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-control border border-line bg-surface-muted px-3">
                <Badge tone="neutral" icon={KIND_ICON[provider.kind]}>
                  {provider.kind}
                </Badge>
                <span className="truncate text-sm font-medium text-ink">
                  {provider.name}
                </span>
                <span className="truncate text-xs text-subtle">
                  {provider.connectedAs}
                </span>
              </div>
            )}
          </div>

          {mode === "existing" && (
            <>
              <Field label="Repository" htmlFor="cr-repo">
                <Select
                  id="cr-repo"
                  value={repo}
                  onChange={onPickRepo}
                  options={[
                    {
                      value: "",
                      label: reposLoading
                        ? "Loading repos…"
                        : repoList.length
                          ? "Select a repo…"
                          : "No repos found",
                    },
                    ...repoList.map((r) => ({
                      value: r.fullName,
                      label: r.fullName,
                    })),
                  ]}
                />
              </Field>
              {repo && (
                <>
                  <Field
                    label="Branch"
                    htmlFor="cr-branch"
                    hint="Where the files are pushed."
                  >
                    <Select
                      id="cr-branch"
                      value={branch}
                      onChange={setBranch}
                      options={(branchList.length
                        ? branchList
                        : branch
                          ? [branch]
                          : []
                      ).map((b) => ({
                        value: b,
                        label:
                          branchesLoading && !branchList.length
                            ? `${b} (loading…)`
                            : b,
                      }))}
                    />
                  </Field>
                  {prefixField}
                  {releaseModeField}
                </>
              )}
            </>
          )}

          {mode === "create" && (
            <>
              <Field
                label="Repository name"
                htmlFor="cr-name"
                hint={`Created under ${provider?.connectedAs ?? "your account"}.`}
              >
                <Input
                  id="cr-name"
                  value={repo}
                  onChange={setRepo}
                  placeholder={targetKind === "spec" ? "my-api-spec" : "my-sdk"}
                />
              </Field>
              <Field label="Visibility">
                <Segmented
                  options={["Public", "Private"]}
                  value={makePrivate ? "Private" : "Public"}
                  onChange={(v) => setMakePrivate(v === "Private")}
                />
              </Field>
              <Field
                label="Branch"
                htmlFor="cr-cbranch"
                hint="Initial branch for the new repo."
              >
                <Input
                  id="cr-cbranch"
                  value={branch}
                  onChange={setBranch}
                  placeholder="main"
                />
              </Field>
              {prefixField}
              {releaseModeField}
            </>
          )}

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
