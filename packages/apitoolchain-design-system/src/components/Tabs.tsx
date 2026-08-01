import { AnchorLink, type LinkComponent } from "./routing";

export interface TabItem {
  key: string;
  label: string;
  /** When set, the tab is a router link (route-driven detail tabs). */
  href?: string;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange?: (key: string) => void;
  linkComponent?: LinkComponent;
}

function Tab({
  item,
  active,
  onChange,
  Link,
}: {
  item: TabItem;
  active: boolean;
  onChange?: (key: string) => void;
  Link: LinkComponent;
}) {
  const cls = `inline-flex cursor-pointer items-center gap-1.5 border-b-2 bg-transparent px-0.5 py-2.5 text-sm leading-5 no-underline transition-colors ${
    active
      ? "border-ink font-semibold text-ink"
      : "border-transparent font-normal text-muted hover:text-body"
  }`;
  const inner = (
    <>
      {item.label}
      {typeof item.count === "number" && (
        <span className="text-xs font-medium text-subtle">{item.count}</span>
      )}
    </>
  );
  if (item.href) {
    return (
      <Link
        href={item.href}
        className={cls}
        aria-current={active ? "page" : undefined}
      >
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={() => onChange?.(item.key)} className={cls}>
      {inner}
    </button>
  );
}

/** An underline tab bar. Set `href` on items for route-driven tabs. */
export function Tabs({ items, activeKey, onChange, linkComponent }: TabsProps) {
  const Link = linkComponent ?? AnchorLink;
  return (
    <div className="flex items-center gap-[22px] overflow-x-auto overflow-y-hidden">
      {items.map((it) => (
        <Tab
          key={it.key}
          item={it}
          active={it.key === activeKey}
          onChange={onChange}
          Link={Link}
        />
      ))}
    </div>
  );
}
