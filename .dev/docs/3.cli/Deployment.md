# Deployment

## Build

`xyd build` → `.xyd/build/client/`

## Hosting

### Netlify
```toml
[build]
command = "xyd build"
publish = ".xyd/build/client"
```

### Vercel
```json
{ "buildCommand": "xyd build", "outputDirectory": ".xyd/build/client" }
```

## Node.js Support

22.12.0+ required. Tested on 22, 23, 24.
