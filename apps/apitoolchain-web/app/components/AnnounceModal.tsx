import {
  type HeroIconTone,
  type IconName,
  ModalAnnounce,
} from "@apitoolchain/design-system";

/**
 * A "coming soon" dialog for a not-yet-shipped feature — a single-step
 * {@link ModalAnnounce} with a hero disc, opened from a primary action (e.g.
 * "New docs site") so the button stays discoverable while the feature is still
 * in the oven.
 */
export function AnnounceModal({
  open,
  onClose,
  feature,
  description,
  icon,
  tone = "blue",
}: {
  open: boolean;
  onClose: () => void;
  /** The feature name shown as the title, e.g. "Docs sites". */
  feature: string;
  /** A sentence or two on what's coming. */
  description: string;
  /** Hero icon for the disc. */
  icon: IconName;
  /** Hero disc color. Default `blue`. */
  tone?: HeroIconTone;
}) {
  return (
    <ModalAnnounce
      open={open}
      onClose={onClose}
      finishLabel="Got it"
      steps={[
        {
          title: `${feature} — coming soon`,
          description,
          media: <ModalAnnounce.HeroIcon icon={icon} tone={tone} />,
        },
      ]}
    />
  );
}
