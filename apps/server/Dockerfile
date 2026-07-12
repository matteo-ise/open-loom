FROM node:20-alpine

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10 --activate

COPY package.json pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy app source
COPY apps/server apps/server/

WORKDIR /app/apps/server

# Expose port
EXPOSE 3000

CMD ["pnpm", "tsx", "src/index.ts"]
