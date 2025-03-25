## Commands
### Dev

Start packages development mode
```
XYD_DEV_MODE=1 XYD_DEV_CLI_NOINSTALL=1 pnpm run dev
```

Build CLI in dev mode
```
XYD_DEV_MODE=1 pnpm run build
```

### Release process

```
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

## Dev flags

```
XYD_DEV_MODE=1 - Enable dev mode

XYD_DEV_CLI_NOINSTALL=1 - Skip CLI packages installation after a build
```