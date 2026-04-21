import { TodoProvider } from "../contexts/TodoContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { AddTodoForm } from "./AddTodoForm";
import { FilterBar } from "./FilterBar";
import { StatsPanel } from "./StatsPanel";
import { TodoItem } from "./TodoItem";
import { ThemeToggle } from "./ThemeToggle";
import { useFilteredTodos } from "../hooks/useTodos";

function TodoList() {
    const todos = useFilteredTodos();

    if (todos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <span className="text-4xl">:)</span>
                <p className="mt-2 text-sm">No todos match your filters</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {todos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
            ))}
        </div>
    );
}

function App() {
    return (
        <ThemeProvider>
            <TodoProvider>
                <div className="mx-auto max-w-2xl px-4 py-8">
                    <header className="mb-6 flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Todo App
                        </h1>
                        <ThemeToggle />
                    </header>

                    <div className="space-y-4">
                        <StatsPanel />
                        <AddTodoForm />
                        <FilterBar />
                        <TodoList />
                    </div>
                </div>
            </TodoProvider>
        </ThemeProvider>
    );
}

export { App };
