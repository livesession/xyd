---
title: Callouts
icon: info
layout: wide
uniform: "@components/writer/Callout/Callout.tsx"
---


### Examples
:::grid{cols="2"}
-   
    - 
        :::callout
        You must have an Admin or Owner role to manage webhook settings.
        :::

    - 
        :::callout{kind="warning"}
        Warning: you must have an Admin or Owner role to manage webhook settings.
        :::

    - 
        :::callout{kind="note"}
        Note: you must have an Admin or Owner role to manage webhook settings.
        :::

    - 
        :::callout{kind="tip"}
        Tip: you must have an Admin or Owner role to manage webhook settings.
        :::

    - 
        :::callout{kind="check"}
        Check: you must have an Admin or Owner role to manage webhook settings.
        :::
        
    - 
        :::callout{kind="danger"}
        Danger: you must have an Admin or Owner role to manage webhook settings.
        :::
:::

<<<examples
```md
:::callout{kind="warning"}
Note that you must have an Admin or Owner role to manage webhook settings.
:::
```

```tsx
<Callout kind="warning">
Note that you must have an Admin or Owner role to manage webhook settings.
</Callout>
```
<<<
