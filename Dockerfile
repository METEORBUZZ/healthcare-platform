# ==========================================
# Stage 1: Build
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests for layer caching
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/

# Install all dependencies (including devDependencies required for compilation)
RUN npm ci --include=optional

# Copy application source code and configuration
COPY . .

# Build API (tsup) and Web (vite build)
RUN npm run build


# ==========================================
# Stage 2: Production
# ==========================================
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy workspace package manifests
COPY package*.json ./
COPY apps ./apps
COPY packages ./packages

# Install only production dependencies
RUN npm ci --omit=dev --include=optional \
    && npm cache clean --force

# Copy built production artifacts from the builder stage
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/web/dist ./apps/web/dist

# Copy container entrypoint script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
