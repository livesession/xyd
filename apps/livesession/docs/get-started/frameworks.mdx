---
title:  Frameworks
description: Learn how to integrate LiveSession with popular web frameworks
tocGithub: 
    link: "https://github.com/livesession/livesession-browser-samples"
    title: "Web Framework Starters"
    description: "Sample projects for LiveSession in your favorite web framework."
---

# Web frameworks
:::subtitle
Learn how to integrate LiveSession with popular web frameworks and services.
:::

## Quick Start

First, install the LiveSession Browser SDK:

:::code-group{title="Install @livesession/browser"}
```bash npm
npm install @livesession/browser
```

```bash pnpm
pnpm add @livesession/browser
```

```bash yarn
yarn add @livesession/browser
```
:::

Then initialize LiveSession in your application:

```ts
import ls from "@livesession/browser"

ls.init("YOUR_TRACK_ID")
```

Start recording:

```ts
ls.newPageView()
```

## Angular

In your `src/app/app.component.ts`, initialize LiveSession using your project tracking code.
You can find it in your project settings.

```ts src/app/app.component.ts [descHead="Tip" desc="Sample Angular app, you can [View on GitHub](https://github.com/livesession/livesession-browser-samples/tree/master/angular)."]
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import ls from "@livesession/browser";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
})
export class AppComponent {
  ngOnInit() {
    ls.init("YOUR_TRACK_ID")
    
    ls.newPageView()
  }
}
```

## Astro

In your `src/components/LiveSession.astro`, initialize LiveSession using your project tracking code.
You can find it in your project settings.

```astro src/components/LiveSession.astro
---
const trackID = "YOUR_TRACK_ID";
---

<livesession-astro data-track-id={trackID}></livesession-astro>

<script>
   import ls from "@livesession/browser";

  class LiveSessionAstro extends HTMLElement {
    connectedCallback() {
      const trackId = this.dataset.trackId;
      if (!trackId) {
        console.warn("(livesession-astro): no 'trackId' provided");
        return;
      }

      ls.init(trackId);
      ls.newPageView();
    }
  }

  customElements.define("livesession-astro", LiveSessionAstro);
</script>
```

then add the component to your layout:
```astro [descHead="Tip" desc="Sample Astro app, you can [View on GitHub](https://github.com/livesession/livesession-browser-samples/tree/master/astro)."]
---
import LiveSession from '../components/LiveSession.astro';
---

<!doctype html>
<html lang="en">
 <head>
  <title>Astro Basics</title>
 </head>
 <body>
  <slot />
  <LiveSession />
 </body>
</html>
```

## Next.js
In your `src/app/livesession.tsx`, initialize LiveSession using your project tracking code.
You can find it in your project settings.

```tsx src/app/livesession.tsx
'use client'

import { useEffect } from 'react'

import ls from '@livesession/browser'

export function LiveSession({ children }: { children: React.ReactNode }) {
    useEffect(() => {
      ls.init("YOUR_TRACK_ID")
      ls.newPageView()
  }, [])

  return children
}
```

then the provider to your root layout:

```tsx [descHead="Tip" desc="Sample Next.js app, you can [View on GitHub](https://github.com/livesession/livesession-browser-samples/tree/master/next)."]
import { LiveSession } from './livesession'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LiveSession>{children}</LiveSession>
      </body>
    </html>
  )
}
```

## Nuxt

Create a plugin for LiveSession in `plugins/livesession.ts` and initialize LiveSession using your project tracking code.
You can find it in your project settings.

```ts plugins/livesession.ts [descHead="Tip" desc="Sample Nuxt app, you can [View on GitHub](https://github.com/livesession/livesession-browser-samples/tree/master/nuxt)."]
import { defineNuxtPlugin, useRuntimeConfig, useRouter, nextTick } from '#imports'

import ls from '@livesession/browser'

export default defineNuxtPlugin(() => {
    const runtimeConfig = useRuntimeConfig()
    const router = useRouter()

    router.afterEach((to) => {
        nextTick(() => {
            if (!process.client) {
                return
            }

            ls.init("YOUR_TRACK_ID")
            ls.newPageView()
        })
    })
})
```

## React

In your `src/main.tsx`, initialize LiveSession using your project tracking code.
You can find it in your project settings.

