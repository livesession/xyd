import { Button, EmptyState } from "@apitoolchain/design-system";
import { useOutletContext } from "react-router";
import { RepositoryReleases } from "~/components/RepositoryModal";
import type { RegistryDetailContext } from "~/components/registryDetailShared";

export { registryDetailAction as action } from "~/lib/registryDetailAction";

export default function RegistryReleasesTab() {
  const { base, connections, releasesByConn, openConnect } =
    useOutletContext<RegistryDetailContext>();

  if (connections.length === 0) {
    return (
      <EmptyState
        icon="bolt"
        title="No releases yet"
        description="Connect a git repo on release mode to open versioned release PRs."
        action={
          <Button variant="secondary" icon="git" onClick={openConnect}>
            Connect repo
          </Button>
        }
      />
    );
  }
  return (
    <div className="flex flex-col gap-6">
      {connections.map((c) => (
        <RepositoryReleases
          key={c.id}
          connection={c}
          releases={releasesByConn[c.id] ?? []}
          actionPath={base}
        />
      ))}
    </div>
  );
}
