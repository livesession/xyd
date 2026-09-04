
# Code-First Settings

## Concept:

Example:
```tsx
import {Banner, Footer}

export default {
    theme: {
        "name": "opener",
    },
    components: {
        banner: <Banner/> // or a custom one,
        footer: <Footer>
    },
    navigation: {
        segments: <Segments>
                <Segments.Route path="reference">
                      <Navigation.Page title="Core" path="eference/core"/>
                </Segments>
            <Segments>
        </Segments>,
        sidebar: <Sidebar>
            <Sidebar.Route path="guides">
                <Navigation.Page path="introduction"/>
                <Navigation.Page path="quickstart" />
            </Sidebar.Route>
        </Sidebar>
    }
}
```

We can import local too:
```tsx
import {MyNavigation} from "./.docs/settings/navigation/MyNavigation"
export default {
    ...
    navigation: MyNavigation
}
```

We can have a complex logic to build settings:
```tsx
import {MyNavigation} from "./.docs/settings/navigation/MyNavigation"
export default {
    ...
    navigation: {
        segments: <Segments>
                <Segments.Route path="reference">
                      <Navigation.Page title="Core" path="eference/core"/>
                </Segments>
            <Segments>
        </Segments>,
        sidebar: <Sidebar>
            <Sidebar.Route path="guides">
                <Navigation.Page path="introduction"/>
                {process.env.MY_ENV === "is_truthy" && <Navigation.Page path="quickstart" />}
            </Sidebar.Route>
        </Sidebar>
    }
}
```

Custom renderer navigation function
```tsx
import {MyNavigation} from "./.docs/settings/navigation/MyNavigation"
export default {
    ...
    navigation: {
        ...
        // then it cannot be detected on compile-time - but write aa TODO to think about if its able to fix that and being able to detect on compil time
        sidebar: () => {
            const abc = currentUser()

            <Sidebar>
            <Sidebar.Route path="guides">
                <Navigation.Page path="introduction"/>
                {abc?.email && <Navigation.Page path="quickstart" />}
            </Sidebar.Route>
        </Sidebar>
        }
    }
}
```

Also allow for composing:
```tsx
export default composeSettings({
     sidebar: () => {
            const abc = currentUser()

            <Sidebar>
            <Sidebar.Route path="guides">
                {abc?.email && <Navigation.Page path="quickstart" />}
            </Sidebar.Route>
        </Sidebar>
        }
})
```
* composing means we can have settings.json or a compile-time code first settings BUT join with our custom logic

## Requirements
**Compile-time build**: a settings must be able to build on compile-time. What it means? The output of a code-first settings must be has reachable structure because in the future where we'll build a xyd CMS and user will be able to mix a code-first and used via WYSIWYG so it means the output must be compiled cuz thanks to that we'll be able to show visual output results of navigiation etc.

**HMR**: if we change a settings or modules that are imported insde a code sttings HMR is trigered.