# client-api

[Client API](#TODO) was designed to use xyd APIs in the browser environment
letting to customize the engine behaviour on the end. 
Useful for plugin or xyd framework users.

## Examples

```tsx
import { useAccessControl } from "@xyd-js/client-api"

export default function MyCustomLoginPage() {
    const {signInWithOAuth} = useAccessControl();
    
    // do stuff with `signInWithOAuth`
    // return ..
}
```