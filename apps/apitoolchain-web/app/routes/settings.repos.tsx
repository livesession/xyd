import {
  Badge,
  Breadcrumb,
  Button,
  EmptyState,
  Field,
  Input,
  Mono,
  PageHeader,
} from "@apitoolchain/design-system";
import { useEffect, useState } from "react";
import { RouterLink } from "~/components/RouterLink";
import { addRepo, listRepos, type Repo, removeRepo } from "~/data";

export function meta() {
  return [{ title: "Repositories — apitoolchain" }];
}

export default function SettingsReposRoute() {
  // Repos live in a client-side store (localStorage) — read after hydration.
  const [repos, setRepos] = useState<Repo[]>([]);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    setRepos(listRepos());
  }, []);

  const canAdd = url.trim().length > 0;
  function connect() {
    if (!canAdd) return;
    setRepos(addRepo({ url, name }));
    setUrl("");
    setName("");
  }

  return (
    <>
      <PageHeader
        breadcrumb={
          <Breadcrumb
            linkComponent={RouterLink}
            items={[
              { label: "Settings", href: "/settings" },
              { label: "Repositories" },
            ]}
          />
        }
        title="Repositories"
        description="Connect a GitHub repository so its specs and schemas sync into the registry from CI/CD or the CLI. (Sync is coming soon — connections are stored locally for now.)"
      />

      <div className="flex max-w-[560px] flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-5">
          <div className="text-sm font-semibold text-ink">
            Connect a repository
          </div>
          <Field
            label="Repository"
            htmlFor="repo-url"
            hint="A GitHub URL or owner/repo."
          >
            <Input
              id="repo-url"
              value={url}
              onChange={setUrl}
              placeholder="github.com/acme/petstore"
            />
          </Field>
          <Field label="Display name" htmlFor="repo-name" hint="Optional.">
            <Input
              id="repo-name"
              value={name}
              onChange={setName}
              placeholder="acme/petstore"
            />
          </Field>
          <div>
            <Button
              variant="primary"
              icon="plus"
              onClick={connect}
              disabled={!canAdd}
            >
              Connect repository
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-ink">
            Connected repositories
          </div>
          {repos.length === 0 ? (
            <EmptyState
              icon="box"
              title="No repositories connected"
              description="Connect a repository above to import its specs and schemas."
            />
          ) : (
            <div className="flex flex-col divide-y divide-line-soft rounded-panel border border-line bg-surface">
              {repos.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Badge tone="neutral" icon="box">
                      repo
                    </Badge>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ink">
                        {r.name}
                      </div>
                      <Mono tone="muted">{r.url}</Mono>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRepos(removeRepo(r.id))}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
