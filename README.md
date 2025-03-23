# xyd

## Introduction
XYD is a framework for building ambitious docs easier for everyone. </br></br> Meet XYD's principles:

- **Developer Eperience** - designed to be easy to use, with a focus on developer experience. Just put content files and XYD will do the rest.

- **Customization** - customize every part of your documentation. From the layout, to the colors, to the custom logic.

- **Built-in Standards** - content management, components, integrations and much more are built-in with a seamless API you can access.

- **Ecosystem** - modern documentations are more than just a collection of pages. They are a living ecosystem of content, tools, and integrations.


## Links
* [Storybook](https://sb.xyd.dev) - collection of built-in components.

## Commands
run changeset
```
changeset
```

changeset version update
```
changeset version
```

changeset pre version
```
changeset pre enter <RELEASE>
```

changeset publish
```
pnpm changeset publish --otp=<OTP_CODE>
```

deprecate package
```
pnpm deprecate <PACKAGE> "<MESSAGE>"
```

mark package version as latest
```
npm dist-tag add <PACKAGE>@<VERSION> latest
```