import { Icon } from "../icons";

export type LineStyle = "solid" | "dashed" | "none";
export type Tone = "default" | "warning";
export type StatLineTone = "pink" | "green" | "blue" | "orange" | "amber";

export interface StatTileProps {
  label: string;
  value: string;
  /** Accent tone for the solid trend line + dot. */
  lineTone?: StatLineTone;
  lineStyle?: LineStyle;
  tone?: Tone;
  /** Show the amber warning triangle beside the value. */
  warning?: boolean;
  /** Show the chevron after the label. Defaults to true. */
  showChevron?: boolean;
  /** Which side the solid line's end-dot sits on. Defaults to 'right'. */
  dotSide?: "left" | "right";
  /** When set, renders an action button instead of the trend line. */
  buttonLabel?: string;
  onAction?: () => void;
}

const LINE_BG: Record<StatLineTone, string> = {
  pink: "bg-pink",
  green: "bg-green",
  blue: "bg-blue",
  orange: "bg-orange",
  amber: "bg-amber",
};

const DOT_BORDER: Record<StatLineTone, string> = {
  pink: "border-pink",
  green: "border-green",
  blue: "border-blue",
  orange: "border-orange",
  amber: "border-amber",
};

/** A metric tile in the stats grid: label, big value, and a trend line or CTA. */
export function StatTile({
  label,
  value,
  lineTone = "pink",
  lineStyle = "solid",
  tone = "default",
  warning = false,
  showChevron = true,
  dotSide = "right",
  buttonLabel,
  onAction,
}: StatTileProps) {
  const hasButton = !!buttonLabel;
  const showLine = !hasButton && lineStyle !== "none";
  const showDot = !hasButton && lineStyle === "solid";

  return (
    <div
      className={`flex min-h-[150px] flex-col p-6 ${tone === "warning" ? "bg-surface-warning" : "bg-surface"}`}
    >
      <div className="flex items-center gap-[5px]">
        <span className="text-sm font-medium text-muted">{label}</span>
        {showChevron && (
          <span className="inline-flex text-subtle">
            <Icon icon="chevronRight" size={14} />
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-stat text-ink">{value}</span>
        {warning && (
          <span className="inline-flex text-amber">
            <Icon icon="alert" size={20} />
          </span>
        )}
      </div>

      {hasButton && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex w-fit cursor-pointer items-center gap-2 rounded-control border-none bg-amber-btn px-4 py-[9px] text-sm font-medium text-white transition-colors hover:bg-amber-btn-hover"
        >
          <Icon icon="creditCard" size={18} />
          {buttonLabel}
        </button>
      )}

      {showLine && (
        <div className="relative mt-auto pt-[22px]">
          <div
            className={`h-0.5 w-full ${
              lineStyle === "dashed"
                ? "bg-[repeating-linear-gradient(90deg,var(--color-track)_0_7px,transparent_7px_14px)]"
                : `rounded-sm ${LINE_BG[lineTone]}`
            }`}
          />
          {showDot && (
            <div
              className={`absolute bottom-[-4px] h-[11px] w-[11px] rounded-pill border-2 bg-surface ${DOT_BORDER[lineTone]} ${dotSide === "left" ? "left-0" : "right-0"}`}
            />
          )}
        </div>
      )}
    </div>
  );
}
