import {
  Button,
  Field,
  Input,
  Modal,
  Segmented,
  Select,
  Textarea,
} from "@apitoolchain/design-system";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { RegisterApiResult } from "~/data";

export function RegisterApiModal({
  open,
  onClose,
  kind = "api",
}: {
  open: boolean;
  onClose: () => void;
  /** `api` imports an OpenAPI/GraphQL/AsyncAPI spec; `schema` a JSON Schema. */
  kind?: "api" | "schema";
}) {
  const isSchema = kind === "schema";
  const noun = isSchema ? "schema" : "API";
  const fetcher = useFetcher();
  const [name, setName] = useState("");
  const [ns, setNs] = useState("");
  const [format, setFormat] = useState("openapi");
  const [mode, setMode] = useState("Paste");
  const [specText, setSpecText] = useState("");
  const [url, setUrl] = useState("");

  const submitting = fetcher.state !== "idle";
  const result = fetcher.data as RegisterApiResult | undefined;
  // `fetcher.data` persists across close/reopen — only surface an error/close
  // for a submission made in THIS open session, so a stale error/success from a
  // prior attempt doesn't reappear.
  const submitted = useRef(false);
  const [dirty, setDirty] = useState(false);
  const error = dirty && result && !result.ok ? result.message : null;

  // A fresh open clears any stale result from a previous attempt.
  useEffect(() => {
    if (open) setDirty(false);
  }, [open]);

  // Close + reset once OUR submission succeeds (RR revalidates the list).
  useEffect(() => {
    if (submitted.current && fetcher.state === "idle" && result?.ok) {
      submitted.current = false;
      onClose();
      setName("");
      setNs("");
      setSpecText("");
      setUrl("");
    }
  }, [fetcher.state, result, onClose]);

  const canSubmit =
    name.trim().length > 0 &&
    (mode === "Paste" ? specText.trim().length > 0 : url.trim().length > 0);

  function submit() {
    if (!canSubmit || submitting) return;
    submitted.current = true;
    setDirty(true);
    fetcher.submit(
      {
        name,
        ns,
        kind,
        format: isSchema ? "jsonschema" : format,
        ...(mode === "Paste" ? { specText } : { url }),
      },
      { method: "post", action: "/registry" },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Import ${noun}`}
      description={
        isSchema
          ? "Import a standalone JSON Schema — versioned and referenceable from the registry."
          : "Import an OpenAPI, GraphQL, or AsyncAPI spec — then generate SDKs, docs, and an MCP server from it."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon="plus"
            onClick={submit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? "Importing…" : `Import ${noun}`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Name">
          <Input value={name} onChange={setName} placeholder="Petstore" />
        </Field>

        <div className={isSchema ? "" : "grid grid-cols-2 gap-4"}>
          <Field
            label="Namespace"
            hint={isSchema ? "Groups related schemas." : "Groups related APIs."}
          >
            <Input value={ns} onChange={setNs} placeholder="acme" />
          </Field>
          {!isSchema && (
            <Field label="Format">
              <Select
                value={format}
                onChange={setFormat}
                options={[
                  { value: "openapi", label: "OpenAPI" },
                  { value: "graphql", label: "GraphQL" },
                  { value: "asyncapi", label: "AsyncAPI" },
                ]}
              />
            </Field>
          )}
        </div>

        <Field label={isSchema ? "Schema source" : "Spec source"}>
          <div className="flex flex-col gap-2">
            <Segmented
              options={["Paste", "URL"]}
              value={mode}
              onChange={setMode}
            />
            {mode === "Paste" ? (
              <Textarea
                mono
                rows={10}
                value={specText}
                onChange={setSpecText}
                placeholder={
                  isSchema
                    ? '{\n  "$schema": "https://json-schema.org/draft/2020-12/schema",\n  "title": "Address",\n  "type": "object",\n  "properties": { "street": { "type": "string" } }\n}'
                    : "openapi: 3.0.0\ninfo: { title: Petstore, version: 1.0.0 }\npaths: { /pets: { get: { responses: { '200': { description: ok } } } } }"
                }
              />
            ) : (
              <Input
                value={url}
                onChange={setUrl}
                placeholder={
                  isSchema
                    ? "https://schemas.example.com/address.json"
                    : "https://api.example.com/openapi.yaml"
                }
              />
            )}
          </div>
        </Field>

        {error && (
          <div className="rounded-control bg-danger-bg px-3 py-2 text-[13px] text-danger">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
