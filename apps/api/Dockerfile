# =========================================
# Stage 1: Builder
# Build context must be the MONOREPO ROOT
# docker build -f apps/api/Dockerfile .
# =========================================
FROM node:20-slim AS builder

WORKDIR /app

# Install build tools for native modules (bcrypt, sharp)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package manifests first for better layer caching
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/crypto/package.json ./packages/crypto/
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/

# Install all workspace dependencies
RUN npm ci

# Copy all source code
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Generate Prisma client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build shared packages first
RUN npm run build -w packages/shared
RUN npm run build -w packages/crypto
RUN npm run build -w packages/database

# Build NestJS API
WORKDIR /app/apps/api
RUN npx nest build

# =========================================
# Stage 2: Runner (lean production image)
# Uses Debian-slim — required for Prisma's
# debian-openssl-3.0.x query engine binary.
# Alpine (musl) is NOT compatible with the
# glibc-based Prisma binaries.
# =========================================
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# dumb-init for proper signal handling in containers
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && rm -rf /var/lib/apt/lists/*

# Create uploads directory (required by ServeStaticModule)
RUN mkdir -p /app/apps/api/uploads

# Copy production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy all packages from builder — this includes dist/, package.json,
# AND any package-level node_modules/ (e.g. @noble/ed25519 in packages/crypto)
# that npm did not hoist to the root node_modules.
COPY --from=builder /app/packages ./packages

# Copy API dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Cloud Run listens on PORT env var (default 8080, we use 4000)
EXPOSE 4000

WORKDIR /app/apps/api

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
