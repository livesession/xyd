import { useState } from "react";
import type { Todo, Priority } from "../types/todo";

interface TodoItemProps {
    /** The todo data to render */
    todo: Todo;

    /** Called when the checkbox is toggled */
    onToggle: (id: string) => void;

    /** Called when the delete button is clicked */
    onDelete: (id: string) => void;

    /** Called when the todo is updated */
    onUpdate: (id: string, updates: Partial<Pick<Todo, "title" | "description" | "priority" | "tags">>) => void;

    /** Enable inline editing mode on mount */
    autoEdit?: boolean;
}

export function TodoItem({ todo, onToggle, onDelete, onUpdate, autoEdit = false }: TodoItemProps) {
    const [editing, setEditing] = useState(autoEdit);
    const [editTitle, setEditTitle] = useState(todo.title);
    const isOverdue = !todo.completed && todo.dueDate && new Date(todo.dueDate) < new Date();

    const handleSave = () => {
        if (editTitle.trim()) {
            onUpdate(todo.id, { title: editTitle.trim() });
        }
        setEditing(false);
    };

    return (
        <div className={`todo-item ${todo.completed ? "completed" : ""} ${isOverdue ? "overdue" : ""}`}>
            <input type="checkbox" checked={todo.completed} onChange={() => onToggle(todo.id)} />
            {editing ? (
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onBlur={handleSave} autoFocus />
            ) : (
                <span onDoubleClick={() => setEditing(true)}>{todo.title}</span>
            )}
            {todo.description && <p className="description">{todo.description}</p>}
            <div className="tags">
                <span className={`priority priority-${todo.priority}`}>{todo.priority}</span>
                {todo.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
                {isOverdue && <span className="overdue-badge">overdue</span>}
            </div>
            <div className="actions">
                <button type="button" onClick={() => setEditing(true)}>Edit</button>
                <button type="button" onClick={() => onDelete(todo.id)}>Delete</button>
            </div>
        </div>
    );
}

