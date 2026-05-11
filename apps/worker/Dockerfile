FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/worker/package.json apps/worker/

RUN pnpm install --frozen-lockfile --prod=false

COPY packages/shared/ packages/shared/
COPY apps/worker/ apps/worker/
COPY tsconfig.base.json ./

RUN pnpm --filter @ornava/shared exec tsc --build

CMD ["npx", "tsx", "apps/worker/src/index.ts"]
