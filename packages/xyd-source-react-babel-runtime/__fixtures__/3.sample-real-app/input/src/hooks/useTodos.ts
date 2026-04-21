import { useContext, useMemo } from "react";
import { TodoContext } from "../contexts/TodoContext";
import type { Todo, FilterStatus } from "../types/todo";

function useTodos() {
    const ctx = useContext(TodoContext);
    if (!ctx) throw new Error("useTodos must be used within TodoProvider");
    return ctx;
}

function useFilteredTodos(): Todo[] {
    const { todos, filter, searchQuery } = useTodos();

    return useMemo(() => {
        let result = todos;

        if (filter !== "all") {
            result = result.filter((t) =>
                filter === "completed" ? t.completed : !t.completed,
            );
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (t) =>
                    t.title.toLowerCase().includes(q) ||
                    t.description?.toLowerCase().includes(q) ||
                    t.tags.some((tag) => tag.toLowerCase().includes(q)),
            );
        }

        return result;
    }, [todos, filter, searchQuery]);
}

export { useTodos, useFilteredTodos };
