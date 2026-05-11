# Ornava Project Context

## What Is Ornava
AI-powered jewelry catalog image generator for Indian jewelers/wholesalers who sell through WhatsApp. Upload a raw jewelry photo → select jewelry type → choose model/pose preset → pick background → generate catalog-ready image → download/share to WhatsApp.

## Tech Stack
- Monorepo (pnpm workspaces): `apps/web`, `apps/worker`, `packages/shared`
- Web: Next.js 15, React 19, NextAuth 4, Tailwind CSS
- Worker: Node.js + BullMQ, fal.ai adapter for `openai/gpt-image-2/edit`
- DB: PostgreSQL (local Docker, port 55432)
- Queue: Redis + BullMQ
- Storage: Cloudflare R2 (private buckets: ornava-originals, ornava-generated, ornava-thumbnails)
- Analytics: PostHog (planned), Sentry (planned)
- Auth: Dev credentials (dev@example.com / 123456) + optional Google OAuth

## Local Dev
```bash
pnpm install && pnpm infra:up && pnpm db:migrate
pnpm --dir apps/web exec next dev --hostname 127.0.0.1 --port 3002
pnpm --filter @ornava/worker dev
# Open http://localhost:3002/login
```

## Architecture
- Model portability: product code calls `ornava-default-v1`, provider details behind adapter + registry
- ADR-001: No UI/API code references provider model IDs directly
- Generation flow: Upload → R2 → Create generation row → BullMQ queue → Worker (read R2 → upload to fal → call model → download output → write to R2) → Poll status → Result view

## Key Design Decisions
- Zero-typing UX: No prompts. Users select jewelry type, pose preset, background, aspect ratio
- Mobile-first (390×844px), WhatsApp-native sharing
- Fidelity over beauty: preserve stones, shape, finish, proportions
- Beta generation policy: max 1600px edge input, JPEG, 0.86 quality, fal medium quality

## Implementation Status (May 11, 2026)

### Fully Implemented (Phase 1 complete):
- Auth (dev + Google), route protection, user upsert
- Upload pipeline (signed URLs, client compression, R2 direct upload)
- Model registry + fal adapter + prompt templates (guided-v2)
- Generation pipeline (queue, worker, state machine, retry)
- Result view (comparison, feedback, download, share)
- Admin debug view (/admin/generations)
- Shared types (modes, jewelry types, presets, brief structure)
- Database: 3 migrations (initial, email normalization, generation_brief JSONB)

### v0.2 In Progress:
- BriefPanel.tsx + /brief page (zero-typing guided generation)
- Full preset taxonomy (pose presets per jewelry type, backgrounds, aspect ratios)
- Guided prompt builder using brief metadata

### Not Yet Done:
- PostHog event tracking (env vars defined, no code)
- Sentry wiring
- Worker alerts (queue depth, failure spike)
- Credit/quota accounting
- Batch processing, catalog builder, billing (deferred)

## File Structure Highlights
- `apps/web/src/lib/db.ts` — full data access layer
- `apps/web/src/lib/env.ts` — environment validation
- `apps/web/src/components/BriefPanel.tsx` — zero-typing UI
- `apps/web/src/components/ResultView.tsx` — result + feedback
- `apps/web/src/components/UploadPanel.tsx` — upload UI
- `apps/web/src/components/GenerationPanel.tsx` — generating state
- `apps/worker/src/queue.ts` — BullMQ worker logic
- `apps/worker/src/adapters/fal-image-edit.ts` — fal provider adapter
- `apps/worker/src/prompts.ts` — prompt builder
- `apps/worker/src/model-registry.ts` — model route resolution
- `packages/shared/src/types.ts` — all shared enums/types
- `packages/shared/src/generation-brief.ts` — preset taxonomy

## Obsidian Docs (in /Users/aryansoni/Documents/Obsidian Vault/Ornava/)
- Ornava PRD.md (full product requirements)
- Phase 1 PRD Slice.md (MVP scope, user stories, acceptance criteria)
- System Design - Phase 1 v0.1.md (architecture, data model, API surface)
- ADR-001 - Model-Portability Architecture.md
- Phase 1 Engineering Backlog.md (22 tickets, 9 epics)
- Phase 1 Model Evaluation Plan.md (rubric, test set, promotion criteria)
- Implementation Status and Startup.md (runbook)
- Market Relevance Check.md (competitors, positioning)
- Ornava Business DNA.md (thesis, JTBD, positioning)
- Design/Phase 1 v0.1 Fresh Mobile Flow.md
- Design/Guided Generation Brief v0.2 - Mobile and Web Design Brief.md
- Strategy/Guided Generation Brief v0.2 - Zero Typing PRD.md

## Product Skills Available (.agents/skills/)
48 PM skills including: discovery-process, jobs-to-be-done, proto-persona, problem-statement, prd-development, user-story, roadmap-planning, positioning-statement, tam-sam-som-calculator, product-strategy-session, prioritization-advisor, and more.

## Key Metrics
- Primary activation: first usable generation within 90 seconds of signup
- Beta targets: ≥70% complete first gen, ≥60% first-output usable rate
- North star candidate: weekly share-ready catalog images by active jewelers
