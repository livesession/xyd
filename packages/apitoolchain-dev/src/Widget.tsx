import { type ReactNode, useEffect, useState } from "react";

/**
 * Dev-only profile picker + tools widget. Real React components (replacing the
 * old injected DOM-string script) that talk to this package's `/__atc-dev/*`
 * middleware endpoints. Rendered by the web app's root behind
 * `import.meta.env.DEV` — import from `@apitoolchain/dev/widget`.
 *
 * Styled with Tailwind. The host app scans this file for classes via an
 * `@source` directive in its CSS (linked packages aren't auto-detected).
 *
 * HARD GATE: on the first load of a tab the app is hidden (the host sets
 * `html[data-atc-gate]` before paint) and the mandatory picker is the only
 * thing shown. Picking a profile resets the local stack, auto-logs-in as the
 * seeded dev owner, and reloads. A floating button re-opens the tools:
 * reload a profile, clear snapshots, inspect services, and — the reason this
 * exists — LOG OUT, which drops you on the real `/login` page.
 */

const BASE = "/__atc-dev";
const GATE_KEY = "atc-dev-profile-picked";
/** Must match the key/shape in the web app's `app/data/namespaces.ts`. */
const NS_KEY = "apitoolchain.namespaces";

interface DevProfile {
  id: string;
  name: string;
  description: string;
  summary: string;
  namespaces?: { id: string; name?: string; description?: string }[];
}
interface DevService {
  name: string;
  url: string;
}

function ungate(): void {
  try {
    document.documentElement.removeAttribute("data-atc-gate");
  } catch {
    /* ignore */
  }
}

