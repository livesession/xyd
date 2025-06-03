---
title: helloWorldV2
---
## !!references Function helloWorldV2

### !description

Returns a personalized hello world message.


### !canonical fn-helloWorldV2

### !context

#### !packageName @xyd-sources-examples/package-a

#### !fileName index.ts

#### !fileFullPath src/index.ts

#### !line 15

#### !col 16

#### !signatureText

```ts
export function helloWorldV2(name: string, enthusiastic: boolean = false): string;
```

#### !sourcecode

```ts
export function helloWorldV2(name: string, enthusiastic: boolean = false): string {
    return enthusiastic ? `Hello, ${name}!` : `Hello, ${name}`;
}
```

#### !package @xyd-sources-examples/package-a

### !examples

### !!definitions

#### !title Returns

#### !!properties 

!name&#x20;

!type string

A greeting message string.

### !!definitions

#### !title Parameters

#### !!properties name

!name name

!type string

Name of the person to greet.

#### !!properties enthusiastic

!name enthusiastic

!type boolean

If true, adds an exclamation point to the greeting.
