import {
  Badge,
  Breadcrumb,
  Button,
  type Column,
  DescriptionList,
  Icon,
  Mono,
  PageHeader,
  Pagination,
  Table,
  Tabs,
} from "@apitoolchain/design-system";
import { useState } from "react";
import { redirect, useFetcher, useRevalidator } from "react-router";
import { DeleteConfirm } from "~/components/DeleteConfirm";
import { RouterLink } from "~/components/RouterLink";
import {
  type GitProviderKind,
  type GitRepoOption,
  listGitProviders,
  listProviderRepos,
  removeGitProvider,
} from "~/data";
import type { Route } from "./+types/settings.connections.$providerId";

const KIND_LABEL: Record<GitProviderKind, string> = {
  gitea: "Gitea",
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Bitbucket",
};
const PER_PAGE = 8;

export function meta() {
  return [{ title: "Connection — apitoolchain" }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const providers = await listGitProviders();
  const provider = providers.find((p) => p.id === params.providerId);
  if (!provider) throw new Response("Not Found", { status: 404 });
  // `listProviderRepos` is `no-store`, so revalidating this loader is a real
  // hard refresh — it re-hits the provider and picks up brand-new repos.
  const repos = await listProviderRepos(provider.id);
  return { provider, repos };
}

export async function action({ params, request }: Route.ActionArgs) {
  const form = await request.formData();
  if (form.get("intent") === "remove") {
    await removeGitProvider(params.providerId);
    return redirect("/settings/connections");
  }
  return null;
}

export default function ConnectionDetailRoute({
  loaderData,
}: Route.ComponentProps) {
  const { provider, repos } = loaderData;
  const revalidator = useRevalidator();
  const remove = useFetcher();
  const [tab, setTab] = useState<"repositories" | "details">("repositories");
  const refreshing = revalidator.state !== "idle";
  const removing = remove.state !== "idle";

  return (
    <>
      <PageHeader
        breadcrumb={
          <Breadcrumb
            linkComponent={RouterLink}
            items={[
              { label: "Settings", href: "/settings" },
              { label: "Connections", href: "/settings/connections" },
              { label: provider.name },
            ]}
          />
        }
        title={provider.name}
        description={`${KIND_LABEL[provider.kind]} · ${provider.connectedAs}${provider.baseUrl ? ` · ${provider.baseUrl}` : ""}`}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => revalidator.revalidate()}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing…" : "Hard refresh"}
            </Button>
            <DeleteConfirm
              title="Remove connection"
              description={`Disconnect ${provider.name}? Repos linked through it stop syncing until it's reconnected.`}
              warning="This can't be undone."
              confirmText={provider.name}
              confirmLabel="Remove connection"
              confirming={removing}
              busyLabel="Removing…"
              onConfirm={() =>
                remove.submit({ intent: "remove" }, { method: "post" })
              }
              trigger={(open) => (
                <Button variant="danger" onClick={open} disabled={removing}>
                  Remove
                </Button>
              )}
            />
          </>
        }
      />
      <div className="border-line-soft border-b">
        <Tabs
          activeKey={tab}
          onChange={(k) => setTab(k as typeof tab)}
          items={[
            { key: "repositories", label: "Repositories", count: repos.length },
            { key: "details", label: "Details" },
          ]}
        />
      </div>
      <div className="mt-5">
        {tab === "repositories" ? (
          <ReposTab repos={repos} loading={refreshing} />
        ) : (
          <DetailsTab provider={provider} />
        )}
      </div>
    </>
  );
}

function ReposTab({
  repos,
  loading,
}: {
  repos: GitRepoOption[];
  loading: boolean;
}) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(repos.length / PER_PAGE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * PER_PAGE;
  const shown = repos.slice(start, start + PER_PAGE);

  const columns: Column<GitRepoOption>[] = [
    {
      key: "fullName",
      header: "Repository",
      render: (r) => <Mono>{r.fullName}</Mono>,
    },
    {
      key: "private",
      header: "Visibility",
      width: "sm",
      render: (r) => (
        <Badge tone={r.private ? "info" : "neutral"}>
          {r.private ? "Private" : "Public"}
        </Badge>
      ),
    },
    {
      key: "defaultBranch",
      header: "Default branch",
      width: "md",
      render: (r) => <Mono tone="muted">{r.defaultBranch}</Mono>,
    },
    {
      key: "link",
      header: "",
      width: "xs",
      align: "right",
      render: (r) =>
        r.htmlUrl ? (
          <a
            href={r.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="text-muted hover:text-ink"
            aria-label={`Open ${r.fullName}`}
          >
            <Icon icon="externalLink" size={14} />
          </a>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <Table<GitRepoOption>
        columns={columns}
        rows={shown}
        getRowKey={(r) => r.fullName}
        empty={
          loading
            ? "Loading repositories…"
            : "No repositories are visible to this connection."
        }
      />
      {repos.length > 0 && (
        <Pagination
          page={current}
          pageCount={pageCount}
          onPageChange={setPage}
          summary={`${start + 1}–${start + shown.length} of ${repos.length}`}
        />
      )}
    </div>
  );
}

function DetailsTab({
  provider,
}: {
  provider: Route.ComponentProps["loaderData"]["provider"];
}) {
  return (
    <DescriptionList
      items={[
        { label: "Provider", value: KIND_LABEL[provider.kind] },
        { label: "Account", value: <Mono>{provider.connectedAs}</Mono> },
        {
          label: "Base URL",
          value: provider.baseUrl ? (
            <Mono>{provider.baseUrl}</Mono>
          ) : (
            <span className="text-muted">Default</span>
          ),
        },
        { label: "Connected", value: provider.createdAt },
      ]}
    />
  );
}
