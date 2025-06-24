---
title: Authentication
description: Authentication
---

# LiveSession API authentication
:::subtitle
Learn how to start make your first LiveSession API request.
:::

You can interact with the API through HTTP requests from any language, via our official Node.js library, or a via raw HTTP requests.

To install the official Node.js bindings, run the following command:
```bash
npm install livesession
```

## Authentication
The LiveSession API uses Personal Acesss Tokens (PAT) for authentication. You can create PAT inside [LiveSession settings](https://app.livesession.io/app/settings/api?tab=api_tokens)
and next follow below steps:

:::steps
1. Click `API Tokens` from left menu
2. In the upper-right corner of API Tokens page, click the creation button
3. Give your token a descriptive name
4. Select the website you want to access through the REST API
5. Select the scopes you'd like to grant this token
6. At the end click on confirm button
:::

**Remember that your API key is a secret!** Do not share it with others or expose it in any client-side code (browsers, apps).

Production requests must be routed through your own backend server where your API key can be securely loaded from an environment variable or key management service.

All API requests should include your API key in an Authorization HTTP header as follows:

```bash
Authorization: Bearer $LIVESESSION_PAT
```

## Making requests
You can paste the command below into your terminal to run your first API request.
Make sure to replace `$LIVESESSION_PAT` with your secret PAT.

:::tabs{kind="secondary"}
1. [Node.js](lang=nodejs)
    ```ts
    import livesession from "livesession";

    const ls = new livesession(
        livesession.optionApikey(process.env.LIVESESSION_PAT)
    )

    const sessions = await ls.sessions.list()
    ```

2. [Go](lang=go)
    ```go
    package main

    import (
        "context"
        "fmt"
        "log"
        lsClient "go.livesession.dev/livesession-go/client"
    )

    func main() {
        ls := lsClient.New(lsClient.WithApiKey(os.Getenv("LIVESESSION_PAT")))
        
        sessions, err := ls.Sessions.List(context.Background())
    }
    ```
    
3. [Curl](lang=curl)
    ```bash curl
    curl https://api.livesession.io/v1/sessions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $LIVESESSION_PAT"
    ```
:::

## Rate limits
Note that by default all tokens are set to 2 Queries Per Second (QPS). This is a per token limit.