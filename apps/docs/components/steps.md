---
title: Steps
icon: list-checks
layout: wide
uniform: "@components/writer/Steps/Steps.tsx"
---

<<<examples
```md
:::steps{kind="secondary"}
1. Click `API Tokens` from left menu
2. In the upper-right corner of API Tokens page, click the creation button
3. Give your token a descriptive name
:::
```

```tsx
<Steps>
    <Steps.Item>
        Click `API Tokens` from left menu
    </Steps.Item>
    <Steps.Item>
        In the upper-right corner of API Tokens page, click the creation button
    </Steps.Item>
    <Steps.Item>
        Give your token a descriptive name
    </Steps.Item>
</Steps>
```
<<<