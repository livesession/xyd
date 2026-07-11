import { Button, EmptyState } from "@apitoolchain/design-system";
import { useOutletContext } from "react-router";
import { RepositorySettings } from "~/components/RepositoryModal";
import type { RegistryDetailContext } from "~/components/registryDetailShared";

export { registryDetailAction as action } from "~/lib/registryDetailAction";

export default function RegistryRepositoryTab() {
  const { base, connections, openConnect } =
    useOutletContext<RegistryDetailContext>();

  if (connections.length === 0) {
    return (
      <EmptyState
        icon="git"
        title="No repositories connected"
        description="Connect a git repo to sync this spec or open release PRs."
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
        <RepositorySettings key={c.id} connection={c} actionPath={base} />
      ))}
      <div>
        <Button variant="secondary" size="sm" icon="git" onClick={openConnect}>
          Connect another repo
        </Button>
      </div>
    </div>
  );
}
