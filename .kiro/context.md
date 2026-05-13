# Ornava Project Context

## What Is Ornava
AI-powered jewelry catalog image generator for Indian jewelers/wholesalers who sell through WhatsApp. Upload a raw jewelry photo → select jewelry type → choose model/pose preset → pick background → generate catalog-ready image → download/share to WhatsApp.

## Production
- **Domain:** `http://ornava.sarafa-bazar.com` (HTTP only — no HTTPS yet)
- **EC2:** `43.205.94.243` (t3.small, ap-south-1) — SSH: `ssh -i infra/ornava-ec2-key ubuntu@43.205.94.243`
- **DB:** Supabase Postgres (pooler) — production. Local dev uses Docker Postgres on `:55432`.
- **Storage:** Cloudflare R2 (originals, generated, thumbnails buckets)
- **Queue:** Upstash Redis (TLS)
- **Image provider:** Fal.ai via `ornava-default-v1` route → `openai/gpt-image-2/edit`

## Tech Stack
- Monorepo (pnpm workspaces): `apps/web`, `apps/worker`, `packages/shared`
- Web: Next.js 15, React 19, NextAuth 4
- Worker: Node.js + BullMQ + tsx (no compiled dist in production — runs TS directly)
- 4 prod containers: `ornava-web`, `ornava-worker-1`, `ornava-worker-2`, `ornava-nginx` (+ certbot sidecar)

## Architecture v0.2 (Async Webhook)
- **20 parallel slots:** 2 worker replicas × concurrency 10 (was 2 in v0.1)
- **Async submission:** worker uses `fal.queue.submit({ webhookUrl })`, releases slot in ~2s instead of waiting 25s
- **Webhook handler:** `POST /api/webhooks/fal` — verifies Fal's ED25519+JWKS signature (fetches from `https://rest.fal.ai/.well-known/jwks.json`, caches 24h), downloads output, stores in R2, marks complete idempotently
- **Reaper:** runs in worker every 30s; for jobs >60s old in `processing` with `provider_job_id`, polls Fal status and recovers if webhook was missed; force-fails after 5 min
- **Sync fallback:** if `WEBHOOK_BASE_URL` is unset, worker uses old `fal.subscribe()` blocking path
- **Capacity:** ~500 concurrent users at 90s SLA (was ~50 with sync mode)

