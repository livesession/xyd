---
title: helloWorldV3
---
## !!references Function helloWorldV3

### !description

Returns a personalized hello world message.


### !canonical fn-helloWorldV3

### !context

#### !packageName @xyd-sources-examples/package-a

#### !fileName index.ts

#### !fileFullPath src/index.ts

#### !line 25

#### !col 16

#### !signatureText

```ts
export function helloWorldV3<T>(name: T): string;
```

#### !sourcecode

```ts
export function helloWorldV3<T>(name: T): string {
    return `Hello, ${name}!`
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

!type \<T>

Name of the person to greet.
