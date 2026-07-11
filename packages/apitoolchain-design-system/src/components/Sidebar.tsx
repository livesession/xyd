import type { ReactNode } from "react";
import { useState } from "react";
import type { IconName } from "../icons";
import { Icon } from "../icons";
import { DropdownMenu, type DropdownMenuItem } from "./DropdownMenu";
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

export interface SidebarProject {
  id: string;
  name: string;
}

export interface SidebarUser {
  name: string;
  email: string;
  orgName: string;
  plan: string;
}

export interface SidebarProps {
  /** Nav items. Defaults to {@link APITOOLCHAIN_NAV}. */
  items?: SidebarNavItem[];
  /** Current path — items are active-by-href against it (link mode). */
  activeHref?: string;
  /** Host `<Link>` adapter. When provided, items render as router links. */
  linkComponent?: LinkComponent;
  /** Replaces the default project-switcher header. */
  brand?: ReactNode;
  /** Replaces the default user/account footer. */
  footer?: ReactNode;
  /** Projects for the header switcher (falls back to a placeholder). */
  projects?: SidebarProject[];
  currentProjectId?: string;
  onSelectProject?: (id: string) => void;
  onCreateProject?: () => void;
  /** The signed-in account for the footer menu (falls back to a placeholder). */
  user?: SidebarUser;
  onLogout?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** @deprecated Back-compat button mode (no router): fired on nav click. */
  onNavChange?: (label: string, index: number) => void;
}

/**
 * The app shell's left navigation rail: a project-switcher header, a collapse
 * toggle, the nav list, and a user/account footer menu. Router-agnostic — inject
 * `linkComponent` + `activeHref` for real navigation, or use `onNavChange` for
 * local button mode. Feed `projects`/`user` for a live switcher + account menu.
 */
export function Sidebar({
  items = APITOOLCHAIN_NAV,
  activeHref,
  linkComponent,
  brand,
  footer,
  projects,
  currentProjectId,
  onSelectProject,
  onCreateProject,
  user,
  onLogout,
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
        className={`flex items-center gap-1 px-2 py-2.5 ${collapsed ? "justify-center" : "justify-between"}`}
      >
        {!collapsed &&
          (brand ?? (
            <ProjectMenu
              linkComponent={linkComponent}
              projects={projects}
              currentProjectId={currentProjectId}
              onSelectProject={onSelectProject}
              onCreateProject={onCreateProject}
            />
          ))}
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

      <div className="px-2 py-2">
        {footer ?? (
          <UserMenu
            collapsed={collapsed}
            linkComponent={linkComponent}
            user={user}
            onLogout={onLogout}
          />
        )}
      </div>
    </aside>
  );
}

/** Header project switcher — the current project + create/manage actions. */
function ProjectMenu({
  linkComponent,
  projects,
  currentProjectId,
  onSelectProject,
  onCreateProject,
}: {
  linkComponent?: LinkComponent;
  projects?: SidebarProject[];
  currentProjectId?: string;
  onSelectProject?: (id: string) => void;
  onCreateProject?: () => void;
}) {
  const list = projects ?? [{ id: "prj_default", name: "Default project" }];
  const current =
    list.find((p) => p.id === currentProjectId)?.name ??
    list[0]?.name ??
    "Project";
  const items: DropdownMenuItem[] = [
    { key: "hdr", kind: "header", label: "Projects" },
    ...list.map((p) => ({
      key: p.id,
      label: p.name,
      active: p.id === (currentProjectId ?? list[0]?.id),
      onSelect: () => onSelectProject?.(p.id),
    })),
    { key: "sep", kind: "separator" },
    {
      key: "create",
      label: "Create project",
      icon: "plus",
      onSelect: onCreateProject,
    },
    {
      key: "manage",
      label: "Manage projects",
      icon: "settings",
      href: "/settings/projects",
    },
  ];
  return (
    <div className="min-w-0 flex-1">
      <DropdownMenu
        block
        linkComponent={linkComponent}
        trigger={
          <button
            type="button"
            className="flex w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-control border-none bg-transparent px-2 py-1.5 text-left hover:bg-hover"
          >
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
              {current}
            </span>
            <Icon
              icon="chevronUpDown"
              size={15}
              className="shrink-0 text-subtle"
            />
          </button>
        }
        items={items}
      />
    </div>
  );
}

/** Footer user/account menu — opens upward. */
function UserMenu({
  collapsed,
  linkComponent,
  user,
  onLogout,
}: {
  collapsed: boolean;
  linkComponent?: LinkComponent;
  user?: SidebarUser;
  onLogout?: () => void;
}) {
  const orgName = user?.orgName ?? "Acme Inc.";
  const plan = user?.plan ?? "Free plan";
  const email = user?.email ?? "you@apitoolchain.dev";
  const initial = orgName.charAt(0).toUpperCase() || "A";
  return (
    <DropdownMenu
      block
      side="top"
      linkComponent={linkComponent}
      trigger={
        <button
          type="button"
          className={`flex w-full cursor-pointer items-center gap-2.5 rounded-control border-none bg-transparent py-1.5 text-left hover:bg-hover ${collapsed ? "justify-center px-0" : "px-1.5"}`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-surface-pill text-[13px] font-semibold text-nav">
            {initial}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold leading-5 text-ink">
                  {orgName}
                </span>
                <span className="block truncate text-xs leading-4 tracking-[0.01em] text-subtle">
                  {plan}
                </span>
              </span>
              <Icon
                icon="chevronUpDown"
                size={15}
                className="shrink-0 text-subtle"
              />
            </>
          )}
        </button>
      }
      items={[
        { key: "email", kind: "header", label: email },
        { key: "sep1", kind: "separator" },
        {
          key: "org",
          label: "Organization settings",
          icon: "settings",
          href: "/settings/organization",
        },
        {
          key: "namespaces",
          label: "Namespaces",
          icon: "registry",
          href: "/settings/namespaces",
        },
        { key: "sep2", kind: "separator" },
        { key: "logout", label: "Log out", onSelect: onLogout },
      ]}
    />
  );
}