## Key Files (Code)
- `apps/web/app/admin/page.tsx` — desktop admin dashboard (KPIs, users table, feedback)
- `apps/web/app/admin/generations/page.tsx` — generation grid with original+generated thumbnails
- `apps/web/app/admin/layout.tsx` — sidebar nav, admin email check
- `apps/web/app/api/webhooks/fal/route.ts` — Fal webhook handler with ED25519 verification
- `apps/web/src/lib/fal-webhook-verify.ts` — JWKS fetch + ED25519 verify (Node's built-in crypto)
- `apps/web/app/api/generations/[id]/download/route.ts` — same-origin image download proxy (used for share + Save button to avoid R2 CORS)
- `apps/web/src/components/ResultView.tsx` — before/after slider + feedback + Web Share API Level 2 with file attachment + URL fallback
- `apps/worker/src/queue.ts` — BullMQ worker, branches sync vs async on `WEBHOOK_BASE_URL`
- `apps/worker/src/reaper.ts` — stuck-job recovery (only runs in async mode)
- `apps/worker/src/adapters/fal-image-edit.ts` — has both `submit()` (sync) and `submitAsync()` (webhook)
- `packages/shared/src/image-model.ts` — `ImageModelAdapter` interface with optional `submitAsync()`

## Docs (in repo root + Obsidian vault)
- `system_design_phase1_v0_2.md` — current state (replaces v0.1)
- `system_design_phase1_v0_1.md` — kept as historical
- `adr_001_model_portability.md`
- `adr_002_async_webhook_architecture.md` — webhook decision, alternatives, non-negotiables, acceptance tests
- `phase1_prd_slice.md` — Phase 1 user stories, acceptance criteria
- `phase1_engineering_backlog.md` — 22 tickets, most done

## Auth
- **Dev credentials** (`dev@example.com` / `DEV_AUTH_CODE`) — disabled in production by default. Can be re-enabled with `ALLOW_DEV_AUTH_IN_PROD=true` env var (admin bootstrap only).
- **Google OAuth** — primary in production. Redirect URIs in Google Cloud Console must include both `http://` and `https://` versions of `ornava.sarafa-bazar.com/api/auth/callback/google`.
- **Admin access:** `ADMIN_EMAILS` env var (comma-separated). Admin pages call `notFound()` for non-admins (not redirect — prevents disclosure).
  - Production currently has: `dev@example.com,aryansoni2105@gmail.com`

## Implementation Status

### Done (Phase 1)
- Auth (dev + Google) + route protection
- Invite codes system + credits (default 5 per new user)
- Upload pipeline (signed URLs, client compression, R2 direct upload + proxy fallback)
- Model registry + fal adapter (sync + async webhook modes)
- Generation pipeline (queue, worker, async submit, webhook complete, reaper)
- BriefPanel — zero-typing guided generation flow
- Result view — before/after comparison slider + feedback + download + share
- Admin dashboard `/admin` — KPIs, users table, feedback breakdown
- Admin debug `/admin/generations` — generation grid with image thumbnails
- Profile page with credit balance + generation history
- EC2 deployment + GitHub Actions CI/CD (sometimes flaky — manual deploy via SSH + docker compose works)

### Known Issues / In Progress
- **WhatsApp share** — On mobile, file attachment via Web Share API works inconsistently. Current state: tier-1 file share, tier-2 URL share with WhatsApp preview, tier-3 wa.me link. Diagnostic logs in browser console with `[share]` prefix.
- **Production HTTPS** — Not set up. Domain points to EC2 but no cert via certbot yet. Webhooks work over HTTP but should be HTTPS for production hygiene.
- **GitHub Actions deploy** — Sometimes doesn't trigger or fails. Workaround: manual SSH + `git pull` + `docker compose down/build/up`.

### Not Done
- PostHog event tracking (env vars defined, no instrumentation code)
- Sentry wiring (worker + web)
- Worker alerts (queue depth, failure spike, webhook signature failure rate)
- Multi-image upload / batch processing (Phase 2 — explicitly out of scope)
- Catalog builder (Phase 2)
- Billing / Razorpay (deferred until activation proven)

## Critical Env Vars

### Production (`.env.production` on EC2)
```
NEXTAUTH_URL=http://ornava.sarafa-bazar.com
NEXTAUTH_SECRET=<rotate this — was leaked in chat>
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=<rotate this — was leaked in chat>
ADMIN_EMAILS=dev@example.com,aryansoni2105@gmail.com  # MUST appear only ONCE — duplicates = last-wins
WEBHOOK_BASE_URL=http://ornava.sarafa-bazar.com  # Async mode trigger
DATABASE_URL=postgresql://...supabase.com:6543/postgres
REDIS_URL=rediss://...upstash.io:6379
R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
R2_ORIGINALS_BUCKET=ornava-originals
R2_GENERATED_BUCKET=ornava-generated
FAL_KEY=...
```
**Note:** `FAL_WEBHOOK_SECRET` is in env schema but NOT used (Fal signs with their own ED25519 keys, not a shared secret).

### Local (`apps/web/.env.local` + root `.env`)
- Both files used: web reads `.env.local`, worker reads root `.env`
- Local DB is Docker Postgres on `localhost:55432` — different from prod Supabase
- For async mode locally, need ngrok: `ngrok http 3000` then set `WEBHOOK_BASE_URL=https://xxx.ngrok-free.dev` in both files

## Deploy Commands

### Manual Deploy (when GHA fails)
```bash
ssh -i infra/ornava-ec2-key ubuntu@43.205.94.243 '
  cd ~/ornava &&
  git pull origin main &&
  docker compose -f docker-compose.production.yml down &&
  docker compose -f docker-compose.production.yml build &&
  docker compose -f docker-compose.production.yml up -d &&
  docker ps
'
```

### Restart only web (after env change)
```bash
docker compose -f docker-compose.production.yml up -d --force-recreate web
```

### Check logs
```bash
docker logs -f ornava-worker-1   # See "[reaper] started" if async mode active
docker logs -f ornava-web
```

## Recent Pitfalls (Lessons Learned)
1. **Two databases confusion** — root `.env` had local Docker URL, `apps/web/.env.local` had Supabase URL. Worker and web were hitting different DBs. Now production uses Supabase, local uses Docker.
2. **Duplicate env var lines** — running `echo "X=y" >> .env.production` twice creates duplicates; dotenv last-wins silently. Always check `grep -c "^X=" .env.production`.
3. **HMAC vs Fal's actual scheme** — first webhook implementation assumed simple HMAC. Fal actually uses ED25519+JWKS. Reaper saved the day during the broken-signature window.
4. **R2 CORS blocking browser fetch** — Direct R2 signed URLs can be loaded as `<img src>` but `fetch()` is blocked. Solution: same-origin proxy at `/api/generations/<id>/download`.
5. **Orphan containers** — Renaming `worker` → `worker-1`/`worker-2` left old `ornava-worker` running with old code. Always `docker ps` after rename and `docker rm -f` orphans.
6. **`server.log` was being committed** — added to `.gitignore`. Also `infra/ornava-ec2-key` (private SSH key) is gitignored — never commit `infra/`.

## Next Likely Work (PM Priority)
1. Get HTTPS working on production (certbot already wired in compose, just needs domain validation step)
2. PostHog instrumentation for activation funnel
3. Recruit 5-10 real beta users → see what they actually ask for before building more features
4. Sentry for prod errors (especially webhook signature failures and worker exceptions)

## Tomorrow's Agenda (set 2026-05-13 evening, do 2026-05-14)

**Priority order — pick based on time available:**

### High value (do these first)
1. **HTTPS on production** (~1 hr)
   - Domain `ornava.sarafa-bazar.com` already points to EC2
   - Certbot container already in `docker-compose.production.yml`
   - Need to: trigger initial cert issuance, update nginx.conf to use cert, switch `NEXTAUTH_URL` and `WEBHOOK_BASE_URL` to `https://`
   - Update Google OAuth redirect URI in Cloud Console to https variant
2. **Sentry wiring** (~30 min)
   - Add `@sentry/nextjs` to web and `@sentry/node` to worker
   - Init with `SENTRY_DSN` env var (already in env schema)
   - Especially want to catch: webhook signature failures, worker exceptions, Fal.ai 5xx
3. **Rotate leaked secrets** (~10 min)
   - `GOOGLE_CLIENT_SECRET` — regenerate in Google Cloud Console
   - `NEXTAUTH_SECRET` — `openssl rand -hex 32` and replace in `.env.production`
   - Restart web after each

### Medium value
4. **PostHog event tracking** (~2 hr)
   - Install `posthog-js` (web) and `posthog-node` (worker for server-side events)
   - Instrument the funnel from PRD §7: `auth_completed`, `upload_completed`, `generation_requested`, `generation_completed`, `result_viewed`, `feedback_submitted`, `download_clicked`, `share_clicked`
   - Server-side events from worker (truth events) + client-side from web (UI events)
5. **Fix flaky GitHub Actions deploy** (~30 min)
   - Action runs but sometimes doesn't trigger on push, or fails to SSH
   - Check `.github/workflows/deploy.yml` for issues
   - Worth fixing — manual deploy is friction

### Discovery (no code)
6. **Recruit 2-3 real beta users** (varies)
   - The activation loop is built — need real feedback before building more
   - Have them generate on real jewelry photos, watch what fails
   - One real session reshapes priorities more than a week of guessing

### Skip tomorrow (premature)
- Multi-image upload — no signal it's needed
- Catalog builder, billing — Phase 2
- Further polish on WhatsApp share — tier-2 URL fallback is acceptable
- More admin features — nice-to-have, not blocking activation

**Recommended sequence if I only have 2 hours: HTTPS + Sentry + rotate secrets.**
**If I have a half-day: HTTPS + recruit 2 beta users + watch them use it. The feedback will reshape priorities.**

## Persona Reminder (from PRD)
**Jaya** — WhatsApp-first Indian jewelry seller, mobile-only, won't write prompts, needs zero-typing UX, will reject any output that changes stones/shape/finish. Phone-first, intermittent 4G, low setup tolerance.
