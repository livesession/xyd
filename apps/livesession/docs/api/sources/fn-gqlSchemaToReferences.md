---
title: gqlSchemaToReferences
---
## !!references Function gqlSchemaToReferences

### !description

Converts a GraphQL schema file to references.


### !canonical fn-gqlSchemaToReferences

### !context

#### !packageName @xyd-sources-examples/package-a

#### !fileName index.ts

#### !fileFullPath src/index.ts

#### !line 48

#### !col 16

#### !signatureText

```ts
export function gqlSchemaToReferences(schemaLocation: string): Promise<[
]>;
```

#### !sourcecode

```ts
export function gqlSchemaToReferences(
    schemaLocation: string
): Promise<[]> {
    if (schemaLocation.endsWith(".graphql")) {
        return Promise.resolve([])
    }

    return Promise.resolve([])
}
```

#### !package @xyd-sources-examples/package-a

### !examples

### !!definitions

#### !title Returns

#### !!properties 

!name&#x20;

!type \<Promise>

references

### !!definitions

#### !title Parameters

#### !!properties schemaLocation

!name schemaLocation

!type string

The location of the schema file.
