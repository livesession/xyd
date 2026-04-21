import { useState } from "react";
import type { Todo } from "../types/todo";
import { Badge, PriorityBadge } from "./Badge";
import { useTodos } from "../hooks/useTodos";

interface TodoItemProps {
    /** The todo data to render */
    todo: Todo;
    /** Enable inline editing mode on mount */
    autoEdit?: boolean;
}

function TodoItem({ todo, autoEdit = false }: TodoItemProps) {
    const { toggleTodo, deleteTodo, updateTodo } = useTodos();
    const [editing, setEditing] = useState(autoEdit);
    const [editTitle, setEditTitle] = useState(todo.title);

    const isOverdue = !todo.completed && todo.dueDate && todo.dueDate < new Date();

    const handleSave = () => {
        if (editTitle.trim()) {
            updateTodo(todo.id, { title: editTitle.trim() });
        }
        setEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") {
            setEditTitle(todo.title);
            setEditing(false);
        }
    };

    return (
        <div
            className={`
                group flex items-start gap-3 rounded-lg border p-4 transition-all
                ${todo.completed ? "border-gray-200 bg-gray-50 opacity-75 dark:border-gray-700 dark:bg-gray-800/50" : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"}
                ${isOverdue ? "border-red-300 dark:border-red-700" : ""}
                hover:shadow-md
            `}
        >
            <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="mt-1 h-4 w-4 rounded border-gray-300 accent-[var(--accent)]"
            />

            <div className="flex-1 min-w-0">
                {editing ? (
                    <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
                        autoFocus
                    />
                ) : (
                    <p
                        className={`text-sm font-medium ${todo.completed ? "line-through text-gray-400" : "text-gray-900 dark:text-gray-100"}`}
                        onDoubleClick={() => setEditing(true)}
                    >
                        {todo.title}
                    </p>
                )}

                {todo.description && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {todo.description}
                    </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <PriorityBadge priority={todo.priority} />
                    {todo.tags.map((tag) => (
                        <Badge key={tag} label={tag} variant="default" />
                    ))}
                    {isOverdue && <Badge label="overdue" variant="danger" />}
                    {todo.dueDate && !isOverdue && (
                        <span className="text-xs text-gray-400">
                            Due {todo.dueDate.toLocaleDateString()}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                    aria-label="Edit"
                >
                    E
                </button>
                <button
                    type="button"
                    onClick={() => deleteTodo(todo.id)}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
                    aria-label="Delete"
                >
                    D
                </button>
            </div>
        </div>
    );
}

export { TodoItem };
export type { TodoItemProps };
