import { useEffect, useState } from "react";

/**
 * ClientOnly component that only renders its children on the client side
 * to avoid hydration mismatches with SSR
 */
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}

