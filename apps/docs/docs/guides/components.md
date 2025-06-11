---
title: UI Components
icon: component
tocCard: 
    link: https://github.com/xyd-js/component-api-samples
    title: Components API Samples
    description: Learn how to setup Components API pages
    icon: docs:github
---

# UI Components
:::subtitle
Reference UI Components in your docs pages
:::

:::callout
Currently, only React components are supported.
:::

## API Docs Generation Explanation

- The generator automatically creates API documentation based on your UI components

- Extracts prop types and their descriptions from TypeScript definitions

- Groups props by their categories (required, optional, etc.)

- Shows default values and prop types

- Displays component usage examples

## Setup Component Configuration

:::steps
1. To create an API documentation page for a component, specify its path in the meta using [`uniform`](/docs/reference/meta/uniform):

```yaml
---
title: Callouts
icon: info
# !diff +
uniform: "<PATH TO COMPONENT>"
---
```

2. Mark component function in code:
```tsx
/**
 * @category Component
 */
export function Button() {
  ...
}
```

alternatively using`@component`:
```tsx
/**
 * @component
 */
export function Button() {
  ...
}
```
:::

## Example
Here's a full example of a React component and how it will be documented:

```tsx
// components/Button.tsx
import React from 'react'

interface ButtonProps {
  /** The text to display inside the button */
  children: React.ReactNode

  /** The type of button */
  variant?: 'primary' | 'secondary'

  /** Whether the button is disabled */
  disabled?: boolean

  /** Click handler */
  onClick?: () => void
}

/**
 * @category Component
 */
export const Button = ({ 
  children, 
  variant = 'primary',
  disabled = false,
  onClick 
}: ButtonProps) => {
  return (
    <button 
      className={`btn-${variant}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

This will generate an API documentation page that shows:
- Component name and description
- Props info with:
  - Prop name
  - Type
  - Required status
  - Description from TypeDoc comments
- Usage examples
- TypeScript interface definitions

:::callout
Please make sure you mentioned `@category Component` or `@component` in TypeDoc comment.
:::

## Composition

You can use [composition](/docs/guides/compose-content) to make your component API page more custom:

~~~md
---
title: Callouts
icon: info
layout: wide
uniform: "@components/writer/Callout/Callout.tsx"
---


### Examples
:::callout
Note that you must have an Admin or Owner role to manage webhook settings.
:::

<<<examples
```tsx
<Callout>
Note that you must have an Admin or Owner role to manage webhook settings.
</Callout>
```

```md
:::callout
Note that you must have an Admin or Owner role to manage webhook settings.
:::
```
<<<
~~~