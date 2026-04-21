// Hook is installed by sample-app-entry.ts before this module loads.

import { createContext, useContext, useMemo, useState } from "react";

// --- Contexts ---
// Note: useState calls are automatically transformed to _useDebugState by
// the debugPlaygroundBabel plugin in vite.config.ts

interface ThemeContextValue {
    mode: "light" | "dark";
    primaryColor: string;
    fontSize: number;
    setMode: (mode: "light" | "dark") => void;
    setPrimaryColor: (color: string) => void;
    setFontSize: (size: number) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
ThemeContext.displayName = "ThemeContext";

interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: "admin" | "editor" | "viewer";
    avatar: string;
}

interface AuthContextValue {
    user: AuthUser | null;
    isAuthenticated: boolean;
    login: (user: AuthUser) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
AuthContext.displayName = "AuthContext";

interface Notification {
    id: number;
    message: string;
    type: "info" | "warning" | "error" | "success";
    read: boolean;
}

interface NotificationContextValue {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (msg: string, type: Notification["type"]) => void;
    markRead: (id: number) => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);
NotificationContext.displayName = "NotificationContext";

// --- Providers ---

function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<"light" | "dark">("light");
    const [primaryColor, setPrimaryColor] = useState("#1976d2");
    const [fontSize, setFontSize] = useState(14);

    const value = useMemo(
        (): ThemeContextValue => ({ mode, primaryColor, fontSize, setMode, setPrimaryColor, setFontSize }),
        [mode, primaryColor, fontSize],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>({
        id: 1,
        name: "Alice Johnson",
        email: "alice@example.com",
        role: "admin",
        avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AJ",
    });

    const value = useMemo(
        (): AuthContextValue => ({
            user,

            isAuthenticated: user !== null,
            login: setUser,
            logout: () => setUser(null),
        }),
        [user],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([
        { id: 1, message: "Deployment completed successfully", type: "success", read: false },
        { id: 2, message: "New user signed up: Bob Smith", type: "info", read: false },
        { id: 3, message: "API rate limit approaching 80%", type: "warning", read: true },
    ]);

    const value = useMemo((): NotificationContextValue => {
        const unreadCount = notifications.filter((n) => !n.read).length;
        return {
            notifications,
            unreadCount,
            addNotification: (msg, type) =>
                setNotifications((prev) => [
                    ...prev,
                    { id: Date.now(), message: msg, type, read: false },
                ]),
            markRead: (id) =>
                setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))),
            clearAll: () => setNotifications([]),
        };
    }, [notifications]);

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

// --- Components that consume contexts ---

function ThemeToggle() {
    const theme = useContext(ThemeContext)!;
    return (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <button type="button" onClick={() => theme.setMode(theme.mode === "light" ? "dark" : "light")}>
                {theme.mode === "light" ? "🌙" : "☀️"} {theme.mode}
            </button>
            <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) => theme.setPrimaryColor(e.target.value)}
                title="Primary color"
            />
            <select value={theme.fontSize} onChange={(e) => theme.setFontSize(Number(e.target.value))}>
                <option value={12}>12px</option>
                <option value={14}>14px</option>
                <option value={16}>16px</option>
                <option value={18}>18px</option>
            </select>
        </div>
    );
}

function UserProfile() {
    const auth = useContext(AuthContext)!;
    const theme = useContext(ThemeContext)!;

    if (!auth.isAuthenticated) {
        return (
            <div style={{ padding: 8, border: "1px solid #eee", borderRadius: 8, marginBottom: 8 }}>
                <span>Not logged in</span>
                <button
                    type="button"
                    onClick={() =>
                        auth.login({ id: 1, name: "Alice Johnson", email: "alice@example.com", role: "admin", avatar: "" })
                    }
                    style={{ marginLeft: 8 }}
                >
                    Login
                </button>
            </div>
        );
    }

    return (
        <div
            style={{
                padding: 8,
                border: `1px solid ${theme.primaryColor}`,
                borderRadius: 8,
                marginBottom: 8,
                fontSize: theme.fontSize,
            }}
        >
            <strong>{auth.user!.name}</strong> ({auth.user!.role})
            <div style={{ fontSize: 11, color: "#666" }}>{auth.user!.email}</div>
            <button type="button" onClick={auth.logout} style={{ marginTop: 4, fontSize: 11 }}>
                Logout
            </button>
        </div>
    );
}

