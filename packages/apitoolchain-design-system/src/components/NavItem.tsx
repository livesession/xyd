import type { IconName } from "../icons";
import { Icon } from "../icons";
import { AnchorLink, type LinkComponent } from "./routing";

export interface NavItemProps {
  icon: IconName;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  /** Renders the row as a link (router-aware). */
  href?: string;
  linkComponent?: LinkComponent;
  badge?: number;
  /** Back-compat button mode (used when no `href` is set). */
  onSelect?: () => void;
}

/** A single row in the {@link Sidebar} nav. Handles active + hover styling. */
export function NavItem({
  icon,
  label,
  active = false,
  collapsed = false,
  href,
  linkComponent,
  badge,
  onSelect,
}: NavItemProps) {
  const cls = [
    "flex w-full items-center gap-3 rounded-tile text-left text-sm leading-5 no-underline transition-colors",
    collapsed ? "justify-center p-[9px]" : "justify-start px-2.5 py-[9px]",
    active
      ? "relative isolate font-semibold text-[color-mix(in_oklab,currentColor_80%,transparent)] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-alpha-02 before:content-['']"
      : "cursor-pointer border-none bg-transparent font-normal text-nav hover:bg-hover-strong",
  ].join(" ");

  const inner = (
    <>
      <span className="inline-flex shrink-0 items-center justify-center">
        <Icon icon={icon} size={20} strokeWidth={active ? 2 : 1.8} />
      </span>
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && typeof badge === "number" && badge > 0 && (
        <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-pill bg-blue px-[5px] text-[11px] font-semibold text-white">
          {badge}
        </span>
      )}
    </>
  );

  if (href) {
    const Link = linkComponent ?? AnchorLink;
    return (
      <Link
        href={href}
        title={label}
        className={cls}
        aria-current={active ? "page" : undefined}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" title={label} onClick={onSelect} className={cls}>
      {inner}
    </button>
  );
}
