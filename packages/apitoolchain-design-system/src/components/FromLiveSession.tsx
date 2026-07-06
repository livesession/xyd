import { LiveSessionWordmark } from "./LiveSessionWordmark";

/**
 * "from [LiveSession]" attribution link — mirrors the codable/apiatlas footer,
 * adapted to the apitoolchain tokens (muted, brightening to ink on hover).
 */
export function FromLiveSession() {
  return (
    <a
      href="https://livesession.io/"
      target="_blank"
      rel="noreferrer noopener"
      className="flex cursor-pointer items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-ink"
    >
      <span>from</span>
      <LiveSessionWordmark className="h-[12px] w-auto" />
    </a>
  );
}
