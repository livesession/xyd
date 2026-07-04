import { useState } from "react";

export interface SegmentedProps {
  options?: string[];
  /** Initially-selected value (uncontrolled). Defaults to the first option. */
  value?: string;
  onChange?: (value: string) => void;
}

const DEFAULT_OPTIONS = ["24h", "7d", "30d", "90d"];

/** Pill-style segmented control (e.g. the 24h/7d/30d/90d range toggle). */
export function Segmented({ options, value, onChange }: SegmentedProps) {
  const opts = options?.length ? options : DEFAULT_OPTIONS;
  const [selected, setSelected] = useState<string>(value ?? opts[0]);

  return (
    <div className="inline-flex w-fit items-center gap-0.5 self-start rounded-pill bg-surface-pill p-[3px]">
      {opts.map((label) => {
        const active = label === selected;
        return (
          <button
            key={label}
            type="button"
            onClick={() => {
              setSelected(label);
              onChange?.(label);
            }}
            className={`cursor-pointer rounded-pill px-4 py-1.5 text-sm transition-colors ${
              active
                ? "bg-surface font-semibold text-ink shadow-pill"
                : "font-medium text-subtle hover:text-ink"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
