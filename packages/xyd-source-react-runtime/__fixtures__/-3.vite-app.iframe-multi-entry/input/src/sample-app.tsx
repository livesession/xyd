import { createContext, useContext, useState } from "react";

// --- Types ---

interface ThemeContextValue {
    mode: "light" | "dark";
    setMode: (mode: "light" | "dark") => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// --- Provider with React.ReactNode children ---

function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<"light" | "dark">("light");
    return (
        <ThemeContext.Provider value={{ mode, setMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

// --- Component with mixed props (simple + React types) ---

interface User {
    name: string;
    email: string;
    id: number;
    joinedAt: Date;
}

interface UserCardProps {
    user: User;
    role: "admin" | "editor" | "viewer";
    permissions: string[];
    onEdit: (id: number) => void;
    tags: Map<string, boolean>;
    statusIndicator: React.ReactElement;
    actionBar?: React.ReactNode;
}

function UserCard({ user, role, permissions, onEdit, tags, statusIndicator, actionBar }: UserCardProps) {
    const [expanded, setExpanded] = useState(false);
    const theme = useContext(ThemeContext);

    return (
        <div style={{ border: "1px solid #eee", padding: 12, borderRadius: 8, marginBottom: 8 }}>
            <strong>{user.name}</strong> ({role})
            <div style={{ fontSize: 12 }}>{user.email}</div>
            <div>{permissions.join(", ")}</div>
            <div>{statusIndicator}</div>
            {actionBar}
            <button type="button" onClick={() => setExpanded(!expanded)}>
                {expanded ? "Hide" : "Show"}
            </button>
            {expanded && (
                <div>
                    <div>ID: {user.id}</div>
                    <button type="button" onClick={() => onEdit(user.id)}>Edit</button>
                </div>
            )}
        </div>
    );
}

// --- Simple component (no React types) ---

interface TodoItemProps {
    id: number;
    title: string;
    completed: boolean;
    priority: "low" | "medium" | "high";
    onToggle: (id: number) => void;
}

function TodoItem({ id, title, completed, priority, onToggle }: TodoItemProps) {
    return (
        <div style={{ display: "flex", gap: 8, padding: 4 }}>
            <input type="checkbox" checked={completed} onChange={() => onToggle(id)} />
            <span style={{ textDecoration: completed ? "line-through" : "none" }}>{title}</span>
            <span>({priority})</span>
        </div>
    );
}

// --- Main sample app ---

function SampleApp() {
    return (
        <ThemeProvider>
            <h3>Sample App (iframe)</h3>
            <UserCard
                user={{ name: "Alice", email: "alice@test.com", id: 1, joinedAt: new Date() }}
                role="admin"
                permissions={["read", "write"]}
                onEdit={(id) => console.log("edit", id)}
                tags={new Map([["verified", true]])}
                statusIndicator={<span>Active</span>}
            />
            <TodoItem id={1} title="Write docs" completed={false} priority="high" onToggle={() => {}} />
        </ThemeProvider>
    );
}

export { ThemeProvider, ThemeContext, UserCard, TodoItem, SampleApp };
