import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";

export interface AuthState {
  authenticated: boolean;
  groups: string[];
  token: string | null;
}

const AuthContext = createContext<AuthState>({
  authenticated: false,
  groups: [],
  token: null,
});

declare global {
  interface Window {
    __xydAuthState?: AuthState;
    __xydAuthDebug?: any;
  }
}

interface AuthGuardProps {
  children: React.ReactNode;
  accessMap: Record<string, string>;
  config: {
    provider: { type: string; loginUrl?: string };
    unauthorizedBehavior?: "redirect" | "404";
    session?: { cookieName?: string };
  };
}

function buildLoginUrl(loginUrl: string, returnPath: string): string {
  const separator = loginUrl.includes("?") ? "&" : "?";
  return `${loginUrl}${separator}redirect=${encodeURIComponent(returnPath)}`;
}

/**
 * AuthGuard wraps the application and enforces access control.
 * It reads auth state from window.__xydAuthState (set by pre-hydration script)
 * and checks the access map for the current route.
 */
export default function AuthGuard({ children, accessMap, config }: AuthGuardProps) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    if (typeof window !== "undefined" && window.__xydAuthState) {
      return window.__xydAuthState;
    }
    return { authenticated: false, groups: [], token: null };
  });

  useEffect(() => {
    // Listen for auth state changes (e.g., after login callback)
    const handleStorage = (e: StorageEvent) => {
      const cookieName = config.session?.cookieName || "xyd-auth-token";
      if (e.key === cookieName) {
        if (e.newValue) {
          try {
            const payload = JSON.parse(atob(e.newValue.split(".")[1]));
            setAuthState({
              authenticated: true,
              groups: payload.groups || [],
              token: e.newValue,
            });
          } catch {
            setAuthState({ authenticated: false, groups: [], token: null });
          }
        } else {
          setAuthState({ authenticated: false, groups: [], token: null });
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [config.session?.cookieName]);

  const value = useMemo(() => authState, [authState]);

  return (
    <AuthContext.Provider value={value}>
      <AuthEnforcer accessMap={accessMap} config={config}>
        {children}
      </AuthEnforcer>
    </AuthContext.Provider>
  );
}

/**
 * Enforces access control on route changes.
 */
function AuthEnforcer({
  children,
  accessMap,
  config,
}: {
  children: React.ReactNode;
  accessMap: Record<string, string>;
  config: AuthGuardProps["config"];
}) {
  const authState = useContext(AuthContext);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pathname = window.location.pathname;
    const pageAccess = accessMap[pathname];

    // No access entry or public = allow
    if (!pageAccess || pageAccess === "public") return;

    // Requires auth but user is not authenticated
    if (!authState.authenticated) {
      const loginUrl = config.provider.loginUrl;
      if (loginUrl) {
        window.location.href = buildLoginUrl(loginUrl, pathname);
      }
      return;
    }

    // Group-based access
    if (pageAccess !== "authenticated") {
      const requiredGroups = pageAccess.split(",");
      const hasAccess = requiredGroups.some((g) =>
        authState.groups.includes(g)
      );
      if (!hasAccess) {
        if (config.unauthorizedBehavior === "404") {
          // Replace with a 404-like state
          window.location.href = "/404";
        } else {
          const loginUrl = config.provider.loginUrl;
          if (loginUrl) {
            window.location.href = buildLoginUrl(loginUrl, pathname);
          }
        }
      }
    }
  }, [authState, accessMap, config]);

  return <>{children}</>;
}

/**
 * Hook to access authentication state.
 */
export function useAuth(): AuthState & {
  login: () => void;
  logout: () => void;
} {
  const state = useContext(AuthContext);

  return {
    ...state,
    login() {
      // Will be overridden by config at runtime
      console.warn("[xyd:access-control] login() called without config");
    },
    logout() {
      if (typeof window === "undefined") return;

      const cookieName = "xyd-auth-token";
      localStorage.removeItem(cookieName);
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = `${cookieName}-state=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;

      window.__xydAuthState = {
        authenticated: false,
        groups: [],
        token: null,
      };
      document.documentElement.setAttribute("data-auth", "anonymous");
      window.location.reload();
    },
  };
}
