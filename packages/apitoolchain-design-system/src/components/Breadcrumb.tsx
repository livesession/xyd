import { Icon } from "../icons";
import { AnchorLink, type LinkComponent } from "./routing";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  linkComponent?: LinkComponent;
}

/** A `/`-style breadcrumb trail; the last item is the current page. */
export function Breadcrumb({ items, linkComponent }: BreadcrumbProps) {
  const Link = linkComponent ?? AnchorLink;
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-2.5 flex flex-wrap items-center gap-1"
    >
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <span
            key={it.href ?? it.label}
            className="inline-flex items-center gap-1"
          >
            {it.href && !last ? (
              <Link
                href={it.href}
                className="text-[13px] leading-[18px] text-muted no-underline hover:text-ink"
              >
                {it.label}
              </Link>
            ) : (
              <span
                className={`text-[13px] leading-[18px] ${last ? "font-medium text-ink" : "text-muted"}`}
              >
                {it.label}
              </span>
            )}
            {!last && (
              <span className="inline-flex text-subtle">
                <Icon icon="chevronRight" size={13} />
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
