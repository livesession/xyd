# @apitoolchain/gitprovider-node

apitoolchain gitproviderd — the HTTP wire contract for the Go git-provider
service. Provider credentials are inlined into every request body (kind,
baseUrl, token, login); there is no shared auth scheme.

## Usage

```ts
import { Client } from '@apitoolchain/gitprovider-node';

const client = new Client({ apiKey: process.env.API_KEY });
```