const shortUrl = (u: string): string =>
  u.replace(/^https?:\/\//, "").replace(/^postgres(ql)?:\/\/[^@]*@/, "");

const isHttp = (u: string): boolean => /^https?:/.test(u);

export function DevWidget() {
  const [mounted, setMounted] = useState(false);
  const [picked, setPicked] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // The login page must stay usable (it's how you authenticate) — the mandatory
  // profile picker belongs on the app's onboarding, never here.
  const onLoginPage =
    typeof window !== "undefined" && window.location.pathname === "/login";

  // Storage is client-only; read it after hydration and lift the pre-paint gate
  // if a profile was already picked. localStorage (not sessionStorage) so the
  // gate is shared across same-origin tabs — a new tab (e.g. the editor opened
  // via `newTab`) doesn't re-prompt for a profile that's already applied.
  useEffect(() => {
    setMounted(true);
    let already = false;
    try {
      already = !!localStorage.getItem(GATE_KEY);
    } catch {
      /* ignore */
    }
    setPicked(already);
    if (already || onLoginPage) ungate();
  }, [onLoginPage]);

  if (!mounted) return null;

  const mandatory = !picked && !onLoginPage;
  const showPicker = mandatory || pickerOpen;

  // The gate hides <body>; `visible` re-shows this subtree so the widget is
  // usable even before a profile is picked (visibility overrides inheritance).
  return (
    <div className="visible font-sans">
      {showPicker && (
        <ProfilePicker
          mandatory={mandatory}
          onClose={() => setPickerOpen(false)}
        />
      )}
      <DevFab active={menuOpen} onToggle={() => setMenuOpen((v) => !v)} />
      {menuOpen && (
        <DevMenu
          onClose={() => setMenuOpen(false)}
          onLoadProfile={() => {
            setMenuOpen(false);
            setPickerOpen(true);
          }}
        />
      )}
    </div>
  );
}

function ProfilePicker({
  mandatory,
  onClose,
}: {
  mandatory: boolean;
  onClose: () => void;
}) {
  const [profiles, setProfiles] = useState<DevProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`${BASE}/profiles`)
      .then((r) => r.json())
      .then((list: DevProfile[]) => alive && setProfiles(list))
      .catch((e) => alive && setError(`Failed to load profiles: ${e}`));
    return () => {
      alive = false;
    };
  }, []);

  // Escape closes the picker — the keyboard equivalent of the backdrop click.
  // Not while it's the mandatory first-load gate (you must pick something).
  useEffect(() => {
    if (mandatory) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mandatory, onClose]);

  async function apply(p: DevProfile) {
    setApplying(p.id);
    setError(null);
    setStatus("Applying (this can take a moment)…");
    try {
      const res = await fetch(`${BASE}/profiles/apply`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: p.id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "apply failed");
      try {
        localStorage.setItem(GATE_KEY, p.id);
      } catch {
        /* ignore */
      }
      // Reseed the app's namespace store to THIS profile's set so namespaces
      // are profile-driven.
      try {
        const nss = (j.namespaces ?? []).map(
          (n: { id: string; name?: string; description?: string }) => ({
            id: n.id,
            name: n.name || n.id,
            description: n.description,
          }),
        );
        localStorage.setItem(NS_KEY, JSON.stringify(nss));
      } catch {
        /* ignore */
      }
      setStatus("Done — logging in…");
      // Apply only seeds data server-side; log the browser in as the seeded dev
      // owner (creds from the response) so the app is usable immediately.
      const lg = j.login as { email?: string; password?: string } | undefined;
      if (lg?.email) {
        await fetch("/login", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: `email=${encodeURIComponent(lg.email)}&password=${encodeURIComponent(lg.password ?? "")}`,
        }).catch(() => {});
      }
      window.location.reload();
    } catch (e) {
      setApplying(null);
      setStatus("");
      setError(`Profile apply failed: ${(e as Error).message}`);
    }
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: dev-only backdrop dismiss.
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click is mouse-only; Escape closes it (see effect above).
    <div
      className="fixed inset-0 z-[2147483600] flex items-center justify-center bg-[#0f1216]"
      onClick={
        mandatory
          ? undefined
          : (e) => {
              if (e.target === e.currentTarget) onClose();
            }
      }
    >
      <div className="box-border max-h-[86vh] w-[760px] max-w-[92vw] overflow-auto rounded-[14px] bg-white p-[22px] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="text-[16px] font-semibold text-[#12161c]">
          Load a dev data profile
        </div>
        <div className="mt-0.5 mb-4 text-[13px] text-[#5b6472]">
          Resets your local stack to a preset dataset (dev only).
        </div>

        {error && (
          <div className="mb-3 rounded-[10px] bg-[#fdecea] px-3 py-2 text-[13px] text-[#b3261e]">
            {error}
          </div>
        )}
        {!profiles && !error && (
          <div className="text-[13px] text-[#5b6472]">Loading…</div>
        )}

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {profiles?.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={applying !== null}
              onClick={() => apply(p)}
              className="flex cursor-pointer flex-col rounded-[10px] border border-[#e6e8eb] bg-white px-3.5 py-3 text-left hover:border-[#12161c] hover:bg-[#fafafa] disabled:cursor-progress disabled:opacity-60"
            >
              <div className="text-[14px] font-semibold text-[#12161c]">
                {p.name}
              </div>
              <div className="mt-px text-[12px] font-semibold text-[#0a7d38]">
                {applying === p.id ? status : p.summary}
              </div>
              <div className="mt-1 text-[12px] text-[#5b6472]">
                {p.description}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          {mandatory ? (
            <span className="text-[11px] text-[#8a94a2]">
              Pick a profile to load the app
            </span>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer border-none bg-transparent text-[13px] text-[#5b6472] underline"
            >
              Close
            </button>
          )}
          <span className="text-[11px] text-[#8a94a2]">apitoolchain dev</span>
        </div>
      </div>
    </div>
  );
}

function DevFab({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      id="atc-dev-fab"
      type="button"
      aria-label="apitoolchain dev options"
      aria-expanded={active}
      onClick={onToggle}
      className="fixed right-4 bottom-4 z-[2147482000] flex h-11 w-11 items-center justify-center rounded-full border-none bg-[#12161c] text-white shadow-[0_6px_20px_rgba(0,0,0,0.28)] transition hover:scale-110 hover:bg-[#1c222b]"
    >
      <svg
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 20 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
        />
      </svg>
    </button>
  );
}

function DevMenu({
  onClose,
  onLoadProfile,
}: {
  onClose: () => void;
  onLoadProfile: () => void;
}) {
  const [services, setServices] = useState<DevService[] | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`${BASE}/info`)
      .then((r) => r.json())
      .then((d) => alive && setServices(d?.services ?? []))
      .catch(() => alive && setServices([]));
    return () => {
      alive = false;
    };
  }, []);

  // Close on outside click (ignore the FAB, which toggles the menu itself).
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const menu = document.getElementById("atc-dev-menu");
      const fab = document.getElementById("atc-dev-fab");
      const t = e.target as Node;
      if (menu && !menu.contains(t) && fab && !fab.contains(t)) onClose();
    };
    const id = window.setTimeout(
      () => document.addEventListener("mousedown", onDown),
      0,
    );
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("mousedown", onDown);
    };
  }, [onClose]);

  async function clearSnapshots() {
    setMsg("Clearing…");
    try {
      await fetch(`${BASE}/snapshots/clear`, { method: "POST" });
      setMsg("Cleared — the next profile apply rebuilds from scratch.");
    } catch (e) {
      setMsg(`Clear failed: ${(e as Error).message}`);
    }
  }

  function logout() {
    // Full-page POST → the /logout action revokes the session + clears the
    // cookie and redirects to /login. We deliberately KEEP the picked profile
    // (don't touch GATE_KEY) so the gate stays lifted and the login page is
    // actually visible — the whole reason this button exists.
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/logout";
    document.body.appendChild(form);
    form.submit();
  }

  return (
    <div
      id="atc-dev-menu"
      className="fixed right-4 bottom-[70px] z-[2147482000] box-border max-h-[60vh] w-72 overflow-auto rounded-xl border border-[#e6e8eb] bg-white p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.22)]"
    >
      <MenuLabel>Dev</MenuLabel>
      <MenuButton onClick={onLoadProfile}>Load a profile…</MenuButton>
      <MenuButton onClick={clearSnapshots}>
        <span>Clear snapshots</span>
        <span className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[12px] text-[#5b6472]">
          rebuild next apply
        </span>
      </MenuButton>
      <MenuButton onClick={logout}>Log out</MenuButton>
      {msg && (
        <div className="px-2.5 py-1 text-[12px] text-[#5b6472]">{msg}</div>
      )}

      <MenuLabel>Active services</MenuLabel>
      {services === null ? (
        <div className="px-2.5 py-1 text-[12px] text-[#5b6472]">Loading…</div>
      ) : services.length === 0 ? (
        <div className="px-2.5 py-1 text-[12px] text-[#5b6472]">
          stack still booting…
        </div>
      ) : (
        services.map((s) =>
          isHttp(s.url) ? (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-[#12161c] no-underline hover:bg-[#f4f5f7]"
            >
              <span>{s.name}</span>
              <span className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[12px] text-[#5b6472]">
                {shortUrl(s.url)}
              </span>
            </a>
          ) : (
            <div
              key={s.name}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-[#12161c]"
            >
              <span>{s.name}</span>
              <span className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[12px] text-[#5b6472]">
                {shortUrl(s.url)}
              </span>
            </div>
          ),
        )
      )}
    </div>
  );
}

function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8a94a2]">
      {children}
    </div>
  );
}

function MenuButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-2 rounded-lg border-none bg-transparent px-2.5 py-2 text-left text-[13px] text-[#12161c] hover:bg-[#f4f5f7]"
    >
      {children}
    </button>
  );
}
