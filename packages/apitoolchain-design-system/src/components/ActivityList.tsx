import type { ReactNode } from "react";
import type { IconName } from "../icons";
import { Icon } from "../icons";
import type { BadgeTone } from "./Badge";

export interface ActivityItem {
  id: string;
  icon: IconName;
  tone?: BadgeTone;
  when: string;
  title: ReactNode;
  body?: ReactNode;
}

export interface ActivityListProps {
  items: ActivityItem[];
  empty?: ReactNode;
}

const TONE: Record<BadgeTone, string> = {
  neutral: "text-muted",
  info: "text-blue",
  success: "text-green",
  warning: "text-amber",
  error: "text-orange",
  accent: "text-pink",
};

/** A vertical feed of icon + timestamp + title/body rows (updates, events). */
export function ActivityList({ items, empty }: ActivityListProps) {
  if (items.length === 0) return <>{empty ?? null}</>;
  return (
    <div className="flex flex-col gap-[18px]">
      {items.map((it) => (
        <div key={it.id} className="flex items-start gap-3.5">
          <span
            className={`inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-tile bg-surface-raised ${TONE[it.tone ?? "info"]}`}
          >
            <Icon icon={it.icon} size={18} />
          </span>
          <div className="min-w-0">
            <div className="mb-0.5 text-xs leading-[18px] tracking-[0.01em] text-subtle">
              {it.when}
            </div>
            <div className="text-sm font-medium leading-5 text-body">
              {it.title}
            </div>
            {it.body && (
              <div className="mt-0.5 text-[13px] leading-[19px] text-muted">
                {it.body}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
