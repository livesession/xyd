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
        Note that you must have an Admin or Owner role to manage webhook settings.
        :::

    - 
        :::callout{kind="warning"}
        Note that you must have an Admin or Owner role to manage webhook settings.
        :::

    - 
        :::callout{kind="note"}
        Note that you must have an Admin or Owner role to manage webhook settings.
        :::

    - 
        :::callout{kind="tip"}
        Note that you must have an Admin or Owner role to manage webhook settings.
        :::

    - 
        :::callout{kind="check"}
        Note that you must have an Admin or Owner role to manage webhook settings.
        :::
        
    - 
        :::callout{kind="danger"}
        Note that you must have an Admin or Owner role to manage webhook settings.
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
