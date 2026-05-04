FROM node:22-slim

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    libnss3 libnspr4 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libatspi2.0-0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 \
    libcairo2 libasound2 git curl \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /xyd

# Copy monorepo (including pre-built dist/ from host — requires `pnpm run build` before docker build)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json lerna.json ./
COPY .changeset .changeset
COPY release.js set-latest-tags.js ./
COPY packages packages
COPY __tests__ __tests__
COPY playwright.config.ts ./
COPY apps/apidocs-demo apps/apidocs-demo

# Install dependencies
RUN pnpm install --no-frozen-lockfile

RUN test -f packages/xyd-cli/dist/index.js && echo "CLI built OK"

# Install Playwright Chromium
RUN pnpm exec playwright install chromium

CMD ["pnpm", "run", "test:e2e"]