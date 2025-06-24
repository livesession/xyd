---
title: Markdown
icon: letter-text
---

# Markdown {subtitle="Start writing content like a Shakespeare"}

One of the main reasons why u make consider using `xyd` is writing experience.
We make every effort on it and take it serious.

## GFM [toc]
```md [descHead="GFM" desc="Use popular [markdown dialect](https://github.github.com/gfm/)."] 
# Heading1
 
Hello World, **Bold**, _Italic_, ~~Hidden~~
 
1. First
2. Second
 
> Quote here
 
![alt](/image.png)
```

## Writing Framework [toc]
&nbsp;
```md [descHead="Writing Framework" desc="Use our custom writing framework, learn more [here](https://xyd.dev/docs/guides/special-symbols)."] 
## Reference
This section contains the full reference for `Settings` interface:
@uniform('@core/types/settings.ts#Settings')

## Python SDK
You can also use our python SDK.

### Get Settings
@let(snippet = await snippets.py.getSettings())
Python `Get Settings` SDK snippet:
{snippet}
```

## Components [toc]
&nbsp;
```md [descHead="Components" desc="Use built-in [components](https://xyd.dev/docs/components)."] 
:::callout
You can use built-in components too.
:::
```
