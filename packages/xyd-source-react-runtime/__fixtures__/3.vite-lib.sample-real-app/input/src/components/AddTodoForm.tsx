import { useState } from "react";
import type { Priority } from "../types/todo";

interface AddTodoFormProps {
    /** Callback fired after a todo is successfully added */
    onAdd: (title: string, priority: Priority, description?: string, tags?: string[]) => void;

    /** Default priority for new todos */
    defaultPriority?: Priority;

    /** Placeholder text for the title input */
    placeholder?: string;
}

export function AddTodoForm({ onAdd, defaultPriority = "medium", placeholder = "What needs to be done?" }: AddTodoFormProps) {
    const [title, setTitle] = useState("");
    const [priority, setPriority] = useState<Priority>(defaultPriority);
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onAdd(
            title.trim(),
            priority,
            description.trim() || undefined,
            tags.split(",").map((t) => t.trim()).filter(Boolean),
        );
        setTitle("");
        setDescription("");
        setTags("");
        setPriority(defaultPriority);
    };

    return (
        <form onSubmit={handleSubmit} className="add-todo-form">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={placeholder} />
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
            </select>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma separated)" />
            <button type="submit" disabled={!title.trim()}>Add</button>
        </form>
    );
}

