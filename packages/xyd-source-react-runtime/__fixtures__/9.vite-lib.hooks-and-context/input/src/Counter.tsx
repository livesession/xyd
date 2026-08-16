import { useState } from "react";

interface CounterProps {
    /** Initial count value */
    initialCount?: number;
    /** Step size for increment/decrement */
    step?: number;
    /** Called when count changes */
    onChange?: (count: number) => void;
}

export function Counter({ initialCount = 0, step = 1, onChange }: CounterProps) {
    const [count, setCount] = useState(initialCount);
    const [label, setLabel] = useState("Counter");

    const increment = () => {
        const next = count + step;
        setCount(next);
        onChange?.(next);
    };

    return (
        <div>
            <span>{label}: {count}</span>
            <button onClick={increment}>+{step}</button>
            <button onClick={() => setLabel("Modified")}>Rename</button>
        </div>
    );
}