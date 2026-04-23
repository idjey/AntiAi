# =========================================
# Stage 1: Builder
# Build context must be the MONOREPO ROOT
# docker build -f apps/api/Dockerfile .
# =========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build deps for native modules (bcrypt, sharp)
RUN apk add --no-cache python3 make g++

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
# =========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install production-only native deps
RUN apk add --no-cache dumb-init

# Copy production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy built packages
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/crypto/dist ./packages/crypto/dist
COPY --from=builder /app/packages/crypto/package.json ./packages/crypto/package.json
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json

# Copy Prisma schema and generated client
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma

# Copy API dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Cloud Run listens on PORT env var (default 8080, we use 4000)
EXPOSE 4000

WORKDIR /app/apps/api

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
