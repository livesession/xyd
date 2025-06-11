---
title: Tabs
icon: panel-top
layout: wide
uniform: "@components/writer/UnderlineNav/UnderlineNav.tsx"
---

# Tabs {label="Coming Soon"}

<<<examples
```tsx
 <UnderlineNav>
    <UnderlineNav.Item value="tab1" href="#tab1">
        First Tab
    </UnderlineNav.Item>
    <UnderlineNav.Item value="tab2" href="#tab2">
        Second Tab
    </UnderlineNav.Item>
    <UnderlineNav.Item value="tab3" href="#tab3">
        Third Tab
    </UnderlineNav.Item>

    <UnderlineNav.Content value="tab1">
        This is tab 1
    </UnderlineNav.Content>
    <UnderlineNav.Content value="tab2">
        This is tab 2
    </UnderlineNav.Content>
    <UnderlineNav.Content value="tab3">
        This is tab 3
    </UnderlineNav.Content>
</UnderlineNav>
```

```md
:::tabs
1. [CLI](tab=cli)
    Content for the CLI tab

2. [Code](tab=code)
    Content for the Code tab
:::
```
<<<