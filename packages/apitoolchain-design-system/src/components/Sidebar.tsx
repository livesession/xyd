import type { ReactNode } from "react";
import { useState } from "react";
import type { IconName } from "../icons";
import { Icon } from "../icons";
import { NavItem } from "./NavItem";
import { isActiveHref, type LinkComponent } from "./routing";

export interface SidebarNavItem {
  icon: IconName;
  label: string;
  href: string;
  badge?: number;
}

/** The default apitoolchain navigation taxonomy. */
export const APITOOLCHAIN_NAV: SidebarNavItem[] = [
  { icon: "home", label: "Home", href: "/" },
  { icon: "registry", label: "Registry", href: "/registry" },
  { icon: "sdk", label: "SDKs", href: "/sdks" },
  { icon: "docs", label: "Docs", href: "/docs" },
  { icon: "mcp", label: "MCP", href: "/mcp" },
  { icon: "bell", label: "Notifications", href: "/notifications" },
  { icon: "usage", label: "Usage", href: "/usage" },
  { icon: "settings", label: "Settings", href: "/settings" },
];

export interface SidebarProps {
  /** Nav items. Defaults to {@link APITOOLCHAIN_NAV}. */
  items?: SidebarNavItem[];
  /** Current path — items are active-by-href against it (link mode). */
  activeHref?: string;
  /** Host `<Link>` adapter. When provided, items render as router links. */
  linkComponent?: LinkComponent;
  /** Replaces the default brand block at the top. */
  brand?: ReactNode;
  /** Replaces the default org/account footer. */
  footer?: ReactNode;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** @deprecated Back-compat button mode (no router): fired on nav click. */
  onNavChange?: (label: string, index: number) => void;
}

/**
 * The app shell's left navigation rail: a brand block, a collapse toggle, the
 * nav list, and an account footer. Router-agnostic — inject `linkComponent` +
 * `activeHref` for real navigation, or use `onNavChange` for local button mode.
 */
export function Sidebar({
  items = APITOOLCHAIN_NAV,
  activeHref,
  linkComponent,
  brand,
  footer,
  collapsed: collapsedProp,
  onCollapsedChange,
  onNavChange,
}: SidebarProps) {
  const [collapsedState, setCollapsedState] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const linkMode = !!linkComponent;
  const collapsed = collapsedProp ?? collapsedState;
  const setCollapsed = (c: boolean) => {
    if (onCollapsedChange) onCollapsedChange(c);
    else setCollapsedState(c);
  };

  return (
    <aside
      className={`flex h-full shrink-0 flex-col overflow-hidden border-r border-line-soft bg-surface-muted transition-[width] ${collapsed ? "w-[56px]" : "w-[252px]"}`}
    >
      <div
        className={`flex items-center gap-2 px-3 py-[14px] ${collapsed ? "justify-center" : "justify-between"}`}
      >
        {!collapsed && (brand ?? <DefaultBrand />)}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Collapse sidebar"
          className="inline-flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-[9px] border-none bg-transparent text-subtle hover:bg-hover"
        >
          <Icon icon="panelLeft" size={20} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-1">
        {items.map((item, i) => {
          const active = linkMode
            ? isActiveHref(item.href, activeHref ?? "")
            : activeIdx === i;
          return (
            <NavItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              active={active}
              collapsed={collapsed}
              href={linkMode ? item.href : undefined}
              linkComponent={linkComponent}
              onSelect={
                linkMode
                  ? undefined
                  : () => {
                      setActiveIdx(i);
                      onNavChange?.(item.label, i);
                    }
              }
            />
          );
        })}
      </nav>

      <div className="border-t border-line-soft">
        {footer ?? <DefaultFooter collapsed={collapsed} />}
      </div>
    </aside>
  );
}

function DefaultBrand() {
  return (
    <div className="flex min-w-0 items-center gap-2 px-1.5 py-[3px]">
      <span className="inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-control bg-ink text-white">
        <Icon icon="box" size={16} />
      </span>
      <span className="truncate text-[15px] font-semibold text-ink">
        apitoolchain
      </span>
    </div>
  );
}

function DefaultFooter({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={`flex items-center gap-2.5 ${collapsed ? "justify-center py-[14px]" : "justify-start px-[18px] py-[14px]"}`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-surface-pill text-[13px] font-semibold text-nav">
        A
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-5 text-ink">
            Acme Inc.
          </div>
          <div className="text-xs leading-4 tracking-[0.01em] text-subtle">
            Free plan
          </div>
        </div>
      )}
    </div>
  );
}
