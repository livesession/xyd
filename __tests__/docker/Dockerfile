FROM node:22-bookworm

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.10.0 --activate

# Install bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Install Playwright system dependencies (Chromium)
RUN npx playwright install-deps chromium

# Install Verdaccio globally
RUN npm install -g verdaccio

# Install serve (for static build serving in tests)
RUN npm install -g serve

# Create Verdaccio config
RUN mkdir -p /root/.config/verdaccio
COPY __tests__/docker/verdaccio-config.yaml /root/.config/verdaccio/config.yaml

# Set working directory
WORKDIR /app

# Copy package manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml lerna.json .changeset/ ./
COPY .xyd/host/ ./.xyd/host/

# Copy all package.json files (for dependency resolution)
COPY packages/ ./packages/
COPY apps/ ./apps/

# Install dependencies
RUN pnpm install --shamefully-hoist

# Copy remaining source files
COPY . .

# Build all packages
RUN pnpm run build

# Install Playwright browsers
RUN npx playwright install chromium

# Entry point
ENTRYPOINT ["/app/__tests__/docker/entrypoint.sh"]