import { FromLiveSession } from "@apitoolchain/design-system";
import type { ReactNode } from "react";
import { GravityBackdrop } from "./GravityBackdrop";

export interface AuthBackgroundProps {
  children: ReactNode;
}

/**
 * A full-page, centered auth layout — the shell for sign-in / sign-up. The
 * backdrop ({@link GravityBackdrop}) layers a dot grid and a faint dashed
 * sketch of the apitoolchain logo motif, both of which collapse toward the
 * pointer like a small gravity well; a "from LiveSession" mark sits at the
 * bottom. Compose {@link AuthHeader} + {@link AuthCard} inside it.
 */
export function AuthBackground({ children }: AuthBackgroundProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-1 px-6 py-12">
      <GravityBackdrop />
      <div className="relative z-10 w-full max-w-[420px]">{children}</div>
      <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center pb-6">
        <FromLiveSession />
      </div>
    </main>
  );
}
