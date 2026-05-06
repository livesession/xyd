FROM node:22-bookworm

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.10.0 --activate

# Install bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Install Playwright system dependencies + browser
RUN npx playwright install-deps chromium && npx playwright install chromium

# Install global tools
RUN npm install -g verdaccio serve

# Create Verdaccio config
RUN mkdir -p /root/.config/verdaccio
COPY __tests__/docker/verdaccio-config.yaml /root/.config/verdaccio/config.yaml

WORKDIR /app

ENTRYPOINT ["/app/__tests__/docker/entrypoint.sh"]