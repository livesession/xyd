---
title: AB Testing Integrations
tocCard: 
    - link: https://github.com/xyd-js/examples/tree/master/abtesting
      title: AB Testing Samples
      description: Learn how to setup AB tests
      icon: docs:github
---


# AB Testing Integrations {label="Experimental"}
:::subtitle
Integrate with AB testing platform to create experiments
:::

A/B testing integration lets you create experiments and feature flags in your documentation. Test different content versions and track user behavior to optimize your docs based on real data.

We use [OpenFeature](https://openfeature.dev) specification for feature flag management, providing a standardized approach to A/B testing across your documentation.

## All integrations
:::grid
- 
  - 
    :::guide-card{kind="secondary" title="GrowthBook" icon="docs:growthbook" href="/guides/integrations/abtesting/growthbook"}
    Learn how to integrate GrowthBook for A/B testing and feature flags
    :::

  - 
    :::guide-card{kind="secondary" title="LaunchDarkly" icon="docs:launchdarkly" href="/guides/integrations/abtesting/launchdarkly"}
    Learn how to integrate LaunchDarkly for A/B testing and feature flags
    :::

:::

## Feature Flags in Markdown
To use feature flags inside your content files, you can use `feature/Feature` component:

::::code-group{title="your"}
```ts md 
:::feature{flag="demo-tutorial" match="v1"}

@include "./demo-tutorial1.mdx"

:::

:::feature{flag="demo-tutorial" match="v2"}

@include "./demo-tutorial2.mdx"

:::
```

```mdx
<Feature flag="demo-tutorial" match="v1">

  <DemoTutorialV1/>

</Feature>

<Feature flag="demo-tutorial" match="v2">

  <DemoTutorialV2/>

</Feature>
```
::::

:::callout
Check out our [A/B testing example](https://github.com/xyd-js/examples/tree/master/abtesting).
:::

## Flags Evaluation
Feature flags are client-side only. Content is visually enabled when the feature flag evaluates to true.
Technically we did some improvements to avoid clunky render effect during feature flat evaluation.

Thanks to that the end-user experience should be close to server-side evalutation although it's running on client side only.

:::callout
By default feature context is saved in local storage for 7 days, if you'd to change this, please look at [reference](/guides/integrations/abtesting/overview#reference).
:::

## Server-side Evaluation
Currently, feature flags are evaluated client-side only. Need server-side evaluation for your use case? [Join our cummunity](https://github.com/livesession/xyd/discussions).

## Reference
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'IntegrationABTesting'})"}

## Feature Flags in Headings {label="Coming Soon"}
You can also use feature flags directly in your markdown content using the `featureFlag`, `featureMatch`, and `featureDefault` in heading attributes:

```md
## Tutorial [featureFlag="demo-tutorial" featureMatch="v1" featureDefault="v1"]
:::steps
1. First step for version 1
2. Second step for version 1
:::

<!-- you can use sugar syntax too: -->
## Tutorial [feature=("demo-tutorial", "v1")]
:::steps
1. First step for version 2
2. Second step for version 2
3. Additional step for version 2
:::
```
## Analytics Integration {label="Coming Soon"}
Track [user behavior](https://livesession.io) and engagement with your A/B testing experiments. Send [analytics events](/guides/integrations/analytics/analytics-integrations) to measure which content versions perform better and optimize your documentation based on real user data. 

## AB Testing Samples
Learn [how to setup AB tests](https://github.com/xyd-js/examples/tree/master/abtesting).
