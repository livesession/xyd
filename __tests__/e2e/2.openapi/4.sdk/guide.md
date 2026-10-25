---
title: Guide
---

# Guide

A code group of two languages follows the page-wide SDK language:

:::code-group
```python
from todo_api import Client

client = Client(api_key="...")
print(client.todos.list())
```

```go
client := todoapi.NewClient(option.WithAPIKey("..."))
result, _ := client.Todos.List(context.TODO())
fmt.Println(result)
```
:::

A group of one language keeps its own tab:

:::code-group
```bash npm
npm install -g todo-cli
```

```bash pnpm
pnpm add -g todo-cli
```
:::
