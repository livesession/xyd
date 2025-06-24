---
title: Alerts
description:  Learn how to react on events.
tocGithub: 
    link: "https://github.com/livesession/livesession-node-samples/tree/master/alerts"
    title: "Start alerting"
    description: "Show code how to create an alert based on custom event."
---

# Alerts
:::subtitle
Learn how to react on events.
:::

LiveSession [event stream](https://livesession.io/features) was designed to be a powerful tool helpful for example in monitoring and alerting purposes.
It allows you to react on events in real-time and take actions based on them.

## Quickstart
Alerts delivery can be configured in two ways. First, you can use third party delivery provider like `Slack`.
Second, you can set up a custom workflow using [webhooks](https://en.wikipedia.org/wiki/Webhook). All methods receive events in real-time.

:::code-group{title="Creating a webhook"}
```ts sdk
import livesession from "livesession"

const ls = new livesession(
    livesession.optionApiKey(process.env.LIVESESSION_PAT)
)

await ls.webhooks.create({
    website_id: "YOUR_WEBSITE_ID",
    url: "YOUR_WEBHOOK_URL",
   version: "v1.0",
})
```

```sh curl
curl https://api.livesession.io/v1/webhooks \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LIVESESSION_PAT" \
  -d '{
    "website_id": "YOUR_WEBSITE_ID",
    "url": "YOUR_WEBHOOK_URL",
    "version": "v1.0",
  }'
```
:::

Once you have a webhook set up, you can create an alert to receive events in real-time.

The main duty of alerts is to filter events and send them to the configured delivery provider.
You can for example create a [custom event](https://help.livesession.io/en/articles/8496404-custom-events) and based on that event send a message to your server.

## Creating an alert
Alerts gives you a robust control which events you want to receive.
You can use built-in events like `Error Click`, `Network Error` or based on [custom event](https://help.livesession.io/en/articles/8496404-custom-events) which gives you a full control of
what and when you want to monitor.

:::code-group{title="Creating an alert"}
```ts sdk
import livesession from "livesession"

const ls = new livesession(
    livesession.optionApiKey(process.env.LIVESESSION_PAT)
)

await ls.alerts.create({
    name: "YOUR_ALERT_NAME",
    provider: "webhooks",
    webhook_id: "YOUR_WEBHOOK_ID",
    events: [
        {
            kind: 26,
            value: "YOUR_CUSTOM_EVENT_NAME"
        }
    ]
})
```

```sh curl 
curl https://api.livesession.io/v1/alerts \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LIVESESSION_PAT" \
  -d '{
    "name": "YOUR_ALERT_NAME",
    "provider": "webhooks",
    "webhook_id": "YOUR_WEBHOOK_ID",
    "events": [
      {
        "kind": 26,
        "value": "YOUR_CUSTOM_EVENT_NAME"
      }
    ],
  }'
```
:::

:::callout
Based on above example, please make sure you used custom event tracking like
`ls.track("YOUR_CUSTOM_EVENT_NAME")`
:::
