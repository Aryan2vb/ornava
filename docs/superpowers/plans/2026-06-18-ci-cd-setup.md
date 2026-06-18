# CI/CD Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reliable GitHub Actions CI for pull requests and safer main-branch deployment to the existing EC2 Docker Compose environment.

**Architecture:** Keep deployment provider assumptions aligned with the existing repo: EC2 pulls `main` and runs `docker compose -f docker-compose.production.yml`. CI installs with pnpm 11 on Node 22, builds the shared workspace package before app tests, then runs typecheck, lint, tests, and production builds.

**Tech Stack:** GitHub Actions, pnpm 11.0.9, Node.js 22, Next.js, TypeScript, Docker Compose, appleboy/ssh-action.

---

### Task 1: Root CI Scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add a test script that prepares shared package output**

Update `scripts` in `package.json` so CI can run one command for all package tests:

```json
{
  "build": "pnpm -r build",
  "typecheck": "pnpm -r typecheck",
  "lint": "pnpm -r lint",
  "test": "pnpm --filter @ornava/shared build && pnpm --filter @ornava/web test && pnpm --filter @ornava/worker test"
}
```

- [ ] **Step 2: Verify the command runs tests instead of failing on missing shared dist**

Run: `pnpm test`

Expected: web and worker test suites start after `@ornava/shared` builds.

### Task 2: GitHub Actions Workflow

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Rename workflow and expand triggers**

Set workflow name to `CI/CD`, run CI on pull requests to `main`, pushes to `main`, and manual dispatch.

- [ ] **Step 2: Use repo package manager and Node version**

Use `pnpm/action-setup@v4` with `version: 11.0.9`, `actions/setup-node@v4` with `node-version: 22`, and `cache: pnpm`.

- [ ] **Step 3: Run the full validation suite**

In the `ci` job, run:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
NEXTAUTH_SECRET=ci-build-placeholder AUTH_SECRET=ci-build-placeholder pnpm build
```

- [ ] **Step 4: Keep EC2 deploy gated to main**

Make the `deploy` job depend on `ci` and run only when `github.ref == 'refs/heads/main'`. Keep the existing EC2 secret contract:

```text
EC2_HOST
EC2_USER
EC2_SSH_KEY
```

### Task 3: Verification

**Files:**
- Read: `.github/workflows/deploy.yml`
- Read: `package.json`

- [ ] **Step 1: Validate local scripts**

Run: `pnpm lint`

Expected: exits 0.

Run: `pnpm typecheck`

Expected: exits 0.

Run: `pnpm test`

Expected: exits 0.

Run: `NEXTAUTH_SECRET=ci-build-placeholder AUTH_SECRET=ci-build-placeholder pnpm build`

Expected: exits 0.

- [ ] **Step 2: Inspect final diff**

Run: `git diff -- package.json .github/workflows/deploy.yml docs/superpowers/plans/2026-06-18-ci-cd-setup.md`

Expected: only the planned script, workflow, and plan file changes appear.
