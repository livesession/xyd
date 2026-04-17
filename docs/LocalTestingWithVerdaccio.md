# Local Testing with Verdaccio

Private npm registry proxy for testing packages locally.

## Setup

```bash
verdaccio  # localhost:4873
```

## Publish

```bash
npm_config_registry=http://localhost:4873 pnpm changeset publish
```

## Install

```bash
npm i -g xyd-js --registry http://localhost:4873
```

## Clear

```bash
./clear-verdaccio.sh
```
