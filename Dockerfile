# Use Node.js 20 base image
FROM node:20

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory
WORKDIR /app

# Copy the repository or script into the container
COPY . .

# Force install Rollup for ARM64 compatibility
RUN pnpm install --platform=linux-arm64 @rollup/rollup

# Build the @xyd-js/atlas package first TODO: in the future better solution
RUN pnpm --filter @xyd-js/atlas run build

# Install dependencies and build the project
RUN pnpm install && pnpm run build

# Navigate to the CLI package and install it globally
WORKDIR /app/packages/xyd-cli
RUN npm install -g .

# Set the default working directory for the CLI
WORKDIR /app/packages/xyd-documan-example

# Default command to run your CLI
CMD ["xyd", "."]