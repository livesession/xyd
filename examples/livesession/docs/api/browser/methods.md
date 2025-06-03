---
title: Methods
description: Methods
---

# Methods

## `init`
This method is an entry point for LiveSession tracking script used to initialize tracking script on your website.
You can find your `trackingID` in **LiveSession** -> **Settings** -> **Websites**.

**Type signture:**
```ts
function ("init", trackingID: string, options?: InitOptions)
```
**Examples:**
:::code-group{title=""}
```js sdk
import ls from "@livesession/browser";

ls.init("accountID.websiteID");
```

```js window
__ls("init", "accountID.websiteID");
```
:::

with options:
:::code-group{title="Init and track every input"}
```js sdk
import ls from "@livesession/browser";

ls.init("accountID.websiteID", { keystrokes: true });
```

```js window
__ls("init", "accountID.websiteID", { keystrokes: true });
```
:::

#### options signature:
```ts
interface InitOptions {
    // 	Your accountID. Automatically extracted from trackingID
    accountID?: string

    // Your websiteID. Automatically extracted from trackingID
    websiteID?: string

    // Enable global keystroke tracking
    keystrokes?: boolean

    // Set this to the highest-level hostname to record session across different subdomains on your site
    // (e.g. `.your-domain.com`)
    rootHostname?: string
}
```
:::callout
More info about `keystrokes` you can find [here](https://help.livesession.io/en/articles/8825436-recording-user-s-keystrokes).
:::


&nbsp;

## `identify`
Identify user and custom data to session.

**Type signture:**
```ts
function("identify", data: IdentifyData)
```
**Examples:**
:::code-group{title=""}
```js sdk
import ls from "@livesession/browser";

ls.identify({ name: "John Doe", email: "john.doe@example.com" });
```

```js window
__ls("identify", { name: "John Doe", email: "john.doe@example.com" });
```
:::

with params:
:::code-group{title="Identify with parameters"}
```js sdk
import ls from "@livesession/browser";

ls.identify({
  name: "John Doe",
  email: "john.doe@example.com",
  params: {
    order_id: "123-abc-def",
    plan: "premium",
  },
});
```

```js window
__ls("identify", {
  name: "John Doe",
  email: "john.doe@example.com",
  params: {
    order_id: "123-abc-def",
    plan: "premium",
  },
});
```
:::

#### data signature:
```ts
interface IdentifyData {
    // Displays usernames in app
    // Maximum length: 128 characters
    name?: string

    // Displays user email
    // Maximum length: 128 characters
    email?: string

    // Displays user context data
    // Maximum length: 50 items
    params?: {[key: string]: string | number | boolean}
}
```
:::callout
User's `name` and `email` will be the same across all of their sessions.
:::

&nbsp;

## `track`
This method allows you to send [custom event](https://help.livesession.io/en/articles/8496404-custom-events) that your users perform along with custom properties.

**Type signture:**
```ts
function("track", event: string, properties?: EventProperties)
```
**Examples:**
:::code-group{title=""}
```js sdk
import ls from "@livesession/browser";

ls.track("User Subscribed");
```

```js window
__ls("track", "User Subscribed");
```
:::

with properties:
:::code-group{title="Track with properties"}
```js sdk
import ls from "@livesession/browser";

ls.track("User Subscribed", {
  plan_str: "premium",
  seats_int: 1,
  total_float: 255.50,
  isPatron_bool: true,
});
```

```js window
__ls("track", "User Subscribed", {
  plan_str: "premium",
  seats_int: 1,
  total_float: 255.50,
  isPatron_bool: true,
});
```
:::

without properties type suffix (not recommended):
:::code-group{title="Track with properties without suffix"}
```js sdk
import ls from "@livesession/browser";

ls.track("User Subscribed", {
  plan: "premium",
  seats: 1,
  total: 255.50,
  isPatron: true
});
```
```js window
__ls("track", "User Subscribed", {
  plan: "premium",
  seats: 1,
  total: 255.50,
  isPatron: true
});
```
:::

#### properties signature:
```ts
// Maximum length: 50 items
type EventProperties = TypedEventProperty | {[key: string]: string | number | boolean}

type TypedEventProperty =
    EventPropertyString |
    EventPropertyInt |
    EventPropertyFloat |
    EventPropertyBool
```
```ts
// String property value, eg. {plan_str: "premium"}
// Maximum length: 256 characters
type EventPropertyString = {[key: `${string}_str`]: string }

// Int property value, eg. {seats_int: 2}
// Maximum length: int max. value
type EventPropertyInt = {[key: `${string}_int`]: number }

// Float property value, eg. {total_float: 255.50}
// Maximum length: float max. value
type EventPropertyFloat = {[key: `${string}_float`]: number }

// Bool property value, eg. {isPatron_bool: true}
type EventPropertyBool = {[key: `${string}_bool`]: boolean }
````
:::code-group{title="Example usage"}
```js sdk
import ls from "@livesession/browser";

ls.track("User Subscribed", {
  plan_str: "premium",
  price: 1,
  total_float: 255.50,
  pro: true
});
```
```js window
__ls(
  "track",
  "User Subscribed", 
  { 
    plan_str: "premium",  
    price: 1, 
    total_float: 255.50, 
    pro: true 
  }
);
```
:::

&nbsp;

## `newPageView`
Start recording user's visit and add it to session when conditions fulfilled. If session doesn't exists it also create new session.

**Type signture:**
```ts
function("newPageView", options?: NewPageViewOptions)
```
**Examples:**
:::code-group{title=""}
```js sdk
import ls from "@livesession/browser";

ls.newPageView();
```

```js window
__ls("newPageView");
```
:::

with options:
:::code-group{title=""}
```js sdk
import ls from "@livesession/browser";

ls.newPageView({ title: "Anonimized page title" });
```

```js window
__ls("newPageView", { title: "Anonimized page title" });
```
:::

with conditions:
:::code-group{title="New page view with conditions"}
```js sdk
import ls from "@livesession/browser";

ls.newPageView({
  conditions: [{
      type: "event",
      name: "MouseClick",
      operator: "contain", 
      key: "path", 
      value: ".add-cart"
  }],
});
```

```js window
__ls("newPageView", {
  conditions: [{
      type: "event",
      name: "MouseClick",
      operator: "contain", 
      key: "path", 
      value: ".add-cart"
  }],
});
```
:::

with base URL:
:::code-group{title="New page view with base URL"}
```js sdk
import ls from "@livesession/browser";

ls.newPageView({
  baseURL: "https://example.com",
});

// or

ls.newPageView({
  baseURL: function(base) {
    return base
  },
});
```

```js window
__ls("newPageView", {
  baseURL: "https://example.com",
});
// or
__ls("newPageView", {
  baseURL: function(base) {
    return base
  },
});
```
:::

#### options signature:
```ts
interface NewPageViewOptions {
    // Overwrite page title
    title?: string
    // Conditions for starting new pageView
    conditions?: NewPageViewCondition[]
    // Overwrite base URL on player
    baseURL?: string | ((base: string) => string)
}
```
```ts
interface NewPageViewCondition {
  // Use to specify condition based on user interaction (event).
  type: "event";
  // Event type
  name: EventType;
  // Operator for condition
  operator: Operator;
  // Event key
  key: EventKey;
  // Event value
  value: string;
}
````
```ts
type EventType =
  | "MouseClick" // Click on element
  | "RageClick" // Click on element multiple times
  | "ErrorClick" // Click on element with error
  | "Scroll" // Scroll on page
  | "WindowScroll" // Scroll on window
  | "MouseMove" // Move mouse on page
  | "TouchMove"; // Move touch on page

type Operator =
    "start" | // base.indexOf(value) == 0
    "contain" | // base.indexOf(value) > -1
    "end" | // base.indexOf(value) == base.length - value.length
    "eq" | // base == value
    "neq" | // base !== value
    "gt" | // base > value
    "gte" | // base >= value
    "lt" | // base < value
    "lte"; // base <= value

type EventKey =
    // Full DOM path to element
    // e.g `body > #header > .link.add-cart[href="/cart"]`
    "path" |
    // Element identificator
    // `.link.add-cart[href="/cart"]`
    "el" |
    // 	Text content of element
    // e.g `Add to cart`
    "txt";
```

&nbsp;

## `setCustomParams`
Set custom properties to session.

**Type signture:**
```ts
function("setCustomParams", options: CustomParamsOptions)
```
**Examples:**
:::code-group{title=""}
```js sdk
import ls from "@livesession/browser";

ls.setCustomParams({
  params: {
    order_id: "123-abc-def",
    plan: "premium",
  },
});
```

```js window
__ls("setCustomParams", {
  params: {
    order_id: "123-abc-def",
    plan: "premium",
  },
});
```
:::
#### options signature:
```ts
type CustomParamsOptions = {
    // Maximum length: 50 items
    params: {[key: string]: string | number | boolean}
}
```

&nbsp;

## `getSessionURL`
Get URL to current session.

**Type signture:**
```ts
function("getSessionURL", callback: GetSessionURLCallback)
```
**Examples:**
:::code-group{title=""}
```js sdk
import ls from "@livesession/browser";

ls.getSessionURL(function(url, isNewSession) {
    // do only if it's a new session
  if (isNewSession) {
    YOUR_API.addSessionURL(url);
  }
});
```

```js window
__ls("getSessionURL", function(url, isNewSession) {
  // do only if it's a new session
  if (isNewSession) {
    YOUR_API.addSessionURL(url);
  }
});
```
:::

integration with other software:
:::code-group{title=""}
```ts
ls.getSessionURL(function(url, isNewSession) {
  if (isNewSession) drift.track("LiveSession recording URL", { sessionURL: url });
});
```

```ts window
__ls("getSessionURL", function(url, isNewSession) {
  if (isNewSession) drift.track("LiveSession recording URL", { sessionURL: url });
});
```
:::

#### callback signature:
```ts
type GetSessionURLCallback = (
    // https://app.livesession.io/app/session/{visitor_id}/{session_id}
    url: string,
    isNewSession: boolean
) => void
```

&nbsp;

## `setOptions`
Set options and init LiveSession tracking stript (if it's not inited).
You can find your website ID and account ID in **LiveSession -> Settings -> Websites**.

**Type signture:**
```ts
function ("setOptions", options: InitOptions)
```
**Exmaples:**
:::code-group{title=""}
```js sdk
import ls from "@livesession/browser";

ls.setOptions({ accountID: "abc", websiteID: "cdef" });
```

```js window
__ls("setOptions", { accountID: "abc", websiteID: "cdef" });
```
:::

with keystrokes:
:::code-group{title="Set options with keystrokes"}
```js sdk
import ls from "@livesession/browser";

ls.setOptions({ keystrokes: true });
```

```js window
__ls("setOptions", { keystrokes: true });
```
:::

&nbsp;

## `invalidateSession`
Close curent session.

**Type signture:**
```ts
function ("invalidateSession")
```

**Examples:**
:::code-group{title=""}
```js sdk
import ls from "@livesession/browser";

ls.invalidateSession();
```

```js window
__ls("invalidateSession");
```
:::

&nbsp;

## `debug`
Set debug logging mode.

**Type signture:**
```ts
function ("debug")
```

**Examples:**
:::code-group{title=""}
```js sdk
import ls from "@livesession/browser";

ls.debug();
```

```js window
__ls("debug");
```
:::

&nbsp;

## `log`
Standard `console.log()` statements will be recorded by LiveSession,
but you have the option to log messages without adding additional noise to your users browser consoles.

**Type signture:**
```ts
function ("log", logLevel?: LogLevel, data?: object)
```

**Examples:**
:::code-group{title=""}
```js sdk
import ls from "@livesession/browser";

ls.log("info", "demo info message");
ls.log("warn", "demo warn message");
ls.log("error", { id: 2, message: "demo error message" });
```

```js window
__ls("log", "info", "demo info message");
__ls("log", "warn", "demo warn message");
__ls("log", "error", { id: 2, message: "demo error message" });
```
:::

#### logLevel signature:
```ts
type LogLevel = "info" | "warn" | "error"  
````

&nbsp;

## `off`
Turn LiveSession script off.

**Type signture:**
```ts
function ("off")
```

**Examples:**
:::code-group{title=""}
```js sdk
import ls from "@livesession/browser";

ls.off();
```

```js window
__ls("off");
```
:::

