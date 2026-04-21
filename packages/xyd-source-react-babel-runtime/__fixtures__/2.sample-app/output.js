import { jsxDEV } from "react/jsx-dev-runtime";
import { createContext, useState, useMemo, useContext } from "react";
const ThemeContext = createContext(null);
ThemeContext.displayName = "ThemeContext";
const AuthContext = createContext(null);
AuthContext.displayName = "AuthContext";
const NotificationContext = createContext(null);
NotificationContext.displayName = "NotificationContext";
function ThemeProvider({ children }) {
  const [mode, setMode] = useState("light");
  const [primaryColor, setPrimaryColor] = useState("#1976d2");
  const [fontSize, setFontSize] = useState(14);
  const value = useMemo(
    () => ({ mode, primaryColor, fontSize, setMode, setPrimaryColor, setFontSize }),
    [mode, primaryColor, fontSize]
  );
  return /* @__PURE__ */ jsxDEV(ThemeContext.Provider, { value, children }, void 0, false, {
    fileName: "<ROOT>/src/sample-app.tsx",
    lineNumber: 69,
    columnNumber: 12
  }, this);
}
function AuthProvider({ children }) {
  const [user, setUser] = useState({
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AJ"
  });
  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      login: setUser,
      logout: () => setUser(null)
    }),
    [user]
  );
  return /* @__PURE__ */ jsxDEV(AuthContext.Provider, { value, children }, void 0, false, {
    fileName: "<ROOT>/src/sample-app.tsx",
    lineNumber: 92,
    columnNumber: 12
  }, this);
}
function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([
    { id: 1, message: "Deployment completed successfully", type: "success", read: false },
    { id: 2, message: "New user signed up: Bob Smith", type: "info", read: false },
    { id: 3, message: "API rate limit approaching 80%", type: "warning", read: true }
  ]);
  const value = useMemo(() => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    return {
      notifications,
      unreadCount,
      addNotification: (msg, type) => setNotifications((prev) => [
        ...prev,
        { id: Date.now(), message: msg, type, read: false }
      ]),
      markRead: (id) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n)),
      clearAll: () => setNotifications([])
    };
  }, [notifications]);
  return /* @__PURE__ */ jsxDEV(NotificationContext.Provider, { value, children }, void 0, false, {
    fileName: "<ROOT>/src/sample-app.tsx",
    lineNumber: 118,
    columnNumber: 12
  }, this);
}
function ThemeToggle() {
  const theme = useContext(ThemeContext);
  return /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }, children: [
    /* @__PURE__ */ jsxDEV("button", { type: "button", onClick: () => theme.setMode(theme.mode === "light" ? "dark" : "light"), children: [
      theme.mode === "light" ? "🌙" : "☀️",
      " ",
      theme.mode
    ] }, void 0, true, {
      fileName: "<ROOT>/src/sample-app.tsx",
      lineNumber: 127,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(
      "input",
      {
        type: "color",
        value: theme.primaryColor,
        onChange: (e) => theme.setPrimaryColor(e.target.value),
        title: "Primary color"
      },
      void 0,
      false,
      {
        fileName: "<ROOT>/src/sample-app.tsx",
        lineNumber: 130,
        columnNumber: 13
      },
      this
    ),
    /* @__PURE__ */ jsxDEV("select", { value: theme.fontSize, onChange: (e) => theme.setFontSize(Number(e.target.value)), children: [
      /* @__PURE__ */ jsxDEV("option", { value: 12, children: "12px" }, void 0, false, {
        fileName: "<ROOT>/src/sample-app.tsx",
        lineNumber: 137,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("option", { value: 14, children: "14px" }, void 0, false, {
        fileName: "<ROOT>/src/sample-app.tsx",
        lineNumber: 138,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("option", { value: 16, children: "16px" }, void 0, false, {
        fileName: "<ROOT>/src/sample-app.tsx",
        lineNumber: 139,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("option", { value: 18, children: "18px" }, void 0, false, {
        fileName: "<ROOT>/src/sample-app.tsx",
        lineNumber: 140,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<ROOT>/src/sample-app.tsx",
      lineNumber: 136,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<ROOT>/src/sample-app.tsx",
    lineNumber: 126,
    columnNumber: 9
  }, this);
}
function UserProfile() {
  const auth = useContext(AuthContext);
  const theme = useContext(ThemeContext);
  if (!auth.isAuthenticated) {
    return /* @__PURE__ */ jsxDEV("div", { style: { padding: 8, border: "1px solid #eee", borderRadius: 8, marginBottom: 8 }, children: [
      /* @__PURE__ */ jsxDEV("span", { children: "Not logged in" }, void 0, false, {
        fileName: "<ROOT>/src/sample-app.tsx",
        lineNumber: 153,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          type: "button",
          onClick: () => auth.login({ id: 1, name: "Alice Johnson", email: "alice@example.com", role: "admin", avatar: "" }),
          style: { marginLeft: 8 },
          children: "Login"
        },
        void 0,
        false,
        {
          fileName: "<ROOT>/src/sample-app.tsx",
          lineNumber: 154,
          columnNumber: 17
        },
        this
      )
    ] }, void 0, true, {
      fileName: "<ROOT>/src/sample-app.tsx",
      lineNumber: 152,
      columnNumber: 13
    }, this);
  }
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      style: {
        padding: 8,
        border: `1px solid ${theme.primaryColor}`,
        borderRadius: 8,
        marginBottom: 8,
        fontSize: theme.fontSize
      },
      children: [
        /* @__PURE__ */ jsxDEV("strong", { children: auth.user.name }, void 0, false, {
          fileName: "<ROOT>/src/sample-app.tsx",
          lineNumber: 177,
          columnNumber: 13
        }, this),
        " (",
        auth.user.role,
        ")",
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: 11, color: "#666" }, children: auth.user.email }, void 0, false, {
          fileName: "<ROOT>/src/sample-app.tsx",
          lineNumber: 178,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("button", { type: "button", onClick: auth.logout, style: { marginTop: 4, fontSize: 11 }, children: "Logout" }, void 0, false, {
          fileName: "<ROOT>/src/sample-app.tsx",
          lineNumber: 179,
          columnNumber: 13
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "<ROOT>/src/sample-app.tsx",
      lineNumber: 168,
      columnNumber: 9
    },
    this
  );
}
function NotificationBell() {
  const { notifications, unreadCount, markRead, addNotification, clearAll } = useContext(NotificationContext);
  const [expanded, setExpanded] = useState(false);
  return /* @__PURE__ */ jsxDEV("div", { style: { marginBottom: 8 }, children: [
    /* @__PURE__ */ jsxDEV("button", { type: "button", onClick: () => setExpanded(!expanded), children: [
      "🔔 ",
      unreadCount > 0 && /* @__PURE__ */ jsxDEV("span", { style: { color: "red" }, children: [
        "(",
        unreadCount,
        ")"
      ] }, void 0, true, {
        fileName: "<ROOT>/src/sample-app.tsx",
        lineNumber: 194,
        columnNumber: 40
      }, this)
    ] }, void 0, true, {
      fileName: "<ROOT>/src/sample-app.tsx",
      lineNumber: 193,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(
      "button",
      {
        type: "button",
        onClick: () => addNotification("Test notification " + Date.now(), "info"),
        style: { marginLeft: 4, fontSize: 11 },
        children: "+ Add"
      },
      void 0,
      false,
      {
        fileName: "<ROOT>/src/sample-app.tsx",
        lineNumber: 196,
        columnNumber: 13
      },
      this
    ),
    /* @__PURE__ */ jsxDEV("button", { type: "button", onClick: clearAll, style: { marginLeft: 4, fontSize: 11 }, children: "Clear" }, void 0, false, {
      fileName: "<ROOT>/src/sample-app.tsx",
      lineNumber: 203,
      columnNumber: 13
    }, this),
    expanded && /* @__PURE__ */ jsxDEV("ul", { style: { listStyle: "none", padding: 0, margin: "4px 0" }, children: notifications.map((n) => /* @__PURE__ */ jsxDEV(
      "li",
      {
        onClick: () => markRead(n.id),
        style: {
          padding: "4px 8px",
          fontSize: 12,
          background: n.read ? "#f5f5f5" : "#e3f2fd",
          marginBottom: 2,
          borderRadius: 4,
          cursor: "pointer",
          borderLeft: `3px solid ${n.type === "error" ? "#f44336" : n.type === "warning" ? "#ff9800" : n.type === "success" ? "#4caf50" : "#2196f3"}`
        },
        children: [
          n.message,
          " ",
          !n.read && /* @__PURE__ */ jsxDEV("strong", { children: "(new)" }, void 0, false, {
            fileName: "<ROOT>/src/sample-app.tsx",
            lineNumber: 224,
            columnNumber: 53
          }, this)
        ]
      },
      n.id,
      true,
      {
        fileName: "<ROOT>/src/sample-app.tsx",
        lineNumber: 209,
        columnNumber: 25
      },
      this
    )) }, void 0, false, {
      fileName: "<ROOT>/src/sample-app.tsx",
      lineNumber: 207,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "<ROOT>/src/sample-app.tsx",
    lineNumber: 192,
    columnNumber: 9
  }, this);
}
function Icon({ name, color }) {
  return /* @__PURE__ */ jsxDEV("span", { style: { color, fontSize: 18 }, children: name === "star" ? "★" : name === "heart" ? "♥" : "●" }, void 0, false, {
    fileName: "<ROOT>/src/sample-app.tsx",
    lineNumber: 237,
    columnNumber: 9
  }, this);
}
function UserCard({
  user,
  role,
  permissions,
  onEdit,
  tags,
  statusIndicator,
  actionBar
}) {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const theme = useContext(ThemeContext);
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      style: {
        border: `1px solid ${editMode ? theme.primaryColor : "#eee"}`,
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        fontSize: theme.fontSize
      },
      children: [
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("strong", { children: user.name }, void 0, false, {
            fileName: "<ROOT>/src/sample-app.tsx",
            lineNumber: 281,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: 12, color: "#666" }, children: user.email }, void 0, false, {
            fileName: "<ROOT>/src/sample-app.tsx",
            lineNumber: 282,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: 11, color: "#999" }, children: [
            "Role: ",
            role,
            " | Joined: ",
            user.joinedAt.toLocaleDateString()
          ] }, void 0, true, {
            fileName: "<ROOT>/src/sample-app.tsx",
            lineNumber: 283,
            columnNumber: 21
          }, this)
        ] }, void 0, true, {
          fileName: "<ROOT>/src/sample-app.tsx",
          lineNumber: 280,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "<ROOT>/src/sample-app.tsx",
          lineNumber: 279,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { style: { marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }, children: permissions.map((p) => /* @__PURE__ */ jsxDEV(
          "span",
          {
            style: {
              background: "#e3f2fd",
              color: "#1565c0",
              padding: "2px 8px",
              borderRadius: 12,
              fontSize: 11
            },
            children: p
          },
          p,
          false,
          {
            fileName: "<ROOT>/src/sample-app.tsx",
            lineNumber: 290,
            columnNumber: 21
          },
          this
        )) }, void 0, false, {
          fileName: "<ROOT>/src/sample-app.tsx",
          lineNumber: 288,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { style: { marginTop: 6, display: "flex", alignItems: "center", gap: 8 }, children: [
          statusIndicator,
          actionBar
        ] }, void 0, true, {
          fileName: "<ROOT>/src/sample-app.tsx",
          lineNumber: 304,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { style: { marginTop: 8, display: "flex", gap: 4 }, children: [
          /* @__PURE__ */ jsxDEV("button", { type: "button", onClick: () => setExpanded(!expanded), style: { fontSize: 12 }, children: [
            expanded ? "Hide" : "Show",
            " Details"
          ] }, void 0, true, {
            fileName: "<ROOT>/src/sample-app.tsx",
            lineNumber: 309,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("button", { type: "button", onClick: () => setEditMode(!editMode), style: { fontSize: 12 }, children: editMode ? "Cancel" : "Edit" }, void 0, false, {
            fileName: "<ROOT>/src/sample-app.tsx",
            lineNumber: 312,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "<ROOT>/src/sample-app.tsx",
          lineNumber: 308,
          columnNumber: 13
        }, this),
        expanded && /* @__PURE__ */ jsxDEV("div", { style: { marginTop: 8, fontSize: 12, color: "#555" }, children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            "ID: ",
            user.id
          ] }, void 0, true, {
            fileName: "<ROOT>/src/sample-app.tsx",
            lineNumber: 318,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("div", { children: [
            "Tags: ",
            Array.from(tags.entries()).map(([k, v]) => `${k}=${String(v)}`).join(", ")
          ] }, void 0, true, {
            fileName: "<ROOT>/src/sample-app.tsx",
            lineNumber: 319,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("button", { type: "button", onClick: () => onEdit(user.id), style: { marginTop: 4 }, children: "Save" }, void 0, false, {
            fileName: "<ROOT>/src/sample-app.tsx",
            lineNumber: 320,
            columnNumber: 21
          }, this)
        ] }, void 0, true, {
          fileName: "<ROOT>/src/sample-app.tsx",
          lineNumber: 317,
          columnNumber: 17
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "<ROOT>/src/sample-app.tsx",
      lineNumber: 270,
      columnNumber: 9
    },
    this
  );
}
function DataTable({
  columns,
  rows,
  sortBy,
  onSort
}) {
  const theme = useContext(ThemeContext);
  const [selectedRow, setSelectedRow] = useState(null);
  return /* @__PURE__ */ jsxDEV("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: theme.fontSize - 2 }, children: [
    /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { children: columns.map((col) => /* @__PURE__ */ jsxDEV(
      "th",
      {
        onClick: () => onSort(col.key),
        style: {
          width: col.width,
          textAlign: "left",
          padding: "4px 8px",
          borderBottom: `2px solid ${theme.primaryColor}`,
          cursor: "pointer",
          background: (sortBy == null ? void 0 : sortBy.column) === col.key ? "#f5f5f5" : "transparent"
        },
        children: [
          col.label,
          " ",
          (sortBy == null ? void 0 : sortBy.column) === col.key ? sortBy.direction === "asc" ? "↑" : "↓" : ""
        ]
      },
      col.key,
      true,
      {
        fileName: "<ROOT>/src/sample-app.tsx",
        lineNumber: 348,
        columnNumber: 21
      },
      this
    )) }, void 0, false, {
      fileName: "<ROOT>/src/sample-app.tsx",
      lineNumber: 346,
      columnNumber: 13
    }, this) }, void 0, false, {
      fileName: "<ROOT>/src/sample-app.tsx",
      lineNumber: 345,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("tbody", { children: rows.map((row, i) => /* @__PURE__ */ jsxDEV(
      "tr",
      {
        onClick: () => setSelectedRow(i === selectedRow ? null : i),
        style: {
          cursor: "pointer",
          background: i === selectedRow ? `${theme.primaryColor}22` : "transparent"
        },
        children: columns.map((col) => /* @__PURE__ */ jsxDEV("td", { style: { padding: "4px 8px", borderBottom: "1px solid #eee" }, children: String(row[col.key]) }, col.key, false, {
          fileName: "<ROOT>/src/sample-app.tsx",
          lineNumber: 376,
          columnNumber: 25
        }, this))
      },
      i,
      false,
      {
        fileName: "<ROOT>/src/sample-app.tsx",
        lineNumber: 367,
        columnNumber: 17
      },
      this
    )) }, void 0, false, {
      fileName: "<ROOT>/src/sample-app.tsx",
      lineNumber: 365,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<ROOT>/src/sample-app.tsx",
    lineNumber: 344,
    columnNumber: 9
  }, this);
}
function SampleApp() {
  const [sortBy, setSortBy] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const users = [
    {
      user: { name: "Alice Johnson", email: "alice@example.com", id: 1, joinedAt: /* @__PURE__ */ new Date("2023-01-15") },
      role: "admin",
      permissions: ["read", "write", "delete", "manage-users"],
      tags: /* @__PURE__ */ new Map([["verified", true], ["premium", true], ["beta", false]])
    },
    {
      user: { name: "Bob Smith", email: "bob@example.com", id: 2, joinedAt: /* @__PURE__ */ new Date("2023-06-20") },
      role: "editor",
      permissions: ["read", "write"],
      tags: /* @__PURE__ */ new Map([["verified", true], ["premium", false]])
    },
    {
      user: { name: "Carol Davis", email: "carol@example.com", id: 3, joinedAt: /* @__PURE__ */ new Date("2024-02-10") },
      role: "viewer",
      permissions: ["read"],
      tags: /* @__PURE__ */ new Map([["verified", false]])
    }
  ];
  const tableColumns = [
    { key: "name", label: "Name", width: 150 },
    { key: "status", label: "Status", width: 80 },
    { key: "score", label: "Score", width: 60 },
    { key: "active", label: "Active", width: 60 }
  ];
  const tableRows = [
    { name: "Project Alpha", status: "running", score: 94, active: true },
    { name: "Project Beta", status: "paused", score: 67, active: false },
    { name: "Project Gamma", status: "running", score: 88, active: true },
    { name: "Project Delta", status: "error", score: 23, active: false }
  ];
  return /* @__PURE__ */ jsxDEV("div", { style: { fontFamily: "sans-serif" }, children: [
    /* @__PURE__ */ jsxDEV("h3", { style: { margin: "0 0 8px" }, children: "Sample App" }, void 0, false, {
      fileName: "<ROOT>/src/sample-app.tsx",
      lineNumber: 430,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(ThemeToggle, {}, void 0, false, {
      fileName: "<ROOT>/src/sample-app.tsx",
      lineNumber: 431,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(UserProfile, {}, void 0, false, {
      fileName: "<ROOT>/src/sample-app.tsx",
      lineNumber: 432,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(NotificationBell, {}, void 0, false, {
      fileName: "<ROOT>/src/sample-app.tsx",
      lineNumber: 433,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 8, marginBottom: 8 }, children: [
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          type: "button",
          onClick: () => setActiveTab("users"),
          style: { fontWeight: activeTab === "users" ? "bold" : "normal" },
          children: "Users"
        },
        void 0,
        false,
        {
          fileName: "<ROOT>/src/sample-app.tsx",
          lineNumber: 436,
          columnNumber: 17
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          type: "button",
          onClick: () => setActiveTab("table"),
          style: { fontWeight: activeTab === "table" ? "bold" : "normal" },
          children: "Data Table"
        },
        void 0,
        false,
        {
          fileName: "<ROOT>/src/sample-app.tsx",
          lineNumber: 443,
          columnNumber: 17
        },
        this
      )
    ] }, void 0, true, {
      fileName: "<ROOT>/src/sample-app.tsx",
      lineNumber: 435,
      columnNumber: 13
    }, this),
    activeTab === "users" && users.map((u) => /* @__PURE__ */ jsxDEV(
      UserCard,
      {
        user: u.user,
        role: u.role,
        permissions: u.permissions,
        onEdit: (id) => console.log("edit", id),
        tags: u.tags,
        statusIndicator: /* @__PURE__ */ jsxDEV(Icon, { name: u.role === "admin" ? "star" : "dot", color: u.role === "admin" ? "#f57c00" : "#999" }, void 0, false, {
          fileName: "<ROOT>/src/sample-app.tsx",
          lineNumber: 462,
          columnNumber: 29
        }, this),
        actionBar: /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 4 }, children: [
          /* @__PURE__ */ jsxDEV("button", { type: "button", style: { fontSize: 11 }, children: "Message" }, void 0, false, {
            fileName: "<ROOT>/src/sample-app.tsx",
            lineNumber: 466,
            columnNumber: 33
          }, this),
          /* @__PURE__ */ jsxDEV("button", { type: "button", style: { fontSize: 11 }, children: "Remove" }, void 0, false, {
            fileName: "<ROOT>/src/sample-app.tsx",
            lineNumber: 467,
            columnNumber: 33
          }, this)
        ] }, void 0, true, {
          fileName: "<ROOT>/src/sample-app.tsx",
          lineNumber: 465,
          columnNumber: 29
        }, this)
      },
      u.user.id,
      false,
      {
        fileName: "<ROOT>/src/sample-app.tsx",
        lineNumber: 454,
        columnNumber: 21
      },
      this
    )),
    activeTab === "table" && /* @__PURE__ */ jsxDEV(
      DataTable,
      {
        columns: tableColumns,
        rows: tableRows,
        sortBy,
        onSort: (col) => setSortBy(
          (prev) => (prev == null ? void 0 : prev.column) === col ? { column: col, direction: prev.direction === "asc" ? "desc" : "asc" } : { column: col, direction: "asc" }
        )
      },
      void 0,
      false,
      {
        fileName: "<ROOT>/src/sample-app.tsx",
        lineNumber: 474,
        columnNumber: 17
      },
      this
    )
  ] }, void 0, true, {
    fileName: "<ROOT>/src/sample-app.tsx",
    lineNumber: 429,
    columnNumber: 9
  }, this);
}
ThemeContext.__xydUniform = JSON.parse('{"title":"ThemeContext","canonical":"","description":"","context":{"symbolId":"26","symbolName":"ThemeContext","symbolKind":32,"packageName":"xyd-fixture-2-sample-app","fileName":"sample-app.tsx","fileFullPath":"src/sample-app.tsx","line":18,"col":6,"signatureText":{"code":"const ThemeContext = createContext<ThemeContextValue | null>(null);","lang":"ts"},"sourcecode":{"code":"const ThemeContext = createContext<ThemeContextValue | null>(null);","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Type","properties":[{"name":"mode","type":"\\"light\\" | \\"dark\\"","description":"","meta":[{"name":"required","value":"true"}]},{"name":"primaryColor","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"fontSize","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"setMode","type":"(mode: \\"light\\" | \\"dark\\") => void","description":"","meta":[{"name":"required","value":"true"}]},{"name":"setPrimaryColor","type":"(color: string) => void","description":"","meta":[{"name":"required","value":"true"}]},{"name":"setFontSize","type":"(size: number) => void","description":"","meta":[{"name":"required","value":"true"}]}]}]}');
AuthContext.__xydUniform = JSON.parse('{"title":"AuthContext","canonical":"","description":"","context":{"symbolId":"27","symbolName":"AuthContext","symbolKind":32,"packageName":"xyd-fixture-2-sample-app","fileName":"sample-app.tsx","fileFullPath":"src/sample-app.tsx","line":36,"col":6,"signatureText":{"code":"const AuthContext = createContext<AuthContextValue | null>(null);","lang":"ts"},"sourcecode":{"code":"const AuthContext = createContext<AuthContextValue | null>(null);","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Type","properties":[{"name":"user","type":"AuthUser | null","description":"","meta":[{"name":"required","value":"true"}]},{"name":"isAuthenticated","type":"boolean","description":"","meta":[{"name":"required","value":"true"}]},{"name":"login","type":"(user: AuthUser) => void","description":"","meta":[{"name":"required","value":"true"}]},{"name":"logout","type":"() => void","description":"","meta":[{"name":"required","value":"true"}]}]}]}');
NotificationContext.__xydUniform = JSON.parse('{"title":"NotificationContext","canonical":"","description":"","context":{"symbolId":"28","symbolName":"NotificationContext","symbolKind":32,"packageName":"xyd-fixture-2-sample-app","fileName":"sample-app.tsx","fileFullPath":"src/sample-app.tsx","line":54,"col":6,"signatureText":{"code":"const NotificationContext = createContext<NotificationContextValue | null>(null);","lang":"ts"},"sourcecode":{"code":"const NotificationContext = createContext<NotificationContextValue | null>(null);","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Type","properties":[{"name":"notifications","type":"Notification[]","description":"","meta":[{"name":"required","value":"true"}]},{"name":"unreadCount","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"addNotification","type":"(msg: string, type: Notification[\\"type\\"]) => void","description":"","meta":[{"name":"required","value":"true"}]},{"name":"markRead","type":"(id: number) => void","description":"","meta":[{"name":"required","value":"true"}]},{"name":"clearAll","type":"() => void","description":"","meta":[{"name":"required","value":"true"}]}]}]}');
ThemeProvider.__xydUniform = JSON.parse('{"title":"ThemeProvider","canonical":"xyd-fixture-2-sample-app/components/ThemeProvider","description":"","context":{"symbolId":"11","symbolName":"ThemeProvider","symbolKind":64,"packageName":"xyd-fixture-2-sample-app","fileName":"sample-app.tsx","fileFullPath":"src/sample-app.tsx","line":59,"col":9,"signatureText":{"code":"function ThemeProvider({ children }: {\\n    children: React.ReactNode;\\n});","lang":"ts"},"sourcecode":{"code":"function ThemeProvider({ children }: { children: React.ReactNode }) {\\n    const [mode, setMode] = useState<\\"light\\" | \\"dark\\">(\\"light\\");\\n    const [primaryColor, setPrimaryColor] = useState(\\"#1976d2\\");\\n    const [fontSize, setFontSize] = useState(14);\\n\\n    const value = useMemo(\\n        (): ThemeContextValue => ({ mode, primaryColor, fontSize, setMode, setPrimaryColor, setFontSize }),\\n        [mode, primaryColor, fontSize],\\n    );\\n\\n    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;\\n}","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Props","properties":[{"name":"children","type":"React.ReactNode","description":"","meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"type","value":"parameters"}]}]}');
AuthProvider.__xydUniform = JSON.parse('{"title":"AuthProvider","canonical":"xyd-fixture-2-sample-app/components/AuthProvider","description":"","context":{"symbolId":"16","symbolName":"AuthProvider","symbolKind":64,"packageName":"xyd-fixture-2-sample-app","fileName":"sample-app.tsx","fileFullPath":"src/sample-app.tsx","line":72,"col":9,"signatureText":{"code":"function AuthProvider({ children }: {\\n    children: React.ReactNode;\\n});","lang":"ts"},"sourcecode":{"code":"function AuthProvider({ children }: { children: React.ReactNode }) {\\n    const [user, setUser] = useState<AuthUser | null>({\\n        id: 1,\\n        name: \\"Alice Johnson\\",\\n        email: \\"alice@example.com\\",\\n        role: \\"admin\\",\\n        avatar: \\"https://api.dicebear.com/7.x/initials/svg?seed=AJ\\",\\n    });\\n\\n    const value = useMemo(\\n        (): AuthContextValue => ({\\n            user,\\n\\n            isAuthenticated: user !== null,\\n            login: setUser,\\n            logout: () => setUser(null),\\n        }),\\n        [user],\\n    );\\n\\n    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;\\n}","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Props","properties":[{"name":"children","type":"React.ReactNode","description":"","meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"type","value":"parameters"}]}]}');
NotificationProvider.__xydUniform = JSON.parse('{"title":"NotificationProvider","canonical":"xyd-fixture-2-sample-app/components/NotificationProvider","description":"","context":{"symbolId":"21","symbolName":"NotificationProvider","symbolKind":64,"packageName":"xyd-fixture-2-sample-app","fileName":"sample-app.tsx","fileFullPath":"src/sample-app.tsx","line":95,"col":9,"signatureText":{"code":"function NotificationProvider({ children }: {\\n    children: React.ReactNode;\\n});","lang":"ts"},"sourcecode":{"code":"function NotificationProvider({ children }: { children: React.ReactNode }) {\\n    const [notifications, setNotifications] = useState<Notification[]>([\\n        { id: 1, message: \\"Deployment completed successfully\\", type: \\"success\\", read: false },\\n        { id: 2, message: \\"New user signed up: Bob Smith\\", type: \\"info\\", read: false },\\n        { id: 3, message: \\"API rate limit approaching 80%\\", type: \\"warning\\", read: true },\\n    ]);\\n\\n    const value = useMemo((): NotificationContextValue => {\\n        const unreadCount = notifications.filter((n) => !n.read).length;\\n        return {\\n            notifications,\\n            unreadCount,\\n            addNotification: (msg, type) =>\\n                setNotifications((prev) => [\\n                    ...prev,\\n                    { id: Date.now(), message: msg, type, read: false },\\n                ]),\\n            markRead: (id) =>\\n                setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))),\\n            clearAll: () => setNotifications([]),\\n        };\\n    }, [notifications]);\\n\\n    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;\\n}","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Props","properties":[{"name":"children","type":"React.ReactNode","description":"","meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"type","value":"parameters"}]}]}');
UserCard.__xydUniform = JSON.parse('{"title":"UserCard","canonical":"xyd-fixture-2-sample-app/components/UserCard","description":"","context":{"symbolId":"29","symbolName":"UserCard","symbolKind":64,"packageName":"xyd-fixture-2-sample-app","fileName":"sample-app.tsx","fileFullPath":"src/sample-app.tsx","line":256,"col":9,"signatureText":{"code":"function UserCard({ user, role, permissions, onEdit, tags, statusIndicator, actionBar, }: UserCardProps);","lang":"ts"},"sourcecode":{"code":"function UserCard({\\n                      user,\\n                      role,\\n                      permissions,\\n                      onEdit,\\n                      tags,\\n                      statusIndicator,\\n                      actionBar,\\n                  }: UserCardProps) {\\n    const [expanded, setExpanded] = useState<boolean>(false);\\n    const [editMode, setEditMode] = useState(false);\\n    const theme = useContext(ThemeContext)!;\\n\\n    return (\\n        <div\\n            style={{\\n                border: `1px solid ${editMode ? theme.primaryColor : \\"#eee\\"}`,\\n                padding: 12,\\n                borderRadius: 8,\\n                marginBottom: 8,\\n                fontSize: theme.fontSize,\\n            }}\\n        >\\n            <div style={{ display: \\"flex\\", alignItems: \\"center\\", gap: 12 }}>\\n                <div>\\n                    <strong>{user.name}</strong>\\n                    <div style={{ fontSize: 12, color: \\"#666\\" }}>{user.email}</div>\\n                    <div style={{ fontSize: 11, color: \\"#999\\" }}>\\n                        Role: {role} | Joined: {user.joinedAt.toLocaleDateString()}\\n                    </div>\\n                </div>\\n            </div>\\n            <div style={{ marginTop: 8, display: \\"flex\\", gap: 4, flexWrap: \\"wrap\\" }}>\\n                {permissions.map((p) => (\\n                    <span\\n                        key={p}\\n                        style={{\\n                            background: \\"#e3f2fd\\",\\n                            color: \\"#1565c0\\",\\n                            padding: \\"2px 8px\\",\\n                            borderRadius: 12,\\n                            fontSize: 11,\\n                        }}\\n                    >\\n\\t\\t\\t\\t\\t\\t{p}\\n\\t\\t\\t\\t\\t</span>\\n                ))}\\n            </div>\\n            <div style={{ marginTop: 6, display: \\"flex\\", alignItems: \\"center\\", gap: 8 }}>\\n                {statusIndicator}\\n                {actionBar}\\n            </div>\\n            <div style={{ marginTop: 8, display: \\"flex\\", gap: 4 }}>\\n                <button type=\\"button\\" onClick={() => setExpanded(!expanded)} style={{ fontSize: 12 }}>\\n                    {expanded ? \\"Hide\\" : \\"Show\\"} Details\\n                </button>\\n                <button type=\\"button\\" onClick={() => setEditMode(!editMode)} style={{ fontSize: 12 }}>\\n                    {editMode ? \\"Cancel\\" : \\"Edit\\"}\\n                </button>\\n            </div>\\n            {expanded && (\\n                <div style={{ marginTop: 8, fontSize: 12, color: \\"#555\\" }}>\\n                    <div>ID: {user.id}</div>\\n                    <div>Tags: {Array.from(tags.entries()).map(([k, v]) => `${k}=${String(v)}`).join(\\", \\")}</div>\\n                    <button type=\\"button\\" onClick={() => onEdit(user.id)} style={{ marginTop: 4 }}>\\n                        Save\\n                    </button>\\n                </div>\\n            )}\\n        </div>\\n    );\\n}","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Props","properties":[],"meta":[{"name":"type","value":"parameters"}]}]}');
DataTable.__xydUniform = JSON.parse('{"title":"DataTable","canonical":"xyd-fixture-2-sample-app/components/DataTable","description":"","context":{"symbolId":"32","symbolName":"DataTable","symbolKind":64,"packageName":"xyd-fixture-2-sample-app","fileName":"sample-app.tsx","fileFullPath":"src/sample-app.tsx","line":329,"col":9,"signatureText":{"code":"function DataTable({ columns, rows, sortBy, onSort, }: {\\n    columns: {\\n        key: string;\\n        label: string;\\n        width: number;\\n    }[];\\n    rows: Record<string, string | number | boolean>[];\\n    sortBy: {\\n        column: string;\\n        direction: \\"asc\\" | \\"desc\\";\\n    } | null;\\n    onSort: (column: string) => void;\\n});","lang":"ts"},"sourcecode":{"code":"function DataTable({\\n                       columns,\\n                       rows,\\n                       sortBy,\\n                       onSort,\\n                   }: {\\n    columns: { key: string; label: string; width: number }[];\\n    rows: Record<string, string | number | boolean>[];\\n    sortBy: { column: string; direction: \\"asc\\" | \\"desc\\" } | null;\\n    onSort: (column: string) => void;\\n}) {\\n    const theme = useContext(ThemeContext)!;\\n    const [selectedRow, setSelectedRow] = useState<number | null>(null);\\n\\n    return (\\n        <table style={{ width: \\"100%\\", borderCollapse: \\"collapse\\", fontSize: theme.fontSize - 2 }}>\\n            <thead>\\n            <tr>\\n                {columns.map((col) => (\\n                    <th\\n                        key={col.key}\\n                        onClick={() => onSort(col.key)}\\n                        style={{\\n                            width: col.width,\\n                            textAlign: \\"left\\",\\n                            padding: \\"4px 8px\\",\\n                            borderBottom: `2px solid ${theme.primaryColor}`,\\n                            cursor: \\"pointer\\",\\n                            background: sortBy?.column === col.key ? \\"#f5f5f5\\" : \\"transparent\\",\\n                        }}\\n                    >\\n                        {col.label} {sortBy?.column === col.key ? (sortBy.direction === \\"asc\\" ? \\"↑\\" : \\"↓\\") : \\"\\"}\\n                    </th>\\n                ))}\\n            </tr>\\n            </thead>\\n            <tbody>\\n            {rows.map((row, i) => (\\n                <tr\\n                    key={i}\\n                    onClick={() => setSelectedRow(i === selectedRow ? null : i)}\\n                    style={{\\n                        cursor: \\"pointer\\",\\n                        background: i === selectedRow ? `${theme.primaryColor}22` : \\"transparent\\",\\n                    }}\\n                >\\n                    {columns.map((col) => (\\n                        <td key={col.key} style={{ padding: \\"4px 8px\\", borderBottom: \\"1px solid #eee\\" }}>\\n                            {String(row[col.key])}\\n                        </td>\\n                    ))}\\n                </tr>\\n            ))}\\n            </tbody>\\n        </table>\\n    );\\n}","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Props","properties":[{"name":"columns","type":"$$array","description":"","ofProperty":{"name":"","description":"","type":"","properties":[]},"meta":[{"name":"required","value":"true"}]},{"name":"rows","type":"Record<string, string | number | boolean>[]","description":"","meta":[{"name":"required","value":"true"}]},{"name":"sortBy","type":"","description":"","properties":[{"name":"column","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"direction","type":"\\"asc\\" | \\"desc\\"","description":"","symbolDef":{"id":[]},"meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"required","value":"true"}]},{"name":"onSort","type":"","description":"","properties":[],"meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"type","value":"parameters"}]}]}');
SampleApp.__xydUniform = JSON.parse('{"title":"SampleApp","canonical":"xyd-fixture-2-sample-app/components/SampleApp","description":"","context":{"symbolId":"50","symbolName":"SampleApp","symbolKind":64,"packageName":"xyd-fixture-2-sample-app","fileName":"sample-app.tsx","fileFullPath":"src/sample-app.tsx","line":389,"col":9,"signatureText":{"code":"function SampleApp();","lang":"ts"},"sourcecode":{"code":"function SampleApp() {\\n    const [sortBy, setSortBy] = useState<{ column: string; direction: \\"asc\\" | \\"desc\\" } | null>(null);\\n    const [activeTab, setActiveTab] = useState<\\"users\\" | \\"table\\">(\\"users\\");\\n\\n    const users = [\\n        {\\n            user: { name: \\"Alice Johnson\\", email: \\"alice@example.com\\", id: 1, joinedAt: new Date(\\"2023-01-15\\") },\\n            role: \\"admin\\" as const,\\n            permissions: [\\"read\\", \\"write\\", \\"delete\\", \\"manage-users\\"],\\n            tags: new Map([[\\"verified\\", true], [\\"premium\\", true], [\\"beta\\", false]]),\\n        },\\n        {\\n            user: { name: \\"Bob Smith\\", email: \\"bob@example.com\\", id: 2, joinedAt: new Date(\\"2023-06-20\\") },\\n            role: \\"editor\\" as const,\\n            permissions: [\\"read\\", \\"write\\"],\\n            tags: new Map([[\\"verified\\", true], [\\"premium\\", false]]),\\n        },\\n        {\\n            user: { name: \\"Carol Davis\\", email: \\"carol@example.com\\", id: 3, joinedAt: new Date(\\"2024-02-10\\") },\\n            role: \\"viewer\\" as const,\\n            permissions: [\\"read\\"],\\n            tags: new Map([[\\"verified\\", false]]),\\n        },\\n    ];\\n\\n    const tableColumns = [\\n        { key: \\"name\\", label: \\"Name\\", width: 150 },\\n        { key: \\"status\\", label: \\"Status\\", width: 80 },\\n        { key: \\"score\\", label: \\"Score\\", width: 60 },\\n        { key: \\"active\\", label: \\"Active\\", width: 60 },\\n    ];\\n\\n    const tableRows = [\\n        { name: \\"Project Alpha\\", status: \\"running\\", score: 94, active: true },\\n        { name: \\"Project Beta\\", status: \\"paused\\", score: 67, active: false },\\n        { name: \\"Project Gamma\\", status: \\"running\\", score: 88, active: true },\\n        { name: \\"Project Delta\\", status: \\"error\\", score: 23, active: false },\\n    ];\\n\\n    return (\\n        <div style={{ fontFamily: \\"sans-serif\\" }}>\\n            <h3 style={{ margin: \\"0 0 8px\\" }}>Sample App</h3>\\n            <ThemeToggle />\\n            <UserProfile />\\n            <NotificationBell />\\n\\n            <div style={{ display: \\"flex\\", gap: 8, marginBottom: 8 }}>\\n                <button\\n                    type=\\"button\\"\\n                    onClick={() => setActiveTab(\\"users\\")}\\n                    style={{ fontWeight: activeTab === \\"users\\" ? \\"bold\\" : \\"normal\\" }}\\n                >\\n                    Users\\n                </button>\\n                <button\\n                    type=\\"button\\"\\n                    onClick={() => setActiveTab(\\"table\\")}\\n                    style={{ fontWeight: activeTab === \\"table\\" ? \\"bold\\" : \\"normal\\" }}\\n                >\\n                    Data Table\\n                </button>\\n            </div>\\n\\n            {activeTab === \\"users\\" &&\\n                users.map((u) => (\\n                    <UserCard\\n                        key={u.user.id}\\n                        user={u.user}\\n                        role={u.role}\\n                        permissions={u.permissions}\\n                        onEdit={(id) => console.log(\\"edit\\", id)}\\n                        tags={u.tags}\\n                        statusIndicator={\\n                            <Icon name={u.role === \\"admin\\" ? \\"star\\" : \\"dot\\"} color={u.role === \\"admin\\" ? \\"#f57c00\\" : \\"#999\\"} />\\n                        }\\n                        actionBar={\\n                            <div style={{ display: \\"flex\\", gap: 4 }}>\\n                                <button type=\\"button\\" style={{ fontSize: 11 }}>Message</button>\\n                                <button type=\\"button\\" style={{ fontSize: 11 }}>Remove</button>\\n                            </div>\\n                        }\\n                    />\\n                ))}\\n\\n            {activeTab === \\"table\\" && (\\n                <DataTable\\n                    columns={tableColumns}\\n                    rows={tableRows}\\n                    sortBy={sortBy}\\n                    onSort={(col) =>\\n                        setSortBy((prev) =>\\n                            prev?.column === col\\n                                ? { column: col, direction: prev.direction === \\"asc\\" ? \\"desc\\" : \\"asc\\" }\\n                                : { column: col, direction: \\"asc\\" },\\n                        )\\n                    }\\n                />\\n            )}\\n        </div>\\n    );\\n}","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Props","properties":[],"meta":[{"name":"type","value":"parameters"}]}]}');
export {
  AuthContext,
  AuthProvider,
  DataTable,
  NotificationContext,
  NotificationProvider,
  SampleApp,
  ThemeContext,
  ThemeProvider,
  UserCard
};
