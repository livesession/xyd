import type { IconName } from "../icons";
import { Icon } from "../icons";

export interface ChecklistItemProps {
  icon: IconName;
  label: string;
  /** Optional step number prefixed to the label (e.g. "1. Create an API key"). */
  step?: number;
  /** Mark the step complete — the label is struck through and muted. */
  done?: boolean;
}

/** A numbered onboarding step: circular icon badge + label. */
export function ChecklistItem({ icon, label, step, done }: ChecklistItemProps) {
  const text = step != null ? `${step}. ${label}` : label;
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border border-line bg-surface text-ink">
        <Icon icon={done ? "check" : icon} size={16} />
      </span>
      <span
        className={
          done
            ? "text-sm font-medium text-subtle line-through"
            : "text-sm font-medium text-ink"
        }
      >
        {text}
      </span>
    </div>
  );
}
