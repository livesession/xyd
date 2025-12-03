---
title: Supademo
---

# Supademo

The [Supademo](https://supademo.com) integration allows you to embed interactive demos in your documentation. This enables visitors to try out your product or API directly within your docs, providing a hands-on experience that enhances understanding and engagement.

:::callout
You can still use [embedded version](https://docs.supademo.com/sharing/embed-online) of Supademo. Then you don't need this integration.
:::

## Configuration

To enable the Supademo integration, add the following configuration to your `docs.json`:

```json
{
  "integrations": {
    ".apps": {
      "supademo": {
        "apiKey": "YOUR_API_KEY"
      }
    }
  }
}
```

## Example

Embed interactive product demos in your documentation. Users can click the demo button to see an interactive tour.

::::code-group
```md md
<span data-supademo-demo="YOUR_DEMO_ID">

:::button
View Demo
:::

</span>
```

```mdx mdx
<span data-supademo-demo="YOUR_DEMO_ID">

<Button>
View Demo
</Button>

</span>
```
::::

<span data-supademo-demo="cmdvyvj6r6liu9f96jj5xg65n">

:::button
View Demo
:::

</span>

:::callout{kind="tip"}
Alternatively you can use [<code>Supademo()</code>](https://docs.supademo.com/sharing/in-app-product-tours#trigger-a-supademo-or-showcase-programmatically-via-event) API inside [MDX Components](/guides/react-components).
:::

## Reference
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'IntegrationAppSupademo'})"}

## Analytics

Track how users interact with your demos through automatic [analytics events](/guides/integrations/analytics/analytics-integrations).

| Event name           | Custom properties                                                                 | Description               |
|----------------------|------------------------------------------------------------------------------------|---------------------------|
| `supademo.loadDemo`       | <code>-</code>                                            | When a Supademo loads.     |

