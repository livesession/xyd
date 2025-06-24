---
title: Metrics
description: Analyze key metrics to gain insights into user behavior and performance.
---

# Metrics
:::subtitle
Analyze key metrics to gain insights into user behavior and performance.
:::

Metrics in LiveSession allow you to compute and analyze various metrics over time. Use this feature to:

:::steps
- Track key performance indicators (KPIs) and metrics.

- Identify metrics and patterns in user behavior.

- Gain actionable insights to improve your product.
:::

## Overview
Metrics enable you to compute metrics based on user activity and other data points in your application. These metrics help you understand [user behavior](https://livesession.io/features) and performance over time.

With the LiveSession API, you can programmatically define, query, and analyze metrics to gain insights into metrics.

## Compute
Use the following API request to compute a metric:

```bash Compute a metric
curl https://api.livesession.io/v1/compute/metric \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $LIVESESSION_PAT" \\
  -d '{
      "website_id": "YOUR_WEBSITE_ID",
      "compute": {
        "date_range": {
          "from": "2024-01-01",
          "to": "2024-12-31"
        },
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
        },
        "type": "sessions",
        "histogram": {
          "aggs_func": "sum",
          "interval": "week"
        }
      }
    }'
```

This request computes the number of sessions where the `Signup Form: filled` event occurred.
The result is aggregated by week in histogram format.

About more compute options read [API reference](https://livesession.io).

## Next steps

:::guide-card{icon="<Icon name='code'/>" title="APIs and references" href="/docs/api/quickstart"}
  Explore the API reference and documentation for more details.
:::


