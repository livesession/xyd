import { type ReactNode, useEffect, useId, useState } from "react";
import { Icon, type IconName } from "../icons";
import { ButtonCTA } from "./ButtonCTA";

export interface ModalAnnounceStep {
  title: string;
  description: string;
  /** Optional hero media (illustration / screenshot) shown above the text. */
  media?: ReactNode;
}

export interface ModalAnnounceProps {
  open: boolean;
  onClose: () => void;
  /** One or more steps; a dot indicator + Next appear when there's more than one. */
  steps: ModalAnnounceStep[];
  /** Label for the final step's primary button. Default `Get started`. */
  finishLabel?: string;
  /** Fired when the final step's button is pressed (before `onClose`). */
  onFinish?: () => void;
}

/**
 * A centered announcement / onboarding dialog: a hero media area, a title +
 * description, an optional multi-step dot indicator, and a Next / finish button.
 * Click-scrim + Escape close (SSR-safe: renders nothing when closed).
 */
export function ModalAnnounce({
  open,
  onClose,
  steps,
  finishLabel = "Get started",
  onFinish,
}: ModalAnnounceProps) {
  const [i, setI] = useState(0);
  const titleId = useId();
  const descId = useId();

  // Restart at the first step each time it opens.
  useEffect(() => {
    if (open) setI(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || steps.length === 0) return null;

  const idx = Math.min(i, steps.length - 1);
  const step = steps[idx];
  const last = idx >= steps.length - 1;
  const multi = steps.length > 1;

  const advance = () => {
    if (last) {
      onFinish?.();
      onClose();
    } else {
      setI((n) => n + 1);
    }
  };

  const goBack = () => setI((n) => Math.max(0, n - 1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 cursor-default border-none bg-black/25 animate-[modal-fade_0.15s_ease-out]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-10 flex w-full max-w-[480px] flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-card-hover animate-[modal-in_0.18s_ease-out]"
      >
        {/* Hero: media on a soft gradient, with the close affordance pinned. */}
        <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-b from-surface-muted to-surface">
          {step.media}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-3 top-3 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-pill border-none bg-surface/70 text-subtle backdrop-blur-sm hover:bg-surface hover:text-ink"
          >
            <Icon icon="close" size={18} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-5 px-6 pb-6 pt-5 text-center">
          <div aria-live="polite">
            <h2
              id={titleId}
              className="m-0 text-[17px] font-semibold leading-6 text-ink"
            >
              {step.title}
            </h2>
            <p
              id={descId}
              className="mx-auto mt-2 max-w-[380px] text-sm leading-5 text-subtle"
            >
              {step.description}
            </p>
          </div>

          {multi && (
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {steps.map((s, n) => (
                <span
                  key={s.title}
                  className={`h-1.5 rounded-pill transition-all ${
                    n === idx ? "w-5 bg-ink" : "w-1.5 bg-line"
                  }`}
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-2">
            {idx > 0 && (
              <ButtonCTA variant="ghost" size="sm" onClick={goBack}>
                Back
              </ButtonCTA>
            )}
            <ButtonCTA variant="secondary" size="sm" onClick={advance}>
              {last ? finishLabel : "Next"}
            </ButtonCTA>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Semantic disc color for {@link ModalAnnounce.HeroIcon}. */
export type HeroIconTone = "blue" | "green" | "pink" | "neutral";

const HERO_TONE: Record<HeroIconTone, string> = {
  blue: "bg-blue/10 text-blue",
  green: "bg-green/10 text-green",
  pink: "bg-pink/10 text-pink",
  neutral: "bg-surface-muted text-subtle",
};

export interface HeroIconProps {
  icon: IconName;
  /** Disc color. Default `blue`. */
  tone?: HeroIconTone;
}

/**
 * A big centered icon on a tinted disc — a stand-in for a hero illustration,
 * dropped into a step's `media`. Exposed as `ModalAnnounce.HeroIcon`.
 */
function HeroIcon({ icon, tone = "blue" }: HeroIconProps) {
  return (
    <div
      className={`flex h-24 w-24 items-center justify-center rounded-tile ${HERO_TONE[tone]}`}
    >
      <Icon icon={icon} size={44} />
    </div>
  );
}

ModalAnnounce.HeroIcon = HeroIcon;
