FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Install deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile

# Build shared
COPY packages/shared/ packages/shared/
COPY tsconfig.base.json ./
RUN pnpm --filter @ornava/shared exec tsc --build

# Build web
COPY apps/web/ apps/web/
RUN pnpm --filter @ornava/web exec next build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=base /app/apps/web/.next/standalone ./
COPY --from=base /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=base /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
