import { createContext, useCallback, useMemo, useState } from "react";
import type { Todo, Priority, FilterStatus, TodoStats } from "../types/todo";

interface TodoContextValue {
    todos: Todo[];
    filter: FilterStatus;
    searchQuery: string;
    stats: TodoStats;
    addTodo: (title: string, priority: Priority, description?: string, tags?: string[], dueDate?: Date) => void;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
    updateTodo: (id: string, updates: Partial<Pick<Todo, "title" | "description" | "priority" | "tags" | "dueDate">>) => void;
    setFilter: (filter: FilterStatus) => void;
    setSearchQuery: (query: string) => void;
    clearCompleted: () => void;
}

const TodoContext = createContext<TodoContextValue | null>(null);
TodoContext.displayName = "TodoContext";

function generateId(): string {
    return Math.random().toString(36).substring(2, 11);
}

function TodoProvider({ children }: { children: React.ReactNode }) {
    const [todos, setTodos] = useState<Todo[]>([
        {
            id: generateId(),
            title: "Set up project with Vite and Tailwind",
            description: "Initialize the project scaffold with proper tooling",
            completed: true,
            priority: "high",
            tags: ["setup", "tooling"],
            createdAt: new Date("2025-01-10"),
            completedAt: new Date("2025-01-11"),
        },
        {
            id: generateId(),
            title: "Build TodoItem component",
            completed: false,
            priority: "medium",
            tags: ["ui", "components"],
            createdAt: new Date("2025-01-12"),
            dueDate: new Date("2025-02-01"),
        },
        {
            id: generateId(),
            title: "Add drag-and-drop reordering",
            description: "Use a library like dnd-kit for accessible drag and drop",
            completed: false,
            priority: "low",
            tags: ["ui", "enhancement"],
            createdAt: new Date("2025-01-13"),
        },
        {
            id: generateId(),
            title: "Fix overdue task styling",
            completed: false,
            priority: "urgent",
            tags: ["bug", "ui"],
            createdAt: new Date("2025-01-08"),
            dueDate: new Date("2025-01-14"),
        },
    ]);

    const [filter, setFilter] = useState<FilterStatus>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const stats = useMemo((): TodoStats => {
        const now = new Date();
        const byPriority: Record<Priority, number> = { low: 0, medium: 0, high: 0, urgent: 0 };
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
        (title: string, priority: Priority, description?: string, tags?: string[], dueDate?: Date) => {
            setTodos((prev) => [
                ...prev,
                {
                    id: generateId(),
                    title,
                    description,
                    completed: false,
                    priority,
                    tags: tags || [],
                    createdAt: new Date(),
                    dueDate,
                },
            ]);
        },
        [],
    );

    const toggleTodo = useCallback((id: string) => {
        setTodos((prev) =>
            prev.map((t) =>
                t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date() : undefined } : t,
            ),
        );
    }, []);

    const deleteTodo = useCallback((id: string) => {
        setTodos((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const updateTodo = useCallback(
        (id: string, updates: Partial<Pick<Todo, "title" | "description" | "priority" | "tags" | "dueDate">>) => {
            setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
        },
        [],
    );

    const clearCompleted = useCallback(() => {
        setTodos((prev) => prev.filter((t) => !t.completed));
    }, []);

    const value = useMemo(
        (): TodoContextValue => ({
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
            clearCompleted,
        }),
        [todos, filter, searchQuery, stats, addTodo, toggleTodo, deleteTodo, updateTodo, clearCompleted],
    );

    return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
}

export { TodoContext, TodoProvider };
