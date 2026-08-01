import {
  Badge,
  Button,
  Callout,
  EmptyState,
  Field,
  Input,
  Mono,
} from "@apitoolchain/design-system";
import { useEffect, useState } from "react";
import { DeleteConfirm } from "~/components/DeleteConfirm";
import { SettingsHeader } from "~/components/SettingsHeader";
import {
  addNamespace,
  listNamespaces,
  type Namespace,
  namespaceSlug,
  removeNamespace,
} from "~/data";

export function meta() {
  return [{ title: "Namespaces — apitoolchain" }];
}

export default function SettingsNamespacesRoute() {
  // Namespaces live in a client-side store — read after hydration.
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNamespaces(listNamespaces());
  }, []);

  const slug = namespaceSlug(name);
  const canAdd = slug.length > 0;

  function create() {
    if (!canAdd) return;
    const res = addNamespace({ name, description });
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setNamespaces(res.namespaces);
    setName("");
    setDescription("");
    setError(null);
  }

  return (
    <>
      <SettingsHeader active="namespaces" />

      <div className="flex max-w-[560px] flex-col gap-6">
        <p className="text-sm text-subtle">
          Namespaces group your API specs, schemas, and SDKs. A namespace is
          unique across the whole apitoolchain registry — pick one when
          importing a spec.
        </p>
        <div className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-5">
          <div className="text-sm font-semibold text-ink">
            Create a namespace
          </div>
          <Field
            label="Namespace"
            htmlFor="ns-name"
            hint={
              slug && slug !== name.trim().toLowerCase()
                ? `Will be created as "${slug}".`
                : "Lowercase letters, numbers and dashes."
            }
          >
            <Input
              id="ns-name"
              value={name}
              onChange={(v) => {
                setName(v);
                setError(null);
              }}
              placeholder="acme"
            />
          </Field>
          <Field label="Description" htmlFor="ns-desc" hint="Optional.">
            <Input
              id="ns-desc"
              value={description}
              onChange={setDescription}
              placeholder="Acme public APIs"
            />
          </Field>
          {error && <Callout tone="error">{error}</Callout>}
          <div>
            <Button
              variant="primary"
              icon="plus"
              onClick={create}
              disabled={!canAdd}
            >
              Create namespace
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-ink">Namespaces</div>
          {namespaces.length === 0 ? (
            <EmptyState
              icon="registry"
              title="No namespaces yet"
              description="Create a namespace above to group your specs and schemas."
            />
          ) : (
            <div className="flex flex-col divide-y divide-line-soft rounded-panel border border-line bg-surface">
              {namespaces.map((n) => (
                <div
                  key={n.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Badge tone="neutral" icon="registry">
                      ns
                    </Badge>
                    <div className="min-w-0">
                      <Mono>@{n.id}</Mono>
                      {n.description && (
                        <div className="truncate text-xs text-subtle">
                          {n.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <DeleteConfirm
                    title="Remove namespace"
                    description={`Remove the @${n.id} namespace?`}
                    confirmLabel="Remove"
                    onConfirm={() => setNamespaces(removeNamespace(n.id))}
                    trigger={(open) => (
                      <Button variant="ghost" size="sm" onClick={open}>
                        Remove
                      </Button>
                    )}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
