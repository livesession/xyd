// === index.js ===
import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
function TodoItem({ todo, onToggle, onDelete, onUpdate, autoEdit = false }) {
  const [editing, setEditing] = useState(autoEdit);
  const [editTitle, setEditTitle] = useState(todo.title);
  const isOverdue = !todo.completed && todo.dueDate && new Date(todo.dueDate) < /* @__PURE__ */ new Date();
  const handleSave = () => {
    if (editTitle.trim()) {
      onUpdate(todo.id, { title: editTitle.trim() });
    }
    setEditing(false);
  };
  return jsxs("div", { className: `todo-item ${todo.completed ? "completed" : ""} ${isOverdue ? "overdue" : ""}`, children: [jsx("input", { type: "checkbox", checked: todo.completed, onChange: () => onToggle(todo.id) }), editing ? jsx("input", { value: editTitle, onChange: (e) => setEditTitle(e.target.value), onBlur: handleSave, autoFocus: true }) : jsx("span", { onDoubleClick: () => setEditing(true), children: todo.title }), todo.description && jsx("p", { className: "description", children: todo.description }), jsxs("div", { className: "tags", children: [jsx("span", { className: `priority priority-${todo.priority}`, children: todo.priority }), todo.tags.map((tag) => jsx("span", { className: "tag", children: tag }, tag)), isOverdue && jsx("span", { className: "overdue-badge", children: "overdue" })] }), jsxs("div", { className: "actions", children: [jsx("button", { type: "button", onClick: () => setEditing(true), children: "Edit" }), jsx("button", { type: "button", onClick: () => onDelete(todo.id), children: "Delete" })] })] });
}
TodoItem.__xydUniform = JSON.parse('{"title":"TodoItem","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"todo","type":"object","description":"The todo data to render","meta":[{"name":"required","value":"true"}],"properties":[{"name":"id","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"title","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"description","type":"string","description":"","meta":[]},{"name":"completed","type":"boolean","description":"","meta":[{"name":"required","value":"true"}]},{"name":"priority","type":"$xor","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]}]},{"name":"tags","type":"$array","description":"","meta":[{"name":"required","value":"true"}],"properties":[],"ofProperty":{"name":"","type":"string","properties":[],"description":"","meta":[{"name":"required","value":"true"}]}},{"name":"createdAt","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"completedAt","type":"string","description":"","meta":[]},{"name":"dueDate","type":"string","description":"","meta":[]}]},{"name":"onToggle","type":"(id: string) => unknown","description":"Called when the checkbox is toggled","meta":[{"name":"required","value":"true"}]},{"name":"onDelete","type":"(id: string) => unknown","description":"Called when the delete button is clicked","meta":[{"name":"required","value":"true"}]},{"name":"onUpdate","type":"(id: string, updates: object) => unknown","description":"Called when the todo is updated","meta":[{"name":"required","value":"true"}]},{"name":"autoEdit","type":"boolean","description":"Enable inline editing mode on mount","meta":[]}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
function AddTodoForm({ onAdd, defaultPriority = "medium", placeholder = "What needs to be done?" }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(defaultPriority);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim())
      return;
    onAdd(title.trim(), priority, description.trim() || void 0, tags.split(",").map((t) => t.trim()).filter(Boolean));
    setTitle("");
    setDescription("");
    setTags("");
    setPriority(defaultPriority);
  };
  return jsxs("form", { onSubmit: handleSubmit, className: "add-todo-form", children: [jsx("input", { type: "text", value: title, onChange: (e) => setTitle(e.target.value), placeholder }), jsxs("select", { value: priority, onChange: (e) => setPriority(e.target.value), children: [jsx("option", { value: "low", children: "Low" }), jsx("option", { value: "medium", children: "Medium" }), jsx("option", { value: "high", children: "High" }), jsx("option", { value: "urgent", children: "Urgent" })] }), jsx("textarea", { value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Description (optional)" }), jsx("input", { type: "text", value: tags, onChange: (e) => setTags(e.target.value), placeholder: "Tags (comma separated)" }), jsx("button", { type: "submit", disabled: !title.trim(), children: "Add" })] });
}
AddTodoForm.__xydUniform = JSON.parse('{"title":"AddTodoForm","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"onAdd","type":"(title: string, priority: $xor, description: string, tags: $array) => unknown","description":"Callback fired after a todo is successfully added","meta":[{"name":"required","value":"true"}]},{"name":"defaultPriority","type":"$xor","description":"Default priority for new todos","meta":[],"properties":[{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]}]},{"name":"placeholder","type":"string","description":"Placeholder text for the title input","meta":[]}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
function FilterBar({ filter, onFilterChange, searchQuery, onSearchChange, stats, onClearCompleted, className }) {
  const tabs = [
    { value: "all", label: `All (${stats.total})` },
    { value: "active", label: `Active (${stats.active})` },
    { value: "completed", label: `Done (${stats.completed})` }
  ];
  return jsxs("div", { className: `filter-bar ${className || ""}`, children: [jsx("div", { className: "tabs", children: tabs.map((tab) => jsx("button", { type: "button", className: filter === tab.value ? "active" : "", onClick: () => onFilterChange(tab.value), children: tab.label }, tab.value)) }), jsx("input", { type: "search", value: searchQuery, onChange: (e) => onSearchChange(e.target.value), placeholder: "Search..." }), stats.completed > 0 && jsx("button", { type: "button", onClick: onClearCompleted, className: "clear-btn", children: "Clear completed" })] });
}
FilterBar.__xydUniform = JSON.parse('{"title":"FilterBar","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"filter","type":"$xor","description":"Current active filter","meta":[{"name":"required","value":"true"}],"properties":[{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]}]},{"name":"onFilterChange","type":"(filter: $xor) => unknown","description":"Called when the filter changes","meta":[{"name":"required","value":"true"}]},{"name":"searchQuery","type":"string","description":"Current search query","meta":[{"name":"required","value":"true"}]},{"name":"onSearchChange","type":"(query: string) => unknown","description":"Called when the search query changes","meta":[{"name":"required","value":"true"}]},{"name":"stats","type":"object","description":"Todo statistics for displaying counts","meta":[{"name":"required","value":"true"}],"properties":[{"name":"total","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"active","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"completed","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"overdue","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"byPriority","type":"object","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"low","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"medium","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"high","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"urgent","type":"number","description":"","meta":[{"name":"required","value":"true"}]}]}]},{"name":"onClearCompleted","type":"() => unknown","description":"Called when \\"Clear completed\\" is clicked","meta":[{"name":"required","value":"true"}]},{"name":"className","type":"string","description":"Additional CSS classes","meta":[]}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
function StatCard({ label, value, color }) {
  return jsxs("div", { className: "stat-card", children: [jsx("span", { className: "stat-label", children: label }), jsx("span", { className: "stat-value", style: { color }, children: value })] });
}
function StatsPanel({ stats, compact }) {
  const cards = [
    { label: "Total", value: stats.total },
    { label: "Active", value: stats.active, color: "#3b82f6" },
    { label: "Done", value: stats.completed, color: "#22c55e" },
    { label: "Overdue", value: stats.overdue, color: stats.overdue > 0 ? "#ef4444" : void 0 }
  ];
  return jsx("div", { className: `stats-panel ${compact ? "compact" : ""}`, children: cards.map((c) => jsx(StatCard, { label: c.label, value: c.value, color: c.color }, c.label)) });
}
StatsPanel.__xydUniform = JSON.parse('{"title":"StatsPanel","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"stats","type":"object","description":"Todo statistics to display","meta":[{"name":"required","value":"true"}],"properties":[{"name":"total","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"active","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"completed","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"overdue","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"byPriority","type":"object","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"low","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"medium","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"high","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"urgent","type":"number","description":"","meta":[{"name":"required","value":"true"}]}]}]},{"name":"compact","type":"boolean","description":"Render in compact horizontal mode","meta":[]}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
export {
  AddTodoForm,
  FilterBar,
  StatsPanel,
  TodoItem
};