function NotificationBell() {
    const { notifications, unreadCount, markRead, addNotification, clearAll } =
        useContext(NotificationContext)!;
    const [expanded, setExpanded] = useState(false);

    return (
        <div style={{ marginBottom: 8 }}>
            <button type="button" onClick={() => setExpanded(!expanded)}>
                🔔 {unreadCount > 0 && <span style={{ color: "red" }}>({unreadCount})</span>}
            </button>
            <button
                type="button"
                onClick={() => addNotification("Test notification " + Date.now(), "info")}
                style={{ marginLeft: 4, fontSize: 11 }}
            >
                + Add
            </button>
            <button type="button" onClick={clearAll} style={{ marginLeft: 4, fontSize: 11 }}>
                Clear
            </button>
            {expanded && (
                <ul style={{ listStyle: "none", padding: 0, margin: "4px 0" }}>
                    {notifications.map((n) => (
                        <li
                            key={n.id}
                            onClick={() => markRead(n.id)}
                            style={{
                                padding: "4px 8px",
                                fontSize: 12,
                                background: n.read ? "#f5f5f5" : "#e3f2fd",
                                marginBottom: 2,
                                borderRadius: 4,
                                cursor: "pointer",
                                borderLeft: `3px solid ${
                                    n.type === "error" ? "#f44336" : n.type === "warning" ? "#ff9800" : n.type === "success" ? "#4caf50" : "#2196f3"
                                }`,
                            }}
                        >
                            {n.message} {!n.read && <strong>(new)</strong>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// --- Components with rich props + named state ---

function Icon({ name, color }: { name: string; color: string }) {
    return (
        <span style={{ color, fontSize: 18 }}>
			{name === "star" ? "★" : name === "heart" ? "♥" : "●"}
		</span>
    );
}

interface User {
    name: string; email: string; id: number; joinedAt: Date
}

interface UserCardProps {
    user: User
    role: "admin" | "editor" | "viewer";
    permissions: string[];
    onEdit: (id: number) => void;
    tags: Map<string, boolean>;
    statusIndicator: React.ReactElement;
    actionBar?: React.ReactNode;
}
function UserCard({
                      user,
                      role,
                      permissions,
                      onEdit,
                      tags,
                      statusIndicator,
                      actionBar,
                  }: UserCardProps) {
    const [expanded, setExpanded] = useState<boolean>(false);
    const [editMode, setEditMode] = useState(false);
    const theme = useContext(ThemeContext)!;

    return (
        <div
            style={{
                border: `1px solid ${editMode ? theme.primaryColor : "#eee"}`,
                padding: 12,
                borderRadius: 8,
                marginBottom: 8,
                fontSize: theme.fontSize,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div>
                    <strong>{user.name}</strong>
                    <div style={{ fontSize: 12, color: "#666" }}>{user.email}</div>
                    <div style={{ fontSize: 11, color: "#999" }}>
                        Role: {role} | Joined: {user.joinedAt.toLocaleDateString()}
                    </div>
                </div>
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                {permissions.map((p) => (
                    <span
                        key={p}
                        style={{
                            background: "#e3f2fd",
                            color: "#1565c0",
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: 11,
                        }}
                    >
						{p}
					</span>
                ))}
            </div>
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                {statusIndicator}
                {actionBar}
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
                <button type="button" onClick={() => setExpanded(!expanded)} style={{ fontSize: 12 }}>
                    {expanded ? "Hide" : "Show"} Details
                </button>
                <button type="button" onClick={() => setEditMode(!editMode)} style={{ fontSize: 12 }}>
                    {editMode ? "Cancel" : "Edit"}
                </button>
            </div>
            {expanded && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}>
                    <div>ID: {user.id}</div>
                    <div>Tags: {Array.from(tags.entries()).map(([k, v]) => `${k}=${String(v)}`).join(", ")}</div>
                    <button type="button" onClick={() => onEdit(user.id)} style={{ marginTop: 4 }}>
                        Save
                    </button>
                </div>
            )}
        </div>
    );
}

function DataTable({
                       columns,
                       rows,
                       sortBy,
                       onSort,
                   }: {
    columns: { key: string; label: string; width: number }[];
    rows: Record<string, string | number | boolean>[];
    sortBy: { column: string; direction: "asc" | "desc" } | null;
    onSort: (column: string) => void;
}) {
    const theme = useContext(ThemeContext)!;
    const [selectedRow, setSelectedRow] = useState<number | null>(null);

    return (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.fontSize - 2 }}>
            <thead>
            <tr>
                {columns.map((col) => (
                    <th
                        key={col.key}
                        onClick={() => onSort(col.key)}
                        style={{
                            width: col.width,
                            textAlign: "left",
                            padding: "4px 8px",
                            borderBottom: `2px solid ${theme.primaryColor}`,
                            cursor: "pointer",
                            background: sortBy?.column === col.key ? "#f5f5f5" : "transparent",
                        }}
                    >
                        {col.label} {sortBy?.column === col.key ? (sortBy.direction === "asc" ? "↑" : "↓") : ""}
                    </th>
                ))}
            </tr>
            </thead>
            <tbody>
            {rows.map((row, i) => (
                <tr
                    key={i}
                    onClick={() => setSelectedRow(i === selectedRow ? null : i)}
                    style={{
                        cursor: "pointer",
                        background: i === selectedRow ? `${theme.primaryColor}22` : "transparent",
                    }}
                >
                    {columns.map((col) => (
                        <td key={col.key} style={{ padding: "4px 8px", borderBottom: "1px solid #eee" }}>
                            {String(row[col.key])}
                        </td>
                    ))}
                </tr>
            ))}
            </tbody>
        </table>
    );
}

// --- Main App ---

function SampleApp() {
    const [sortBy, setSortBy] = useState<{ column: string; direction: "asc" | "desc" } | null>(null);
    const [activeTab, setActiveTab] = useState<"users" | "table">("users");

    const users = [
        {
            user: { name: "Alice Johnson", email: "alice@example.com", id: 1, joinedAt: new Date("2023-01-15") },
            role: "admin" as const,
            permissions: ["read", "write", "delete", "manage-users"],
            tags: new Map([["verified", true], ["premium", true], ["beta", false]]),
        },
        {
            user: { name: "Bob Smith", email: "bob@example.com", id: 2, joinedAt: new Date("2023-06-20") },
            role: "editor" as const,
            permissions: ["read", "write"],
            tags: new Map([["verified", true], ["premium", false]]),
        },
        {
            user: { name: "Carol Davis", email: "carol@example.com", id: 3, joinedAt: new Date("2024-02-10") },
            role: "viewer" as const,
            permissions: ["read"],
            tags: new Map([["verified", false]]),
        },
    ];

    const tableColumns = [
        { key: "name", label: "Name", width: 150 },
        { key: "status", label: "Status", width: 80 },
        { key: "score", label: "Score", width: 60 },
        { key: "active", label: "Active", width: 60 },
    ];

    const tableRows = [
        { name: "Project Alpha", status: "running", score: 94, active: true },
        { name: "Project Beta", status: "paused", score: 67, active: false },
        { name: "Project Gamma", status: "running", score: 88, active: true },
        { name: "Project Delta", status: "error", score: 23, active: false },
    ];

    return (
        <div style={{ fontFamily: "sans-serif" }}>
            <h3 style={{ margin: "0 0 8px" }}>Sample App</h3>
            <ThemeToggle />
            <UserProfile />
            <NotificationBell />

            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <button
                    type="button"
                    onClick={() => setActiveTab("users")}
                    style={{ fontWeight: activeTab === "users" ? "bold" : "normal" }}
                >
                    Users
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("table")}
                    style={{ fontWeight: activeTab === "table" ? "bold" : "normal" }}
                >
                    Data Table
                </button>
            </div>

            {activeTab === "users" &&
                users.map((u) => (
                    <UserCard
                        key={u.user.id}
                        user={u.user}
                        role={u.role}
                        permissions={u.permissions}
                        onEdit={(id) => console.log("edit", id)}
                        tags={u.tags}
                        statusIndicator={
                            <Icon name={u.role === "admin" ? "star" : "dot"} color={u.role === "admin" ? "#f57c00" : "#999"} />
                        }
                        actionBar={
                            <div style={{ display: "flex", gap: 4 }}>
                                <button type="button" style={{ fontSize: 11 }}>Message</button>
                                <button type="button" style={{ fontSize: 11 }}>Remove</button>
                            </div>
                        }
                    />
                ))}

            {activeTab === "table" && (
                <DataTable
                    columns={tableColumns}
                    rows={tableRows}
                    sortBy={sortBy}
                    onSort={(col) =>
                        setSortBy((prev) =>
                            prev?.column === col
                                ? { column: col, direction: prev.direction === "asc" ? "desc" : "asc" }
                                : { column: col, direction: "asc" },
                        )
                    }
                />
            )}
        </div>
    );
}

// Exports for sample-app-entry.ts
export {
    ThemeProvider,
    AuthProvider,
    NotificationProvider,
    ThemeContext,
    AuthContext,
    NotificationContext,
    UserCard,
    DataTable,
    SampleApp,
};

