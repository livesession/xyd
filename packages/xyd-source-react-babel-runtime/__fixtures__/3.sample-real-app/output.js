import { jsxDEV } from "react/jsx-dev-runtime";
import { createContext, useState, useMemo, useCallback, useEffect, useContext } from "react";
const TodoContext = createContext(null);
TodoContext.displayName = "TodoContext";
function generateId() {
  return Math.random().toString(36).substring(2, 11);
}
function TodoProvider({ children }) {
  const [todos, setTodos] = useState([
    {
      id: generateId(),
      title: "Set up project with Vite and Tailwind",
      description: "Initialize the project scaffold with proper tooling",
      completed: true,
      priority: "high",
      tags: ["setup", "tooling"],
      createdAt: /* @__PURE__ */ new Date("2025-01-10"),
      completedAt: /* @__PURE__ */ new Date("2025-01-11")
    },
    {
      id: generateId(),
      title: "Build TodoItem component",
      completed: false,
      priority: "medium",
      tags: ["ui", "components"],
      createdAt: /* @__PURE__ */ new Date("2025-01-12"),
      dueDate: /* @__PURE__ */ new Date("2025-02-01")
    },
    {
      id: generateId(),
      title: "Add drag-and-drop reordering",
      description: "Use a library like dnd-kit for accessible drag and drop",
      completed: false,
      priority: "low",
      tags: ["ui", "enhancement"],
      createdAt: /* @__PURE__ */ new Date("2025-01-13")
    },
    {
      id: generateId(),
      title: "Fix overdue task styling",
      completed: false,
      priority: "urgent",
      tags: ["bug", "ui"],
      createdAt: /* @__PURE__ */ new Date("2025-01-08"),
      dueDate: /* @__PURE__ */ new Date("2025-01-14")
    }
  ]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const stats = useMemo(() => {
    const now = /* @__PURE__ */ new Date();
    const byPriority = { low: 0, medium: 0, high: 0, urgent: 0 };
    let active = 0;
    let completed = 0;
    let overdue = 0;
    for (const todo of todos) {
      byPriority[todo.priority]++;
      if (todo.completed) {
        completed++;
      } else {
        active++;
        if (todo.dueDate && todo.dueDate < now) {
          overdue++;
        }
      }
    }
    return { total: todos.length, active, completed, overdue, byPriority };
  }, [todos]);
  const addTodo = useCallback(
    (title, priority, description, tags, dueDate) => {
      setTodos((prev) => [
        ...prev,
        {
          id: generateId(),
          title,
          description,
          completed: false,
          priority,
          tags: tags || [],
          createdAt: /* @__PURE__ */ new Date(),
          dueDate
        }
      ]);
    },
    []
  );
  const toggleTodo = useCallback((id) => {
    setTodos(
      (prev) => prev.map(
        (t) => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? /* @__PURE__ */ new Date() : void 0 } : t
      )
    );
  }, []);
  const deleteTodo = useCallback((id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const updateTodo = useCallback(
    (id, updates) => {
      setTodos((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
    },
    []
  );
  const clearCompleted = useCallback(() => {
    setTodos((prev) => prev.filter((t) => !t.completed));
  }, []);
  const value = useMemo(
    () => ({
      todos,
      filter,
      searchQuery,
      stats,
      addTodo,
      toggleTodo,
      deleteTodo,
      updateTodo,
      setFilter,
      setSearchQuery,
      clearCompleted
    }),
    [todos, filter, searchQuery, stats, addTodo, toggleTodo, deleteTodo, updateTodo, clearCompleted]
  );
  return /* @__PURE__ */ jsxDEV(TodoContext.Provider, { value, children }, void 0, false, {
    fileName: "<ROOT>/src/contexts/TodoContext.tsx",
    lineNumber: 150,
    columnNumber: 12
  }, this);
}
TodoProvider.__xydUniform = JSON.parse('{"title":"TodoProvider","canonical":"xyd-fixture-3-todo-app/components/TodoProvider","description":"","context":{"symbolId":"150","symbolName":"TodoProvider","symbolKind":64,"packageName":"contexts/TodoContext","fileName":"contexts/TodoContext.tsx","fileFullPath":"src/contexts/TodoContext.tsx","line":25,"col":9,"signatureText":{"code":"function TodoProvider({ children }: {\\n    children: React.ReactNode;\\n});","lang":"ts"},"sourcecode":{"code":"function TodoProvider({ children }: { children: React.ReactNode }) {\\n    const [todos, setTodos] = useState<Todo[]>([\\n        {\\n            id: generateId(),\\n            title: \\"Set up project with Vite and Tailwind\\",\\n            description: \\"Initialize the project scaffold with proper tooling\\",\\n            completed: true,\\n            priority: \\"high\\",\\n            tags: [\\"setup\\", \\"tooling\\"],\\n            createdAt: new Date(\\"2025-01-10\\"),\\n            completedAt: new Date(\\"2025-01-11\\"),\\n        },\\n        {\\n            id: generateId(),\\n            title: \\"Build TodoItem component\\",\\n            completed: false,\\n            priority: \\"medium\\",\\n            tags: [\\"ui\\", \\"components\\"],\\n            createdAt: new Date(\\"2025-01-12\\"),\\n            dueDate: new Date(\\"2025-02-01\\"),\\n        },\\n        {\\n            id: generateId(),\\n            title: \\"Add drag-and-drop reordering\\",\\n            description: \\"Use a library like dnd-kit for accessible drag and drop\\",\\n            completed: false,\\n            priority: \\"low\\",\\n            tags: [\\"ui\\", \\"enhancement\\"],\\n            createdAt: new Date(\\"2025-01-13\\"),\\n        },\\n        {\\n            id: generateId(),\\n            title: \\"Fix overdue task styling\\",\\n            completed: false,\\n            priority: \\"urgent\\",\\n            tags: [\\"bug\\", \\"ui\\"],\\n            createdAt: new Date(\\"2025-01-08\\"),\\n            dueDate: new Date(\\"2025-01-14\\"),\\n        },\\n    ]);\\n\\n    const [filter, setFilter] = useState<FilterStatus>(\\"all\\");\\n    const [searchQuery, setSearchQuery] = useState(\\"\\");\\n\\n    const stats = useMemo((): TodoStats => {\\n        const now = new Date();\\n        const byPriority: Record<Priority, number> = { low: 0, medium: 0, high: 0, urgent: 0 };\\n        let active = 0;\\n        let completed = 0;\\n        let overdue = 0;\\n\\n        for (const todo of todos) {\\n            byPriority[todo.priority]++;\\n            if (todo.completed) {\\n                completed++;\\n            } else {\\n                active++;\\n                if (todo.dueDate && todo.dueDate < now) {\\n                    overdue++;\\n                }\\n            }\\n        }\\n\\n        return { total: todos.length, active, completed, overdue, byPriority };\\n    }, [todos]);\\n\\n    const addTodo = useCallback(\\n        (title: string, priority: Priority, description?: string, tags?: string[], dueDate?: Date) => {\\n            setTodos((prev) => [\\n                ...prev,\\n                {\\n                    id: generateId(),\\n                    title,\\n                    description,\\n                    completed: false,\\n                    priority,\\n                    tags: tags || [],\\n                    createdAt: new Date(),\\n                    dueDate,\\n                },\\n            ]);\\n        },\\n        [],\\n    );\\n\\n    const toggleTodo = useCallback((id: string) => {\\n        setTodos((prev) =>\\n            prev.map((t) =>\\n                t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date() : undefined } : t,\\n            ),\\n        );\\n    }, []);\\n\\n    const deleteTodo = useCallback((id: string) => {\\n        setTodos((prev) => prev.filter((t) => t.id !== id));\\n    }, []);\\n\\n    const updateTodo = useCallback(\\n        (id: string, updates: Partial<Pick<Todo, \\"title\\" | \\"description\\" | \\"priority\\" | \\"tags\\" | \\"dueDate\\">>) => {\\n            setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));\\n        },\\n        [],\\n    );\\n\\n    const clearCompleted = useCallback(() => {\\n        setTodos((prev) => prev.filter((t) => !t.completed));\\n    }, []);\\n\\n    const value = useMemo(\\n        (): TodoContextValue => ({\\n            todos,\\n            filter,\\n            searchQuery,\\n            stats,\\n            addTodo,\\n            toggleTodo,\\n            deleteTodo,\\n            updateTodo,\\n            setFilter,\\n            setSearchQuery,\\n            clearCompleted,\\n        }),\\n        [todos, filter, searchQuery, stats, addTodo, toggleTodo, deleteTodo, updateTodo, clearCompleted],\\n    );\\n\\n    return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;\\n}","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Props","properties":[{"name":"children","type":"React.ReactNode","description":"","meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"type","value":"parameters"}]}]}');
const ThemeContext = createContext(null);
ThemeContext.displayName = "ThemeContext";
function resolveSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function ThemeProvider({ children }) {
  const [colorScheme, setColorScheme] = useState(() => {
    if (typeof window === "undefined") return "system";
    return localStorage.getItem("todo-color-scheme") || "system";
  });
  const [accentColor, setAccentColor] = useState(() => {
    if (typeof window === "undefined") return "#3b82f6";
    return localStorage.getItem("todo-accent-color") || "#3b82f6";
  });
  const resolvedTheme = useMemo(
    () => colorScheme === "system" ? resolveSystemTheme() : colorScheme,
    [colorScheme]
  );
  useEffect(() => {
    localStorage.setItem("todo-color-scheme", colorScheme);
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  }, [colorScheme, resolvedTheme]);
  useEffect(() => {
    localStorage.setItem("todo-accent-color", accentColor);
    document.documentElement.style.setProperty("--accent", accentColor);
  }, [accentColor]);
  const handleSetColorScheme = useCallback((scheme) => {
    setColorScheme(scheme);
  }, []);
  const handleSetAccentColor = useCallback((color) => {
    setAccentColor(color);
  }, []);
  const value = useMemo(
    () => ({
      colorScheme,
      resolvedTheme,
      accentColor,
      setColorScheme: handleSetColorScheme,
      setAccentColor: handleSetAccentColor
    }),
    [colorScheme, resolvedTheme, accentColor, handleSetColorScheme, handleSetAccentColor]
  );
  return /* @__PURE__ */ jsxDEV(ThemeContext.Provider, { value, children }, void 0, false, {
    fileName: "<ROOT>/src/contexts/ThemeContext.tsx",
    lineNumber: 65,
    columnNumber: 12
  }, this);
}
ThemeProvider.__xydUniform = JSON.parse('{"title":"ThemeProvider","canonical":"xyd-fixture-3-todo-app/components/ThemeProvider","description":"","context":{"symbolId":"144","symbolName":"ThemeProvider","symbolKind":64,"packageName":"contexts/ThemeContext","fileName":"contexts/ThemeContext.tsx","fileFullPath":"src/contexts/ThemeContext.tsx","line":21,"col":9,"signatureText":{"code":"function ThemeProvider({ children }: {\\n    children: React.ReactNode;\\n});","lang":"ts"},"sourcecode":{"code":"function ThemeProvider({ children }: { children: React.ReactNode }) {\\n    const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {\\n        if (typeof window === \\"undefined\\") return \\"system\\";\\n        return (localStorage.getItem(\\"todo-color-scheme\\") as ColorScheme) || \\"system\\";\\n    });\\n    const [accentColor, setAccentColor] = useState(() => {\\n        if (typeof window === \\"undefined\\") return \\"#3b82f6\\";\\n        return localStorage.getItem(\\"todo-accent-color\\") || \\"#3b82f6\\";\\n    });\\n\\n    const resolvedTheme = useMemo(\\n        () => (colorScheme === \\"system\\" ? resolveSystemTheme() : colorScheme),\\n        [colorScheme],\\n    );\\n\\n    useEffect(() => {\\n        localStorage.setItem(\\"todo-color-scheme\\", colorScheme);\\n        document.documentElement.setAttribute(\\"data-theme\\", resolvedTheme);\\n    }, [colorScheme, resolvedTheme]);\\n\\n    useEffect(() => {\\n        localStorage.setItem(\\"todo-accent-color\\", accentColor);\\n        document.documentElement.style.setProperty(\\"--accent\\", accentColor);\\n    }, [accentColor]);\\n\\n    const handleSetColorScheme = useCallback((scheme: ColorScheme) => {\\n        setColorScheme(scheme);\\n    }, []);\\n\\n    const handleSetAccentColor = useCallback((color: string) => {\\n        setAccentColor(color);\\n    }, []);\\n\\n    const value = useMemo(\\n        (): ThemeContextValue => ({\\n            colorScheme,\\n            resolvedTheme,\\n            accentColor,\\n            setColorScheme: handleSetColorScheme,\\n            setAccentColor: handleSetAccentColor,\\n        }),\\n        [colorScheme, resolvedTheme, accentColor, handleSetColorScheme, handleSetAccentColor],\\n    );\\n\\n    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;\\n}","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Props","properties":[{"name":"children","type":"React.ReactNode","description":"","meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"type","value":"parameters"}]}]}');
function useTodos() {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error("useTodos must be used within TodoProvider");
  return ctx;
}
function useFilteredTodos() {
  const { todos, filter, searchQuery } = useTodos();
  return useMemo(() => {
    let result = todos;
    if (filter !== "all") {
      result = result.filter(
        (t) => filter === "completed" ? t.completed : !t.completed
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) => {
          var _a;
          return t.title.toLowerCase().includes(q) || ((_a = t.description) == null ? void 0 : _a.toLowerCase().includes(q)) || t.tags.some((tag) => tag.toLowerCase().includes(q));
        }
      );
    }
    return result;
  }, [todos, filter, searchQuery]);
}
useTodos.__xydUniform = JSON.parse('{"title":"useTodos","canonical":"xyd-fixture-3-todo-app/components/useTodos","description":"","context":{"symbolId":"157","symbolName":"useTodos","symbolKind":64,"packageName":"hooks/useTodos","fileName":"hooks/useTodos.ts","fileFullPath":"src/hooks/useTodos.ts","line":5,"col":9,"signatureText":{"code":"function useTodos();","lang":"ts"},"sourcecode":{"code":"function useTodos() {\\n    const ctx = useContext(TodoContext);\\n    if (!ctx) throw new Error(\\"useTodos must be used within TodoProvider\\");\\n    return ctx;\\n}","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Props","properties":[],"meta":[{"name":"type","value":"parameters"}]}]}');
useFilteredTodos.__xydUniform = JSON.parse('{"title":"useFilteredTodos","canonical":"xyd-fixture-3-todo-app/components/useFilteredTodos","description":"","context":{"symbolId":"159","symbolName":"useFilteredTodos","symbolKind":64,"packageName":"hooks/useTodos","fileName":"hooks/useTodos.ts","fileFullPath":"src/hooks/useTodos.ts","line":11,"col":9,"signatureText":{"code":"function useFilteredTodos(): Todo[];","lang":"ts"},"sourcecode":{"code":"function useFilteredTodos(): Todo[] {\\n    const { todos, filter, searchQuery } = useTodos();\\n\\n    return useMemo(() => {\\n        let result = todos;\\n\\n        if (filter !== \\"all\\") {\\n            result = result.filter((t) =>\\n                filter === \\"completed\\" ? t.completed : !t.completed,\\n            );\\n        }\\n\\n        if (searchQuery.trim()) {\\n            const q = searchQuery.toLowerCase();\\n            result = result.filter(\\n                (t) =>\\n                    t.title.toLowerCase().includes(q) ||\\n                    t.description?.toLowerCase().includes(q) ||\\n                    t.tags.some((tag) => tag.toLowerCase().includes(q)),\\n            );\\n        }\\n\\n        return result;\\n    }, [todos, filter, searchQuery]);\\n}","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Props","properties":[],"meta":[{"name":"type","value":"parameters"}]}]}');
const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "text-gray-500" },
  { value: "medium", label: "Medium", color: "text-blue-500" },
  { value: "high", label: "High", color: "text-yellow-500" },
  { value: "urgent", label: "Urgent", color: "text-red-500" }
];
function AddTodoForm({ onAdded, defaultPriority = "medium" }) {
  const { addTodo } = useTodos();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(defaultPriority);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTodo(
      title.trim(),
      priority,
      description.trim() || void 0,
      tags.split(",").map((t) => t.trim()).filter(Boolean)
    );
    setTitle("");
    setDescription("");
    setTags("");
    setPriority(defaultPriority);
    setShowDetails(false);
    onAdded == null ? void 0 : onAdded();
  };
  return /* @__PURE__ */ jsxDEV("form", { onSubmit: handleSubmit, className: "rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxDEV(
        "input",
        {
          type: "text",
          value: title,
          onChange: (e) => setTitle(e.target.value),
          placeholder: "What needs to be done?",
          className: "flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        },
        void 0,
        false,
        {
          fileName: "<ROOT>/src/components/AddTodoForm.tsx",
          lineNumber: 52,
          columnNumber: 17
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        "select",
        {
          value: priority,
          onChange: (e) => setPriority(e.target.value),
          className: "rounded-lg border border-gray-200 px-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white",
          children: PRIORITY_OPTIONS.map((opt) => /* @__PURE__ */ jsxDEV("option", { value: opt.value, children: opt.label }, opt.value, false, {
            fileName: "<ROOT>/src/components/AddTodoForm.tsx",
            lineNumber: 65,
            columnNumber: 25
          }, this))
        },
        void 0,
        false,
        {
          fileName: "<ROOT>/src/components/AddTodoForm.tsx",
          lineNumber: 59,
          columnNumber: 17
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          type: "submit",
          disabled: !title.trim(),
          className: "rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:opacity-90 transition-opacity",
          children: "Add"
        },
        void 0,
        false,
        {
          fileName: "<ROOT>/src/components/AddTodoForm.tsx",
          lineNumber: 70,
          columnNumber: 17
        },
        this
      )
    ] }, void 0, true, {
      fileName: "<ROOT>/src/components/AddTodoForm.tsx",
      lineNumber: 51,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(
      "button",
      {
        type: "button",
        onClick: () => setShowDetails(!showDetails),
        className: "mt-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
        children: showDetails ? "Hide details" : "Add description & tags"
      },
      void 0,
      false,
      {
        fileName: "<ROOT>/src/components/AddTodoForm.tsx",
        lineNumber: 79,
        columnNumber: 13
      },
      this
    ),
    showDetails && /* @__PURE__ */ jsxDEV("div", { className: "mt-3 space-y-2", children: [
      /* @__PURE__ */ jsxDEV(
        "textarea",
        {
          value: description,
          onChange: (e) => setDescription(e.target.value),
          placeholder: "Description (optional)",
          rows: 2,
          className: "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        },
        void 0,
        false,
        {
          fileName: "<ROOT>/src/components/AddTodoForm.tsx",
          lineNumber: 89,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        "input",
        {
          type: "text",
          value: tags,
          onChange: (e) => setTags(e.target.value),
          placeholder: "Tags (comma separated)",
          className: "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        },
        void 0,
        false,
        {
          fileName: "<ROOT>/src/components/AddTodoForm.tsx",
          lineNumber: 96,
          columnNumber: 21
        },
        this
      )
    ] }, void 0, true, {
      fileName: "<ROOT>/src/components/AddTodoForm.tsx",
      lineNumber: 88,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "<ROOT>/src/components/AddTodoForm.tsx",
    lineNumber: 50,
    columnNumber: 9
  }, this);
}
AddTodoForm.__xydUniform = JSON.parse('{"title":"AddTodoForm","canonical":"xyd-fixture-3-todo-app/components/AddTodoForm","description":"","context":{"symbolId":"91","symbolName":"AddTodoForm","symbolKind":64,"packageName":"components/AddTodoForm","fileName":"components/AddTodoForm.tsx","fileFullPath":"src/components/AddTodoForm.tsx","line":19,"col":9,"signatureText":{"code":"function AddTodoForm({ onAdded, defaultPriority = \\"medium\\" }: AddTodoFormProps);","lang":"ts"},"sourcecode":{"code":"function AddTodoForm({ onAdded, defaultPriority = \\"medium\\" }: AddTodoFormProps) {\\n    const { addTodo } = useTodos();\\n    const [title, setTitle] = useState(\\"\\");\\n    const [priority, setPriority] = useState<Priority>(defaultPriority);\\n    const [description, setDescription] = useState(\\"\\");\\n    const [tags, setTags] = useState(\\"\\");\\n    const [showDetails, setShowDetails] = useState(false);\\n\\n    const handleSubmit = (e: React.FormEvent) => {\\n        e.preventDefault();\\n        if (!title.trim()) return;\\n\\n        addTodo(\\n            title.trim(),\\n            priority,\\n            description.trim() || undefined,\\n            tags\\n                .split(\\",\\")\\n                .map((t) => t.trim())\\n                .filter(Boolean),\\n        );\\n\\n        setTitle(\\"\\");\\n        setDescription(\\"\\");\\n        setTags(\\"\\");\\n        setPriority(defaultPriority);\\n        setShowDetails(false);\\n        onAdded?.();\\n    };\\n\\n    return (\\n        <form onSubmit={handleSubmit} className=\\"rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800\\">\\n            <div className=\\"flex gap-2\\">\\n                <input\\n                    type=\\"text\\"\\n                    value={title}\\n                    onChange={(e) => setTitle(e.target.value)}\\n                    placeholder=\\"What needs to be done?\\"\\n                    className=\\"flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] dark:border-gray-600 dark:bg-gray-700 dark:text-white\\"\\n                />\\n                <select\\n                    value={priority}\\n                    onChange={(e) => setPriority(e.target.value as Priority)}\\n                    className=\\"rounded-lg border border-gray-200 px-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white\\"\\n                >\\n                    {PRIORITY_OPTIONS.map((opt) => (\\n                        <option key={opt.value} value={opt.value}>\\n                            {opt.label}\\n                        </option>\\n                    ))}\\n                </select>\\n                <button\\n                    type=\\"submit\\"\\n                    disabled={!title.trim()}\\n                    className=\\"rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:opacity-90 transition-opacity\\"\\n                >\\n                    Add\\n                </button>\\n            </div>\\n\\n            <button\\n                type=\\"button\\"\\n                onClick={() => setShowDetails(!showDetails)}\\n                className=\\"mt-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300\\"\\n            >\\n                {showDetails ? \\"Hide details\\" : \\"Add description & tags\\"}\\n            </button>\\n\\n            {showDetails && (\\n                <div className=\\"mt-3 space-y-2\\">\\n                    <textarea\\n                        value={description}\\n                        onChange={(e) => setDescription(e.target.value)}\\n                        placeholder=\\"Description (optional)\\"\\n                        rows={2}\\n                        className=\\"w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] dark:border-gray-600 dark:bg-gray-700 dark:text-white\\"\\n                    />\\n                    <input\\n                        type=\\"text\\"\\n                        value={tags}\\n                        onChange={(e) => setTags(e.target.value)}\\n                        placeholder=\\"Tags (comma separated)\\"\\n                        className=\\"w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] dark:border-gray-600 dark:bg-gray-700 dark:text-white\\"\\n                    />\\n                </div>\\n            )}\\n        </form>\\n    );\\n}","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Props","properties":[{"name":"onAdded","type":"","description":"Callback fired after a todo is successfully added\\n","properties":[],"meta":[]},{"name":"defaultPriority","type":"Priority","description":"Default priority for new todos\\n","symbolDef":{"id":"66"},"meta":[]}],"meta":[{"name":"type","value":"parameters"}]}]}');
const FILTER_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" }
];
function FilterBar({ className }) {
  const { filter, setFilter, searchQuery, setSearchQuery, stats, clearCompleted } = useTodos();
  return /* @__PURE__ */ jsxDEV("div", { className: `flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className || ""}`, children: [
    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700", children: FILTER_TABS.map((tab) => /* @__PURE__ */ jsxDEV(
      "button",
      {
        type: "button",
        onClick: () => setFilter(tab.value),
        className: `rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filter === tab.value ? "bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`,
        children: [
          tab.label,
          /* @__PURE__ */ jsxDEV("span", { className: "ml-1 text-gray-400", children: tab.value === "all" ? stats.total : tab.value === "active" ? stats.active : stats.completed }, void 0, false, {
            fileName: "<ROOT>/src/components/FilterBar.tsx",
            lineNumber: 33,
            columnNumber: 25
          }, this)
        ]
      },
      tab.value,
      true,
      {
        fileName: "<ROOT>/src/components/FilterBar.tsx",
        lineNumber: 22,
        columnNumber: 21
      },
      this
    )) }, void 0, false, {
      fileName: "<ROOT>/src/components/FilterBar.tsx",
      lineNumber: 20,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxDEV(
        "input",
        {
          type: "search",
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          placeholder: "Search...",
          className: "rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        },
        void 0,
        false,
        {
          fileName: "<ROOT>/src/components/FilterBar.tsx",
          lineNumber: 41,
          columnNumber: 17
        },
        this
      ),
      stats.completed > 0 && /* @__PURE__ */ jsxDEV(
        "button",
        {
          type: "button",
          onClick: clearCompleted,
          className: "text-xs text-gray-400 hover:text-red-500 transition-colors",
          children: "Clear completed"
        },
        void 0,
        false,
        {
          fileName: "<ROOT>/src/components/FilterBar.tsx",
          lineNumber: 49,
          columnNumber: 21
        },
        this
      )
    ] }, void 0, true, {
      fileName: "<ROOT>/src/components/FilterBar.tsx",
      lineNumber: 40,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<ROOT>/src/components/FilterBar.tsx",
    lineNumber: 19,
    columnNumber: 9
  }, this);
}
FilterBar.__xydUniform = JSON.parse('{"title":"FilterBar","canonical":"xyd-fixture-3-todo-app/components/FilterBar","description":"","context":{"symbolId":"117","symbolName":"FilterBar","symbolKind":64,"packageName":"components/FilterBar","fileName":"components/FilterBar.tsx","fileFullPath":"src/components/FilterBar.tsx","line":15,"col":9,"signatureText":{"code":"function FilterBar({ className }: FilterBarProps);","lang":"ts"},"sourcecode":{"code":"function FilterBar({ className }: FilterBarProps) {\\n    const { filter, setFilter, searchQuery, setSearchQuery, stats, clearCompleted } = useTodos();\\n\\n    return (\\n        <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className || \\"\\"}`}>\\n            <div className=\\"flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700\\">\\n                {FILTER_TABS.map((tab) => (\\n                    <button\\n                        key={tab.value}\\n                        type=\\"button\\"\\n                        onClick={() => setFilter(tab.value)}\\n                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${\\n                            filter === tab.value\\n                                ? \\"bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white\\"\\n                                : \\"text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200\\"\\n                        }`}\\n                    >\\n                        {tab.label}\\n                        <span className=\\"ml-1 text-gray-400\\">\\n                            {tab.value === \\"all\\" ? stats.total : tab.value === \\"active\\" ? stats.active : stats.completed}\\n                        </span>\\n                    </button>\\n                ))}\\n            </div>\\n\\n            <div className=\\"flex items-center gap-2\\">\\n                <input\\n                    type=\\"search\\"\\n                    value={searchQuery}\\n                    onChange={(e) => setSearchQuery(e.target.value)}\\n                    placeholder=\\"Search...\\"\\n                    className=\\"rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)] dark:border-gray-600 dark:bg-gray-700 dark:text-white\\"\\n                />\\n                {stats.completed > 0 && (\\n                    <button\\n                        type=\\"button\\"\\n                        onClick={clearCompleted}\\n                        className=\\"text-xs text-gray-400 hover:text-red-500 transition-colors\\"\\n                    >\\n                        Clear completed\\n                    </button>\\n                )}\\n            </div>\\n        </div>\\n    );\\n}","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Props","properties":[{"name":"className","type":"string","description":"Additional CSS classes appended to the root element\\n","meta":[]}],"meta":[{"name":"type","value":"parameters"}]}]}');
function StatCard({ label, value, color }) {
  return /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col items-center rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800", children: [
    /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-medium uppercase tracking-wider text-gray-400", children: label }, void 0, false, {
      fileName: "<ROOT>/src/components/StatsPanel.tsx",
      lineNumber: 16,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("span", { className: `text-2xl font-bold ${color || "text-gray-900 dark:text-white"}`, children: value }, void 0, false, {
      fileName: "<ROOT>/src/components/StatsPanel.tsx",
      lineNumber: 17,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<ROOT>/src/components/StatsPanel.tsx",
    lineNumber: 15,
    columnNumber: 9
  }, this);
}
function StatsPanel({ stats: propStats, compact }) {
  const { stats: contextStats } = useTodos();
  const stats = propStats || contextStats;
  const cards = [
    { label: "Total", value: stats.total },
    { label: "Active", value: stats.active, color: "text-blue-500" },
    { label: "Done", value: stats.completed, color: "text-green-500" },
    { label: "Overdue", value: stats.overdue, color: stats.overdue > 0 ? "text-red-500" : void 0 }
  ];
  return /* @__PURE__ */ jsxDEV("div", { className: compact ? "flex gap-2" : "grid grid-cols-2 gap-2 sm:grid-cols-4", children: cards.map((c) => /* @__PURE__ */ jsxDEV(StatCard, { label: c.label, value: c.value, color: c.color }, c.label, false, {
    fileName: "<ROOT>/src/components/StatsPanel.tsx",
    lineNumber: 43,
    columnNumber: 17
  }, this)) }, void 0, false, {
    fileName: "<ROOT>/src/components/StatsPanel.tsx",
    lineNumber: 41,
    columnNumber: 9
  }, this);
}
StatCard.__xydUniform = JSON.parse('{"title":"StatCard","canonical":"xyd-fixture-3-todo-app/components/StatCard","description":"","context":{"symbolId":"125","symbolName":"StatCard","symbolKind":64,"packageName":"components/StatsPanel","fileName":"components/StatsPanel.tsx","fileFullPath":"src/components/StatsPanel.tsx","line":13,"col":9,"signatureText":{"code":"function StatCard({ label, value, color }: StatCardProps);","lang":"ts"},"sourcecode":{"code":"function StatCard({ label, value, color }: StatCardProps) {\\n    return (\\n        <div className=\\"flex flex-col items-center rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800\\">\\n            <span className=\\"text-xs font-medium uppercase tracking-wider text-gray-400\\">{label}</span>\\n            <span className={`text-2xl font-bold ${color || \\"text-gray-900 dark:text-white\\"}`}>{value}</span>\\n        </div>\\n    );\\n}","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Props","properties":[{"name":"label","type":"string","description":"Stat label displayed above the value\\n","meta":[{"name":"required","value":"true"}]},{"name":"value","type":"number","description":"Numeric value to display\\n","meta":[{"name":"required","value":"true"}]},{"name":"color","type":"string","description":"Color accent for the value\\n","meta":[]}],"meta":[{"name":"type","value":"parameters"}]}]}');
StatsPanel.__xydUniform = JSON.parse('{"title":"StatsPanel","canonical":"xyd-fixture-3-todo-app/components/StatsPanel","description":"","context":{"symbolId":"122","symbolName":"StatsPanel","symbolKind":64,"packageName":"components/StatsPanel","fileName":"components/StatsPanel.tsx","fileFullPath":"src/components/StatsPanel.tsx","line":29,"col":9,"signatureText":{"code":"function StatsPanel({ stats: propStats, compact }: StatsPanelProps);","lang":"ts"},"sourcecode":{"code":"function StatsPanel({ stats: propStats, compact }: StatsPanelProps) {\\n    const { stats: contextStats } = useTodos();\\n    const stats = propStats || contextStats;\\n\\n    const cards = [\\n        { label: \\"Total\\", value: stats.total },\\n        { label: \\"Active\\", value: stats.active, color: \\"text-blue-500\\" },\\n        { label: \\"Done\\", value: stats.completed, color: \\"text-green-500\\" },\\n        { label: \\"Overdue\\", value: stats.overdue, color: stats.overdue > 0 ? \\"text-red-500\\" : undefined },\\n    ];\\n\\n    return (\\n        <div className={compact ? \\"flex gap-2\\" : \\"grid grid-cols-2 gap-2 sm:grid-cols-4\\"}>\\n            {cards.map((c) => (\\n                <StatCard key={c.label} label={c.label} value={c.value} color={c.color} />\\n            ))}\\n        </div>\\n    );\\n}","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Props","properties":[{"name":"stats","type":"number | number | number | number | Record<Priority, number>","description":"Override the stats instead of reading from context\\n","symbolDef":{"id":"78"},"meta":[]},{"name":"compact","type":"boolean","description":"Render in compact mode (horizontal)\\n","meta":[]}],"meta":[{"name":"type","value":"parameters"}]}]}');
const VARIANT_CLASSES = {
  default: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
  success: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200",
  danger: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
};
const PRIORITY_VARIANT = {
  low: "default",
  medium: "info",
  high: "warning",
  urgent: "danger"
};
function Badge({ label, variant, size = "sm", dismissible, onDismiss }) {
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return /* @__PURE__ */ jsxDEV("span", { className: `inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${VARIANT_CLASSES[variant]}`, children: [
    label,
    dismissible && /* @__PURE__ */ jsxDEV(
      "button",
      {
        type: "button",
        onClick: onDismiss,
        className: "ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-black/10",
        "aria-label": `Remove ${label}`,
        children: "x"
      },
      void 0,
      false,
      {
        fileName: "<ROOT>/src/components/Badge.tsx",
        lineNumber: 38,
        columnNumber: 17
      },
      this
    )
  ] }, void 0, true, {
    fileName: "<ROOT>/src/components/Badge.tsx",
    lineNumber: 35,
    columnNumber: 9
  }, this);
}
function PriorityBadge({ priority }) {
  return /* @__PURE__ */ jsxDEV(Badge, { label: priority, variant: PRIORITY_VARIANT[priority] }, void 0, false, {
    fileName: "<ROOT>/src/components/Badge.tsx",
    lineNumber: 52,
    columnNumber: 12
  }, this);
}
Badge.__xydUniform = JSON.parse('{"title":"Badge","canonical":"xyd-fixture-3-todo-app/components/Badge","description":"","context":{"symbolId":"101","symbolName":"Badge","symbolKind":64,"packageName":"components/Badge","fileName":"components/Badge.tsx","fileFullPath":"src/components/Badge.tsx","line":31,"col":9,"signatureText":{"code":"function Badge({ label, variant, size = \\"sm\\", dismissible, onDismiss }: BadgeProps);","lang":"ts"},"sourcecode":{"code":"function Badge({ label, variant, size = \\"sm\\", dismissible, onDismiss }: BadgeProps) {\\n    const sizeClass = size === \\"sm\\" ? \\"px-2 py-0.5 text-xs\\" : \\"px-3 py-1 text-sm\\";\\n\\n    return (\\n        <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${VARIANT_CLASSES[variant]}`}>\\n            {label}\\n            {dismissible && (\\n                <button\\n                    type=\\"button\\"\\n                    onClick={onDismiss}\\n                    className=\\"ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-black/10\\"\\n                    aria-label={`Remove ${label}`}\\n                >\\n                    x\\n                </button>\\n            )}\\n        </span>\\n    );\\n}","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Props","properties":[{"name":"label","type":"string","description":"The text label displayed inside the badge\\n","meta":[{"name":"required","value":"true"}]},{"name":"variant","type":"\\"default\\" | \\"success\\" | \\"warning\\" | \\"danger\\" | \\"info\\"","description":"Visual variant controlling color and style\\n","symbolDef":{"id":[]},"meta":[{"name":"required","value":"true"}]},{"name":"size","type":"\\"sm\\" | \\"md\\"","description":"Render as a smaller pill\\n","symbolDef":{"id":[]},"meta":[]},{"name":"dismissible","type":"boolean","description":"Whether the badge can be dismissed\\n","meta":[]},{"name":"onDismiss","type":"","description":"Called when the dismiss button is clicked\\n","properties":[],"meta":[]}],"meta":[{"name":"type","value":"parameters"}]}]}');
PriorityBadge.__xydUniform = JSON.parse('{"title":"PriorityBadge","canonical":"xyd-fixture-3-todo-app/components/PriorityBadge","description":"","context":{"symbolId":"104","symbolName":"PriorityBadge","symbolKind":64,"packageName":"components/Badge","fileName":"components/Badge.tsx","fileFullPath":"src/components/Badge.tsx","line":51,"col":9,"signatureText":{"code":"function PriorityBadge({ priority }: {\\n    priority: Priority;\\n});","lang":"ts"},"sourcecode":{"code":"function PriorityBadge({ priority }: { priority: Priority }) {\\n    return <Badge label={priority} variant={PRIORITY_VARIANT[priority]} />;\\n}","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Props","properties":[],"meta":[{"name":"type","value":"parameters"}]}]}');
function TodoItem({ todo, autoEdit = false }) {
  const { toggleTodo, deleteTodo, updateTodo } = useTodos();
  const [editing, setEditing] = useState(autoEdit);
  const [editTitle, setEditTitle] = useState(todo.title);
  const isOverdue = !todo.completed && todo.dueDate && todo.dueDate < /* @__PURE__ */ new Date();
  const handleSave = () => {
    if (editTitle.trim()) {
      updateTodo(todo.id, { title: editTitle.trim() });
    }
    setEditing(false);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditTitle(todo.title);
      setEditing(false);
    }
  };
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      className: `
                group flex items-start gap-3 rounded-lg border p-4 transition-all
                ${todo.completed ? "border-gray-200 bg-gray-50 opacity-75 dark:border-gray-700 dark:bg-gray-800/50" : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"}
                ${isOverdue ? "border-red-300 dark:border-red-700" : ""}
                hover:shadow-md
            `,
      children: [
        /* @__PURE__ */ jsxDEV(
          "input",
          {
            type: "checkbox",
            checked: todo.completed,
            onChange: () => toggleTodo(todo.id),
            className: "mt-1 h-4 w-4 rounded border-gray-300 accent-[var(--accent)]"
          },
          void 0,
          false,
          {
            fileName: "<ROOT>/src/components/TodoItem.tsx",
            lineNumber: 44,
            columnNumber: 13
          },
          this
        ),
        /* @__PURE__ */ jsxDEV("div", { className: "flex-1 min-w-0", children: [
          editing ? /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "text",
              value: editTitle,
              onChange: (e) => setEditTitle(e.target.value),
              onBlur: handleSave,
              onKeyDown: handleKeyDown,
              className: "w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700",
              autoFocus: true
            },
            void 0,
            false,
            {
              fileName: "<ROOT>/src/components/TodoItem.tsx",
              lineNumber: 53,
              columnNumber: 21
            },
            this
          ) : /* @__PURE__ */ jsxDEV(
            "p",
            {
              className: `text-sm font-medium ${todo.completed ? "line-through text-gray-400" : "text-gray-900 dark:text-gray-100"}`,
              onDoubleClick: () => setEditing(true),
              children: todo.title
            },
            void 0,
            false,
            {
              fileName: "<ROOT>/src/components/TodoItem.tsx",
              lineNumber: 63,
              columnNumber: 21
            },
            this
          ),
          todo.description && /* @__PURE__ */ jsxDEV("p", { className: "mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2", children: todo.description }, void 0, false, {
            fileName: "<ROOT>/src/components/TodoItem.tsx",
            lineNumber: 72,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "mt-2 flex flex-wrap items-center gap-1.5", children: [
            /* @__PURE__ */ jsxDEV(PriorityBadge, { priority: todo.priority }, void 0, false, {
              fileName: "<ROOT>/src/components/TodoItem.tsx",
              lineNumber: 78,
              columnNumber: 21
            }, this),
            todo.tags.map((tag) => /* @__PURE__ */ jsxDEV(Badge, { label: tag, variant: "default" }, tag, false, {
              fileName: "<ROOT>/src/components/TodoItem.tsx",
              lineNumber: 80,
              columnNumber: 25
            }, this)),
            isOverdue && /* @__PURE__ */ jsxDEV(Badge, { label: "overdue", variant: "danger" }, void 0, false, {
              fileName: "<ROOT>/src/components/TodoItem.tsx",
              lineNumber: 82,
              columnNumber: 35
            }, this),
            todo.dueDate && !isOverdue && /* @__PURE__ */ jsxDEV("span", { className: "text-xs text-gray-400", children: [
              "Due ",
              todo.dueDate.toLocaleDateString()
            ] }, void 0, true, {
              fileName: "<ROOT>/src/components/TodoItem.tsx",
              lineNumber: 84,
              columnNumber: 25
            }, this)
          ] }, void 0, true, {
            fileName: "<ROOT>/src/components/TodoItem.tsx",
            lineNumber: 77,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "<ROOT>/src/components/TodoItem.tsx",
          lineNumber: 51,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              onClick: () => setEditing(true),
              className: "rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700",
              "aria-label": "Edit",
              children: "E"
            },
            void 0,
            false,
            {
              fileName: "<ROOT>/src/components/TodoItem.tsx",
              lineNumber: 92,
              columnNumber: 17
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              onClick: () => deleteTodo(todo.id),
              className: "rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30",
              "aria-label": "Delete",
              children: "D"
            },
            void 0,
            false,
            {
              fileName: "<ROOT>/src/components/TodoItem.tsx",
              lineNumber: 100,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "<ROOT>/src/components/TodoItem.tsx",
          lineNumber: 91,
          columnNumber: 13
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "<ROOT>/src/components/TodoItem.tsx",
      lineNumber: 36,
      columnNumber: 9
    },
    this
  );
}
TodoItem.__xydUniform = JSON.parse('{"title":"TodoItem","canonical":"xyd-fixture-3-todo-app/components/TodoItem","description":"","context":{"symbolId":"137","symbolName":"TodoItem","symbolKind":64,"packageName":"components/TodoItem","fileName":"components/TodoItem.tsx","fileFullPath":"src/components/TodoItem.tsx","line":13,"col":9,"signatureText":{"code":"function TodoItem({ todo, autoEdit = false }: TodoItemProps);","lang":"ts"},"sourcecode":{"code":"function TodoItem({ todo, autoEdit = false }: TodoItemProps) {\\n    const { toggleTodo, deleteTodo, updateTodo } = useTodos();\\n    const [editing, setEditing] = useState(autoEdit);\\n    const [editTitle, setEditTitle] = useState(todo.title);\\n\\n    const isOverdue = !todo.completed && todo.dueDate && todo.dueDate < new Date();\\n\\n    const handleSave = () => {\\n        if (editTitle.trim()) {\\n            updateTodo(todo.id, { title: editTitle.trim() });\\n        }\\n        setEditing(false);\\n    };\\n\\n    const handleKeyDown = (e: React.KeyboardEvent) => {\\n        if (e.key === \\"Enter\\") handleSave();\\n        if (e.key === \\"Escape\\") {\\n            setEditTitle(todo.title);\\n            setEditing(false);\\n        }\\n    };\\n\\n    return (\\n        <div\\n            className={`\\n                group flex items-start gap-3 rounded-lg border p-4 transition-all\\n                ${todo.completed ? \\"border-gray-200 bg-gray-50 opacity-75 dark:border-gray-700 dark:bg-gray-800/50\\" : \\"border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800\\"}\\n                ${isOverdue ? \\"border-red-300 dark:border-red-700\\" : \\"\\"}\\n                hover:shadow-md\\n            `}\\n        >\\n            <input\\n                type=\\"checkbox\\"\\n                checked={todo.completed}\\n                onChange={() => toggleTodo(todo.id)}\\n                className=\\"mt-1 h-4 w-4 rounded border-gray-300 accent-[var(--accent)]\\"\\n            />\\n\\n            <div className=\\"flex-1 min-w-0\\">\\n                {editing ? (\\n                    <input\\n                        type=\\"text\\"\\n                        value={editTitle}\\n                        onChange={(e) => setEditTitle(e.target.value)}\\n                        onBlur={handleSave}\\n                        onKeyDown={handleKeyDown}\\n                        className=\\"w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700\\"\\n                        autoFocus\\n                    />\\n                ) : (\\n                    <p\\n                        className={`text-sm font-medium ${todo.completed ? \\"line-through text-gray-400\\" : \\"text-gray-900 dark:text-gray-100\\"}`}\\n                        onDoubleClick={() => setEditing(true)}\\n                    >\\n                        {todo.title}\\n                    </p>\\n                )}\\n\\n                {todo.description && (\\n                    <p className=\\"mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2\\">\\n                        {todo.description}\\n                    </p>\\n                )}\\n\\n                <div className=\\"mt-2 flex flex-wrap items-center gap-1.5\\">\\n                    <PriorityBadge priority={todo.priority} />\\n                    {todo.tags.map((tag) => (\\n                        <Badge key={tag} label={tag} variant=\\"default\\" />\\n                    ))}\\n                    {isOverdue && <Badge label=\\"overdue\\" variant=\\"danger\\" />}\\n                    {todo.dueDate && !isOverdue && (\\n                        <span className=\\"text-xs text-gray-400\\">\\n                            Due {todo.dueDate.toLocaleDateString()}\\n                        </span>\\n                    )}\\n                </div>\\n            </div>\\n\\n            <div className=\\"flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity\\">\\n                <button\\n                    type=\\"button\\"\\n                    onClick={() => setEditing(true)}\\n                    className=\\"rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700\\"\\n                    aria-label=\\"Edit\\"\\n                >\\n                    E\\n                </button>\\n                <button\\n                    type=\\"button\\"\\n                    onClick={() => deleteTodo(todo.id)}\\n                    className=\\"rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30\\"\\n                    aria-label=\\"Delete\\"\\n                >\\n                    D\\n                </button>\\n            </div>\\n        </div>\\n    );\\n}","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Props","properties":[{"name":"todo","type":"string | string | string | boolean | Priority | string[] | Date | Date | Date","description":"The todo data to render\\n","symbolDef":{"id":"68"},"meta":[{"name":"required","value":"true"}]},{"name":"autoEdit","type":"boolean","description":"Enable inline editing mode on mount\\n","meta":[]}],"meta":[{"name":"type","value":"parameters"}]}]}');
function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
useTheme.__xydUniform = JSON.parse('{"title":"useTheme","canonical":"xyd-fixture-3-todo-app/components/useTheme","description":"","context":{"symbolId":"155","symbolName":"useTheme","symbolKind":64,"packageName":"hooks/useTheme","fileName":"hooks/useTheme.ts","fileFullPath":"src/hooks/useTheme.ts","line":4,"col":9,"signatureText":{"code":"function useTheme();","lang":"ts"},"sourcecode":{"code":"function useTheme() {\\n    const ctx = useContext(ThemeContext);\\n    if (!ctx) throw new Error(\\"useTheme must be used within ThemeProvider\\");\\n    return ctx;\\n}","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Props","properties":[],"meta":[{"name":"type","value":"parameters"}]}]}');
function ThemeToggle() {
  const { colorScheme, setColorScheme, accentColor, setAccentColor } = useTheme();
  return /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-700", children: ["light", "dark", "system"].map((scheme) => /* @__PURE__ */ jsxDEV(
      "button",
      {
        type: "button",
        onClick: () => setColorScheme(scheme),
        className: `rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${colorScheme === scheme ? "bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`,
        children: scheme
      },
      scheme,
      false,
      {
        fileName: "<ROOT>/src/components/ThemeToggle.tsx",
        lineNumber: 10,
        columnNumber: 21
      },
      this
    )) }, void 0, false, {
      fileName: "<ROOT>/src/components/ThemeToggle.tsx",
      lineNumber: 8,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(
      "input",
      {
        type: "color",
        value: accentColor,
        onChange: (e) => setAccentColor(e.target.value),
        className: "h-7 w-7 cursor-pointer rounded border-0 bg-transparent",
        title: "Accent color"
      },
      void 0,
      false,
      {
        fileName: "<ROOT>/src/components/ThemeToggle.tsx",
        lineNumber: 24,
        columnNumber: 13
      },
      this
    )
  ] }, void 0, true, {
    fileName: "<ROOT>/src/components/ThemeToggle.tsx",
    lineNumber: 7,
    columnNumber: 9
  }, this);
}
ThemeToggle.__xydUniform = JSON.parse('{"title":"ThemeToggle","canonical":"xyd-fixture-3-todo-app/components/ThemeToggle","description":"","context":{"symbolId":"135","symbolName":"ThemeToggle","symbolKind":64,"packageName":"components/ThemeToggle","fileName":"components/ThemeToggle.tsx","fileFullPath":"src/components/ThemeToggle.tsx","line":3,"col":9,"signatureText":{"code":"function ThemeToggle();","lang":"ts"},"sourcecode":{"code":"function ThemeToggle() {\\n    const { colorScheme, setColorScheme, accentColor, setAccentColor } = useTheme();\\n\\n    return (\\n        <div className=\\"flex items-center gap-3\\">\\n            <div className=\\"flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-700\\">\\n                {([\\"light\\", \\"dark\\", \\"system\\"] as const).map((scheme) => (\\n                    <button\\n                        key={scheme}\\n                        type=\\"button\\"\\n                        onClick={() => setColorScheme(scheme)}\\n                        className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${\\n                            colorScheme === scheme\\n                                ? \\"bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white\\"\\n                                : \\"text-gray-500 hover:text-gray-700 dark:text-gray-400\\"\\n                        }`}\\n                    >\\n                        {scheme}\\n                    </button>\\n                ))}\\n            </div>\\n            <input\\n                type=\\"color\\"\\n                value={accentColor}\\n                onChange={(e) => setAccentColor(e.target.value)}\\n                className=\\"h-7 w-7 cursor-pointer rounded border-0 bg-transparent\\"\\n                title=\\"Accent color\\"\\n            />\\n        </div>\\n    );\\n}","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Props","properties":[],"meta":[{"name":"type","value":"parameters"}]}]}');
function TodoList() {
  const todos = useFilteredTodos();
  if (todos.length === 0) {
    return /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col items-center justify-center py-12 text-gray-400", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "text-4xl", children: ":)" }, void 0, false, {
        fileName: "<ROOT>/src/components/App.tsx",
        lineNumber: 16,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "mt-2 text-sm", children: "No todos match your filters" }, void 0, false, {
        fileName: "<ROOT>/src/components/App.tsx",
        lineNumber: 17,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<ROOT>/src/components/App.tsx",
      lineNumber: 15,
      columnNumber: 13
    }, this);
  }
  return /* @__PURE__ */ jsxDEV("div", { className: "space-y-2", children: todos.map((todo) => /* @__PURE__ */ jsxDEV(TodoItem, { todo }, todo.id, false, {
    fileName: "<ROOT>/src/components/App.tsx",
    lineNumber: 25,
    columnNumber: 17
  }, this)) }, void 0, false, {
    fileName: "<ROOT>/src/components/App.tsx",
    lineNumber: 23,
    columnNumber: 9
  }, this);
}
function App() {
  return /* @__PURE__ */ jsxDEV(ThemeProvider, { children: /* @__PURE__ */ jsxDEV(TodoProvider, { children: /* @__PURE__ */ jsxDEV("div", { className: "mx-auto max-w-2xl px-4 py-8", children: [
    /* @__PURE__ */ jsxDEV("header", { className: "mb-6 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxDEV("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Todo App" }, void 0, false, {
        fileName: "<ROOT>/src/components/App.tsx",
        lineNumber: 37,
        columnNumber: 25
      }, this),
      /* @__PURE__ */ jsxDEV(ThemeToggle, {}, void 0, false, {
        fileName: "<ROOT>/src/components/App.tsx",
        lineNumber: 40,
        columnNumber: 25
      }, this)
    ] }, void 0, true, {
      fileName: "<ROOT>/src/components/App.tsx",
      lineNumber: 36,
      columnNumber: 21
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxDEV(StatsPanel, {}, void 0, false, {
        fileName: "<ROOT>/src/components/App.tsx",
        lineNumber: 44,
        columnNumber: 25
      }, this),
      /* @__PURE__ */ jsxDEV(AddTodoForm, {}, void 0, false, {
        fileName: "<ROOT>/src/components/App.tsx",
        lineNumber: 45,
        columnNumber: 25
      }, this),
      /* @__PURE__ */ jsxDEV(FilterBar, {}, void 0, false, {
        fileName: "<ROOT>/src/components/App.tsx",
        lineNumber: 46,
        columnNumber: 25
      }, this),
      /* @__PURE__ */ jsxDEV(TodoList, {}, void 0, false, {
        fileName: "<ROOT>/src/components/App.tsx",
        lineNumber: 47,
        columnNumber: 25
      }, this)
    ] }, void 0, true, {
      fileName: "<ROOT>/src/components/App.tsx",
      lineNumber: 43,
      columnNumber: 21
    }, this)
  ] }, void 0, true, {
    fileName: "<ROOT>/src/components/App.tsx",
    lineNumber: 35,
    columnNumber: 17
  }, this) }, void 0, false, {
    fileName: "<ROOT>/src/components/App.tsx",
    lineNumber: 34,
    columnNumber: 13
  }, this) }, void 0, false, {
    fileName: "<ROOT>/src/components/App.tsx",
    lineNumber: 33,
    columnNumber: 9
  }, this);
}
App.__xydUniform = JSON.parse('{"title":"App","canonical":"xyd-fixture-3-todo-app/components/App","description":"","context":{"symbolId":"99","symbolName":"App","symbolKind":64,"packageName":"components/App","fileName":"components/App.tsx","fileFullPath":"src/components/App.tsx","line":31,"col":9,"signatureText":{"code":"function App();","lang":"ts"},"sourcecode":{"code":"function App() {\\n    return (\\n        <ThemeProvider>\\n            <TodoProvider>\\n                <div className=\\"mx-auto max-w-2xl px-4 py-8\\">\\n                    <header className=\\"mb-6 flex items-center justify-between\\">\\n                        <h1 className=\\"text-2xl font-bold text-gray-900 dark:text-white\\">\\n                            Todo App\\n                        </h1>\\n                        <ThemeToggle />\\n                    </header>\\n\\n                    <div className=\\"space-y-4\\">\\n                        <StatsPanel />\\n                        <AddTodoForm />\\n                        <FilterBar />\\n                        <TodoList />\\n                    </div>\\n                </div>\\n            </TodoProvider>\\n        </ThemeProvider>\\n    );\\n}","lang":"ts"},"meta":[],"group":[]},"examples":{"groups":[]},"definitions":[{"title":"Props","properties":[],"meta":[{"name":"type","value":"parameters"}]}]}');
export {
  AddTodoForm,
  App,
  Badge,
  FilterBar,
  PriorityBadge,
  StatCard,
  StatsPanel,
  ThemeContext,
  ThemeProvider,
  ThemeToggle,
  TodoContext,
  TodoItem,
  TodoProvider,
  useFilteredTodos,
  useTheme,
  useTodos
};
