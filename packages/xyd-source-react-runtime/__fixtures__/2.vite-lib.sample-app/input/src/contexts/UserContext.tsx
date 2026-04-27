import { createContext, useMemo, useState } from "react";
import type { User } from "../types/user";

interface UserContextValue {
    currentUser: User | null;
    isLoggedIn: boolean;
    login: (user: User) => void;
    logout: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);
UserContext.displayName = "UserContext";

function UserProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const value = useMemo((): UserContextValue => ({
        currentUser,
        isLoggedIn: currentUser !== null,
        login: setCurrentUser,
        logout: () => setCurrentUser(null),
    }), [currentUser]);

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export { UserContext, UserProvider };
