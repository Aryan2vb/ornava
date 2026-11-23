# Single-container image for Render's free web service: runs the Next.js web
# app and the BullMQ generation worker side by side (Render's free tier has no
# background workers). To split them later, deploy apps/web/Dockerfile and
# apps/worker/Dockerfile as separate services instead.
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
COPY apps/worker/package.json apps/worker/
RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY packages/shared/ packages/shared/
RUN pnpm --filter @ornava/shared exec tsc --build --force

COPY apps/web/ apps/web/
COPY apps/worker/ apps/worker/

# NEXT_PUBLIC_* values are inlined into the browser bundle at build time.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
RUN pnpm --filter @ornava/web exec next build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache fontconfig ttf-dejavu ttf-liberation font-noto

# Worker: runs from source with tsx, so it needs its node_modules and the shared build.
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/shared ./packages/shared
COPY --from=base /app/apps/worker ./apps/worker

# Web: Next.js standalone server.
COPY --from=base /app/apps/web/.next/standalone ./web
COPY --from=base /app/apps/web/.next/static ./web/apps/web/.next/static
COPY --from=base /app/apps/web/public ./web/apps/web/public

COPY deploy/start.sh ./start.sh
RUN chmod +x ./start.sh

USER node
EXPOSE 3000
CMD ["./start.sh"]
