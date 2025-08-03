---
title: Analytics Integrations
---

# Analytics Integrations
:::subtitle
Integrate with an analytics platform to track events
:::

Automatically send data about your documentation engagement to your third party analytics providers.

## All integrations
:::grid
- 
  - 
    :::guide-card{kind="secondary" title="LiveSession" icon="docs:livesession" href="/docs/guides/integrations/analytics/livesession"}
    Learn how to add send analytics events to LiveSession
    :::

:::


## Enable Analytics
Set your analytics keys in `docs.json` under the `integrations.analytics` section:
```json docs.json [descHead="Tip" desc="Sign up to [LiveSession](https://signup.livesession.io/signup/?source_id=xyd) to get your <code>trackId</code>."]
{
    "integrations": {
        "analytics": {
            "livesession": {
                "trackId": "required"
            }
        }
    }
}
```

## Demo


## Analytics Events
We send the following events to your analytics provider.

| Event name           | Custom properties                                                                 | Description               |
|----------------------|------------------------------------------------------------------------------------|---------------------------|
| `docs.copy_page`       | <code class="json">{<br>&nbsp;location: string<br>}</code>                                            | When a page is copied.     |
| `docs.code.copy`       | <code class="json">{<br>&nbsp;code: string<br>&nbsp;tab: string<br>&nbsp;example: string<br>&nbsp;location: string<br>}</code> | When code is copied. |
| `docs.code.example_change` | <code class="json">{<br>&nbsp;example: string<br>&nbsp;location: string<br>}</code>                     | When a code example is changed. |
| `docs.code.scroll_100` | <code class="json">{<br>&nbsp;location: string<br>}</code>           | Triggers when a scroll of codeblock reached at bottom. |
| `docs.code.scroll_depth` | <code class="json">{<br>&nbsp;example: string<br>&nbsp;depth: 25 / 50 / 75 /100<br>}</code>            | Triggers when a specific depth of codeblock scroll reached out. |
| `docs.code.tab_change` | <code class="json">{<br>&nbsp;tab: string<br>&nbsp;example: string<br>&nbsp;location: string<br>}</code>          | When a code tab is changed. |
| `docs.details.open` | <code class="json">{<br>&nbsp;label: string<br>&nbsp;location: string<br>}</code>                     | When a user opens a details. |
| `docs.details.close` | <code class="json">{<br>&nbsp;label: string<br>&nbsp;location: string<br>}</code>                     | When a user closes a details. |
| `docs.search.open` | <code>-</code>                     | When a user clicks on search. |
| `docs.search.result_click` | <code class="json">{<br>&nbsp;title: string<br>&nbsp;description: string<br>}</code>                     | When a user click a search result. |
| `docs.search.query_change` | <code class="json">{<br>&nbsp;term: string<br>}</code>                     | When a user change query on search input. |
