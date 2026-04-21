import { useState } from "react";
import type { Priority } from "../types/todo";
import { useTodos } from "../hooks/useTodos";

interface AddTodoFormProps {
    /** Callback fired after a todo is successfully added */
    onAdded?: () => void;
    /** Default priority for new todos */
    defaultPriority?: Priority;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
    { value: "low", label: "Low", color: "text-gray-500" },
    { value: "medium", label: "Medium", color: "text-blue-500" },
    { value: "high", label: "High", color: "text-yellow-500" },
    { value: "urgent", label: "Urgent", color: "text-red-500" },
];

function AddTodoForm({ onAdded, defaultPriority = "medium" }: AddTodoFormProps) {
    const { addTodo } = useTodos();
    const [title, setTitle] = useState("");
    const [priority, setPriority] = useState<Priority>(defaultPriority);
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState("");
    const [showDetails, setShowDetails] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        addTodo(
            title.trim(),
            priority,
            description.trim() || undefined,
            tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
        );

        setTitle("");
        setDescription("");
        setTags("");
        setPriority(defaultPriority);
        setShowDetails(false);
        onAdded?.();
    };

    return (
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="rounded-lg border border-gray-200 px-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                    {PRIORITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <button
                    type="submit"
                    disabled={!title.trim()}
                    className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                    Add
                </button>
            </div>

            <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
                {showDetails ? "Hide details" : "Add description & tags"}
            </button>

            {showDetails && (
                <div className="mt-3 space-y-2">
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description (optional)"
                        rows={2}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="Tags (comma separated)"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                </div>
            )}
        </form>
    );
}

export { AddTodoForm };
export type { AddTodoFormProps };
