import type { Meta, StoryObj } from "@storybook/react";
import type { CSSProperties, ReactNode } from "react";
import { Collapse } from "../components/Collapse";
import { Mono } from "../components/Mono";
import tokensJson from "./design-tokens.json";

/**
 * Design tokens, generated then imported. `bun run gen:tokens` reads the
 * Tailwind v4 `@theme {}` block in `styles/theme.css`, validates the colors via
 * `@projectwallace/css-design-tokens`, and writes `design-tokens.json` — this
 * story just imports + renders it. Each group is its own story; `All` is the
 * full spec sheet.
 */

const tokens = tokensJson as {
  /** Every parsed token (incl. internal helpers) → for inline var injection. */
  raw: Record<string, string>;
  /** Public token groups (the copy-pasteable JSON). */
  grouped: {
    color: Record<string, string>;
    radius: Record<string, string>;
    shadow: Record<string, string>;
    fontSize: Record<string, string>;
    fontFamily: Record<string, string>;
  };
};

// Inject every token as an inline CSS var so `var(--token)` always resolves —
// Tailwind v4 only emits theme vars a utility uses, so the unused `--shadow-*`
// vars would otherwise be tree-shaken out (→ invisible shadows).
const ROOT_VARS = tokens.raw as CSSProperties;

const TOKEN_COUNT = Object.values(tokens.grouped).reduce(
  (n, g) => n + Object.keys(g).length,
  0,
);

/** A numbered, bordered section — "01 — Color palette". */
function Section({
  index,
  title,
  meta,
  children,
}: {
  index: string;
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-box border border-line bg-surface">
      <header className="flex items-baseline gap-3 border-b border-line px-6 py-4">
        <span className="font-mono text-xs tracking-wider text-subtle">
          {index}
        </span>
        <span className="text-subtle">—</span>
        <h3 className="m-0 flex-1 text-section font-semibold text-ink">
          {title}
        </h3>
        {meta && <span className="text-xs text-subtle">{meta}</span>}
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

function TokenLabel({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[13px] font-medium text-ink">{label}</span>
      <Mono tone="muted">{value}</Mono>
    </div>
  );
}

function ColorsSection() {
  const entries = Object.entries(tokens.grouped.color);
  return (
    <Section index="01" title="Color palette" meta={`${entries.length} tokens`}>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
        {entries.map(([label, value]) => (
          <div
            key={label}
            className="overflow-hidden rounded-tile border border-line-card"
          >
            <div
              className="h-16 w-full"
              style={{ background: `var(--color-${label})` }}
            />
            <div className="px-2.5 py-2">
              <TokenLabel label={label} value={value} />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function TypographySection() {
  return (
    <Section index="02" title="Typography">
      <div className="flex flex-col gap-6">
        {Object.entries(tokens.grouped.fontFamily).map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1">
            <div
              className="text-[26px] leading-tight text-ink"
              style={{ fontFamily: `var(--font-${label})` }}
            >
              Ag — The quick brown fox jumps over the lazy dog
            </div>
            <Mono tone="muted">
              {label} · {value}
            </Mono>
          </div>
        ))}
        <div className="flex flex-col divide-y divide-line-soft border-t border-line-soft">
          {Object.entries(tokens.grouped.fontSize).map(([label, value]) => {
            const lh = tokens.raw[`--text-${label}--line-height`];
            return (
              <div
                key={label}
                className="flex items-baseline justify-between gap-6 py-4"
              >
                <span
                  className="min-w-0 truncate text-ink"
                  style={{
                    fontSize: `var(--text-${label})`,
                    lineHeight: lh
                      ? `var(--text-${label}--line-height)`
                      : undefined,
                  }}
                >
                  The quick brown fox
                </span>
                <span className="shrink-0 whitespace-nowrap text-right">
                  <Mono tone="muted">
                    {label} · {value}
                    {lh ? ` / ${lh}` : ""}
                  </Mono>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

function RadiiSection() {
  const entries = Object.entries(tokens.grouped.radius);
  return (
    <Section index="03" title="Radii" meta={`${entries.length} tokens`}>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
        {entries.map(([label, value]) => (
          <div key={label} className="flex items-center gap-3">
            <div
              className="h-14 w-14 shrink-0 border border-line bg-surface-raised"
              style={{ borderRadius: `var(--radius-${label})` }}
            />
            <TokenLabel label={label} value={value} />
          </div>
        ))}
      </div>
    </Section>
  );
}

function ShadowsSection() {
  const entries = Object.entries(tokens.grouped.shadow);
  return (
    <Section index="04" title="Shadows" meta={`${entries.length} tokens`}>
      {/* Muted backdrop so the white cards' shadows actually read. */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        {entries.map(([label, value]) => (
          <div
            key={label}
            className="flex flex-col gap-3 rounded-tile bg-surface-muted p-6"
          >
            <div
              className="h-16 rounded-control bg-surface"
              style={{ boxShadow: `var(--shadow-${label})` }}
            />
            <TokenLabel label={label} value={value} />
          </div>
        ))}
      </div>
    </Section>
  );
}

/** The generated JSON, collapsed by default. */
function JsonSection({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <Collapse
      defaultOpen={defaultOpen}
      title={
        <span className="flex items-baseline gap-3">
          <span className="font-mono text-xs tracking-wider text-subtle">
            05
          </span>
          <span className="text-subtle">—</span>
          <span className="text-section font-semibold text-ink">JSON</span>
        </span>
      }
      trailing={
        <span className="text-xs text-subtle">{TOKEN_COUNT} tokens</span>
      }
    >
      <pre className="m-0 max-h-[560px] overflow-auto rounded-tile border border-line-soft bg-surface-muted p-4 font-mono text-[12px] leading-relaxed text-ink">
        {JSON.stringify(tokens.grouped, null, 2)}
      </pre>
    </Collapse>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div
      className="mx-auto flex max-w-[980px] flex-col gap-6 p-6 font-sans"
      style={ROOT_VARS}
    >
      {children}
    </div>
  );
}

const meta: Meta = {
  title: "Design System/Design tokens",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

/** The full spec sheet — every section on one page. */
export const All: Story = {
  render: () => (
    <Shell>
      <ColorsSection />
      <TypographySection />
      <RadiiSection />
      <ShadowsSection />
      <JsonSection />
    </Shell>
  ),
};

export const ColorTokens: Story = {
  name: "Color palette",
  render: () => (
    <Shell>
      <ColorsSection />
    </Shell>
  ),
};

export const TypographyTokens: Story = {
  name: "Typography",
  render: () => (
    <Shell>
      <TypographySection />
    </Shell>
  ),
};

export const RadiusTokens: Story = {
  name: "Radii",
  render: () => (
    <Shell>
      <RadiiSection />
    </Shell>
  ),
};

export const ShadowTokens: Story = {
  name: "Shadows",
  render: () => (
    <Shell>
      <ShadowsSection />
    </Shell>
  ),
};

/** The generated tokens JSON (open here, collapsible everywhere). */
export const JsonTokens: Story = {
  name: "JSON",
  render: () => (
    <Shell>
      <JsonSection defaultOpen />
    </Shell>
  ),
};
