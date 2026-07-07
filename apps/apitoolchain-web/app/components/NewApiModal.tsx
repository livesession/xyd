import { Badge, Modal, OptionCard } from "@apitoolchain/design-system";
import type { EntryKind } from "~/data";

/**
 * The "New API" entry point: a small modal that lets you choose how to create an
 * entry — import an existing spec, or start from a blank one. "Start from
 * scratch" is disabled for now (coming soon).
 */
export function NewApiModal({
  open,
  onClose,
  onImport,
  kind = "api",
}: {
  open: boolean;
  onClose: () => void;
  /** The "Import a spec" choice — the parent opens the import modal. */
  onImport: () => void;
  kind?: EntryKind;
}) {
  const isSchema = kind === "schema";
  const noun = isSchema ? "schema" : "API";
  return (
    <Modal open={open} onClose={onClose} size="sm" title={`New ${noun}`}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <OptionCard
          title="Import a spec"
          description={
            isSchema
              ? "Bring an existing JSON Schema."
              : "Bring an existing OpenAPI, GraphQL or AsyncAPI spec."
          }
          onClick={onImport}
        />
        <OptionCard
          title="Start from scratch"
          description={`Design a new ${noun} from a blank spec.`}
          media={<Badge tone="neutral">Soon</Badge>}
          disabled
        />
      </div>
    </Modal>
  );
}
