---
title: React Components
icon: docs:react
tocCard: 
    link: https://github.com/xyd-js/examples/tree/master/react-components
    title: React Components Samples
    description: Learn how to setup React Component
    icon: docs:github
---

# React Components 
:::subtitle
Learn how to create custom React Components
:::

## Usage
You can build React components directly in your MDX files.

### Example

```mdx .docs/components/Counter.tsx [descHead="Important" desc="to use React API you need to explicite call <code>React</code> e.g <code>React.useState</code>"]
export function Counter() {
  const [count, setCount] = React.useState(0);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(0);

  return (
    <div className="counter">
      <div className="counter-display">
        <span className="counter-label">Count:</span>
        <span className="counter-value">{count || "0"}</span>
      </div>
      <div className="counter-controls">
        <button 
          className="counter-btn counter-btn-decrement" 
          onClick={decrement}
          aria-label="Decrease count"
        >
          -
        </button>
        <button 
          className="counter-btn counter-btn-reset" 
          onClick={reset}
          aria-label="Reset count"
        >
          Reset
        </button>
        <button 
          className="counter-btn counter-btn-increment" 
          onClick={increment}
          aria-label="Increase count"
        >
          +
        </button>
      </div>
    </div>
  );
}

<Counter/>
```

@include "~/.docs/components/Counter.mdx"

and import that in your content via [`@include`](/docs/reference/functions/include) function:
```
@include ".docs/components/Counter.mdx"
```

and your custom CSS:
```css .docs/theme/index.css
/* Counter Component Styles */
.counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  ...
}
...
```

## Next steps

:::guide-card{title="Code Samples" icon="code" href="https://github.com/xyd-js/examples/tree/master/react-components"}
Learn how to setup React Component
:::