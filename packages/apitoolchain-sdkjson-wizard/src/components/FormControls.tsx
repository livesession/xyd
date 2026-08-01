import {
  Input,
  Segmented,
  Select,
  Textarea,
  Toggle,
} from "@apitoolchain/design-system";
import { useState } from "react";
import type { FieldDef } from "../model/fields";

/** Renders the DS control for one field descriptor, wired to `value`/`onChange`. */
export function ControlInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (field.control) {
    case "number":
      return (
        <Input
          type="number"
          value={value == null ? "" : String(value)}
          placeholder={field.placeholder}
          onChange={(v) => onChange(v === "" ? undefined : Number(v))}
        />
      );
    case "toggle":
      return (
        <Toggle
          checked={Boolean(value)}
          onChange={onChange}
          aria-label={field.label}
        />
      );
    case "select":
      return (
        <Select
          value={value == null ? "" : String(value)}
          options={field.options ?? []}
          onChange={(v) => onChange(v || undefined)}
        />
      );
    case "segmented": {
      const opts = (field.options ?? []).map((o) => o.value);
      const display = field.toDisplay
        ? field.toDisplay(value)
        : value == null
          ? opts[0]
          : String(value);
      return (
        <Segmented
          options={opts}
          value={display}
          onChange={(s) => onChange(field.toValue ? field.toValue(s) : s)}
        />
      );
    }
    case "json":
      return (
        <JsonField
          value={value}
          placeholder={field.placeholder}
          onChange={onChange}
        />
      );
    default:
      return (
        <Input
          value={value == null ? "" : String(value)}
          placeholder={field.placeholder}
          onChange={(v) => onChange(v || undefined)}
        />
      );
  }
}

/** A JSON-object field (mountRules, statusCodeMap, …): edits text, commits the
 * parsed object on valid JSON, surfaces an inline error otherwise (the last
 * valid value stays committed so the preview doesn't thrash). */
function JsonField({
  value,
  placeholder,
  onChange,
}: {
  value: unknown;
  placeholder?: string;
  onChange: (value: unknown) => void;
}) {
  const [text, setText] = useState(() =>
    value == null ? "" : JSON.stringify(value, null, 2),
  );
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-1">
      <Textarea
        mono
        rows={3}
        value={text}
        placeholder={placeholder}
        onChange={(t) => {
          setText(t);
          if (t.trim() === "") {
            setErr(null);
            onChange(undefined);
            return;
          }
          try {
            const parsed = JSON.parse(t);
            setErr(null);
            onChange(parsed);
          } catch {
            setErr("Invalid JSON");
          }
        }}
      />
      {err && <span className="text-[11px] text-danger">{err}</span>}
    </div>
  );
}