```tsx src/main.tsx [descHead="Tip" desc="Sample React app, you can [View on GitHub](https://github.com/livesession/livesession-browser-samples/tree/master/react)."]
import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'

import ls from "@livesession/browser";

import './index.css'
import App from './App.jsx'

try {
    ls.init("YOUR_TRACK_ID")
    ls.newPageView()
} catch(e) {
    console.error(e)
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App/>
    </StrictMode>,
)
```

## React Router

In your `app/components/LiveSession.tsx`, initialize LiveSession using your project tracking code.
You can find it in your project settings.

```tsx app/components/LiveSession.tsx
import { useEffect } from "react";
import ls from "@livesession/browser";

export function LiveSession({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        ls.init("YOUR_TRACK_ID")
        ls.newPageView()
    }, [])

    return children
}
```

then add the component to your root layout:
```tsx root.tsx [descHead="Tip" desc="Sample React Router app, you can [View on GitHub](https://github.com/livesession/livesession-browser-samples/tree/master/react-router)."]
import { LiveSession } from './components/LiveSession'
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <LiveSession />
      </body>
    </html>
  );
```

## Svelte (SvelteKit)

In `src/routes/+layout.ts`, initialize LiveSession using your project tracking code.
You can find it in your project settings.

```ts src/routes/+layout.ts [descHead="Tip" desc="Sample Svelte app, you can [View on GitHub](https://github.com/livesession/livesession-browser-samples/tree/master/sveltekit)."]
import ls from '@livesession/browser'
import { browser } from '$app/environment';

export const load = async () => {
  if (browser) {
    ls.init("YOUR_TRACK_ID")
    ls.newPageView()
  }
  return
};
```

## Vue

In `src/main.ts`, initialize LiveSession using your project tracking code.
You can find it in your project settings.

```ts src/main.ts [descHead="Tip" desc="Sample Vue app, you can [View on GitHub](https://github.com/livesession/livesession-browser-samples/tree/master/vue)."]
import { createApp } from 'vue'

import ls from "@livesession/browser";

import './style.css'
import App from './App.vue'

try {
   ls.init("YOUR_TRACK_ID")
  ls.newPageView()
} catch(e) {
    console.error(e)
}

createApp(App).mount('#app')
```

## Gatsby
1. Install [gatsby-plugin-livesession](https://www.gatsbyjs.com/plugins/@livesession/gatsby-plugin-livesession)
2. Go to gatsby-config.js
3. Configure a plugin like in following example:

```js
plugins: [
  {
    resolve: `@livesession/gatsby-plugin-livesession`,
    options: {
      trackID: YOUR_LIVESESSION_TRACKID, // Required, string
      keystrokes: true || false, // Optional, default to false
      rootHostname: ".example.com", // Optional
    },
  },
];
```
Read more about an options you can provide [here](/docs/api/browser/methods).

:::callout
Plugin adds code to your site only in production mode.
:::

## Capacitor

In general LiveSession support that technology, but you must be sure that resources on your app are available publicly on the Internet.

If you use local server for some reasons you'll need to pass baseURL option like the following:
```js
__ls("newPageView", {
  baseURL: "https://your-site.com"
});
```
:::callout
For example if you set up your [local server](https://capacitorjs.com/docs/config#schema)
with **hostname:'frontend', androidScheme:'capacitor-app'** and 
href to css in your app is /static/style.css the following style resource must be available 
at `https://your-site.com/static/style.css` assuming you set baseURL to `https://you-site.com`
:::

## Electron
Electron doesn't natively support cookies, so LiveSession JavaScript web tracking code won't work because internally we use client-side cookies. We're currently working on a of the electron-cookies package to support tracking.

:::callout
In the future we'll switch to another browser storage instead of cookies and Electron should works out of the box.
:::

So, to use LiveSession in Electron apps you should:

1. Install electron-cookies package
2. Configure a like in following example:

```js
import ElectronCookies from '@livesession/electron-cookies';
// enable
ElectronCookies.enable({
  origin: 'https://example.com'
}); // or ElectronCookies.enable() for default
// disable
ElectronCookies.disable();
```
The browser cookies needs to know the current URL, but in Electron files are usually served from local filesystem which is not compatibile with cookies. Treat origin as a special key for cookies store within all data is saved.

Read more about a package [here](https://github.com/livesession/electron-cookies).

## Sample Projects

Check out our [sample projects](https://github.com/livesession/livesession-browser-samples) for complete examples of LiveSession integration with each framework. 