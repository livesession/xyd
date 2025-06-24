---
title: Funnels
description: Analyze user behavior and optimize conversion flows with funnels.
---

# Funnels
:::subtitle
Analyze user behavior and optimize conversion flows with funnels.
:::

Funnels in LiveSession enable you to track and analyze the steps users take within your app to reach a desired outcome. Use this feature to:
:::steps
- Identify drop-off points in key workflows.

- Measure the performance of your conversion funnels.

- Gain actionable insights to improve user engagement and retention.
:::

## Overview
Funnels allow you to define a sequence of steps that represent a process in your application, such as completing a `purchase` or `signing up`.
These sequences help you understand [user behavior](https://livesession.io/features) at each stage and where users might abandon the process.

With the LiveSession API, you can programmatically define, query,
and analyze funnels to optimize user journeys.

## Compute
Thanks to compute you can analyze user behavior and conversion rates. Use the following API request to compute a funnel:

```bash Computing a funnel
curl https://api.livesession.io/v1/compute/funnel \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $LIVESESSION_PAT" \\
  -d '{
      "website_id": "YOUR_WEBSITE_ID",
      "date_range": {
        "from": "2024-12-01",
        "to": "2024-12-07"
      },
      "steps": [
        {
          "filters": {
            "must": [
              {
                "name": "event.location.",
                "group": "url",
                "data": {
                  "string": {
                    "operator": "eq",
                    "values": [
                      "https://example.com/signup"
                    ]
                  }
                }
              }
            ]
          }
        },
        {
          "filters": {
            "must": [
              {
                "name": "event.custom_name",
                "data": {
                  "string": {
                    "operator": "eq",
                    "values": [
                      "Signup Form: filled"
                    ]
                  }
                }
              }
            ]
          }
        },
        {
          "filters": {
            "must": [
              {
                "name": "event.location.",
                "group": "url",
                "data": {
                  "string": {
                    "operator": "eq",
                    "values": [
                      "https://example.com/signup/completed"
                    ]
                  }
                }
              }
            ]
          }
        }
      ]
    }'
```

