import { Collapse, Field } from "@apitoolchain/design-system";
import { SECTIONS } from "../model/fields";
import { getPath, setPath } from "../model/paths";
import type { SdkJson, SdkLanguage } from "../model/types";
import { LANGUAGE_META } from "../model/types";
import { ControlInput } from "./FormControls";

export function SdkForm({
  sdkJson,
  activeLanguage,
  onChange,
  formNonce,
  openSections = [],
  readOnlyFields = [],
}: {
  sdkJson: SdkJson;
  activeLanguage: SdkLanguage;
  onChange: (next: SdkJson) => void;
  /** bumped on external reset/load to remount uncontrolled controls. */
  formNonce: number;
  /** section ids to open by default (default: none open). */
  openSections?: string[];
  /** Field paths the host fixes (e.g. sdkName/version/api) — not rendered in the
   * form; a section left with no fields is skipped entirely. */
  readOnlyFields?: string[];
}) {
  const sectionKey = LANGUAGE_META[activeLanguage].sectionKey;
  const hidden = new Set(readOnlyFields);

  return (
    <div className="flex flex-col gap-2">
      {SECTIONS.map((section) => {
        const fields = section.fields.filter(
          (f) =>
            !hidden.has(f.path) &&
            (f.scope === "global" ||
              !f.langs ||
              f.langs.includes(activeLanguage)),
        );
        if (!fields.length) return null;
        return (
          <Collapse
            key={section.id}
            title={section.title}
            description={section.description}
            defaultOpen={openSections.includes(section.id)}
          >
            <div className="flex flex-col gap-3.5 pt-1">
              {fields.map((field) => {
                const path =
                  field.scope === "global"
                    ? field.path
                    : `${sectionKey}.${field.path}`;
                const value = getPath(sdkJson, path);
                return (
                  <Field
                    key={`${path}:${formNonce}`}
                    label={field.label}
                    hint={field.hint}
                    labelHint={field.labelHint}
                    htmlFor={path}
                  >
                    <ControlInput
                      field={field}
                      value={value}
                      onChange={(v) => onChange(setPath(sdkJson, path, v))}
                    />
                  </Field>
                );
              })}
            </div>
          </Collapse>
        );
      })}
    </div>
  );
}
