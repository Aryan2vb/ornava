# Ornava Phase 1 Engineering Backlog

Status: Draft  
Date: 2026-05-10  
Related: `phase1_prd_slice.md`, `system_design_phase1_v0_1.md`, `adr_001_model_portability.md`

## Goal

Ship the narrow Phase 1 activation loop: a beta seller signs in on mobile, uploads a jewelry photo, generates one catalog-ready image, reviews fidelity, submits feedback, and downloads or shares the result.

## Build Defaults

- Auth: one reliable beta path first; recommended default is phone OTP, with Google optional if low effort.
- Upload: accept JPG/PNG up to 20MB, then client/server compress working copy to 2048px long edge.
- Storage: private Cloudflare R2 buckets with signed URLs.
- Generation: queue-backed worker using model registry and provider adapter.
- Output: default 4:5 or 1:1 export under 2MB for mobile sharing.
- Analytics: PostHog event taxonomy before first beta user.
- Monitoring: Sentry in web/API/worker from the start.

## Epic 1: App Foundation

### ENG-001: Scaffold Web App

- Create Next.js app structure.
- Add mobile-first app shell.
- Add routes for onboarding, upload, generating, result, and dashboard placeholder.
- Add environment variable validation.

Acceptance:

- App runs locally.
- Mobile viewport renders without horizontal overflow.
- Missing required env vars fail fast in non-production.

### ENG-002: Add Shared Types Package

- Define shared enums for generation mode, job status, feedback rating, and feedback reason.
- Define shared request/response contracts for generation APIs.

Acceptance:

- Web, API routes, and worker import shared types.
- No duplicate string literals for core statuses.

## Epic 2: Auth And User Session

### ENG-003: Implement Phase 1 Auth Path

- Implement selected beta auth path.
- Create or retrieve user on first login.
- Track `auth_completed`.

Acceptance:

- New user can sign in on mobile.
- Existing user returns to active session.
- Failed auth shows retryable user-safe error.

### ENG-004: Protect Phase 1 Routes

- Require session for upload, generation, feedback, and download endpoints.
- Redirect unauthenticated users to sign-in.

Acceptance:

- Unauthorized API calls return 401.
- Users cannot access another user's images or generations.

## Epic 3: Database

### ENG-005: Create Initial Schema

- Create migrations for `users`, `images`, `generations`, `generation_feedback`, and optional local `events`.
- Include model portability fields on `generations`.

Acceptance:

- Migrations run cleanly on local and staging.
- `generations` includes `model_route`, `provider`, `provider_model_id`, `provider_job_id`, `adapter_version`, and `prompt_template_version`.

### ENG-006: Add Data Access Layer

- Add typed database functions for image creation, upload completion, generation creation, status updates, and feedback.

Acceptance:

- Worker and API routes do not write raw SQL inline outside the data layer unless project convention requires it.

## Epic 4: Upload Pipeline

### ENG-007: Create R2 Private Buckets

- Configure private buckets for originals, generated outputs, and thumbnails/working images.
- Add local/staging env vars.

Acceptance:

- Buckets are not publicly listable.
- Signed upload and read URLs work.

### ENG-008: Implement Signed Upload

- `POST /api/uploads/init` creates image record and signed upload URL.
- Client uploads directly to R2.
- `POST /api/uploads/complete` marks upload complete.

Acceptance:

- Valid JPG/PNG upload reaches R2.
- API server does not proxy raw image bytes.
- `upload_completed` is tracked server-side.

### ENG-009: Validate And Compress Images

- Client validates file type and size.
- Generate or store a compressed working image capped at 2048px long edge.
- Preserve original for beta debugging.

Acceptance:

- Oversized/unsupported files show specific error.
- Working copy is within model registry input limits.

## Epic 5: Model Portability

### ENG-010: Implement Image Model Registry

- Add `imageModelRegistry`.
- Add global, mode, beta cohort, and admin override resolution points.

Acceptance:

- Generation creation stores selected `model_route`.
- No product flow references raw provider model IDs.

### ENG-011: Implement Adapter Interface

- Add `ImageModelAdapter` contract.
- Add normalized error type.
- Add first adapter for selected provider/model.

Acceptance:

- Worker calls adapter through the interface.
- Provider errors normalize into stable failure codes.

### ENG-012: Add Prompt Template Registry

- Store prompt templates by version and mode.
- Include fidelity instructions and output requirements.

Acceptance:

- Each generation stores `prompt_template_version`.
- Prompt changes can be tested without editing worker flow.

## Epic 6: Generation Pipeline

### ENG-013: Add Redis Queue And Worker

- Add BullMQ queue.
- Add worker service.
- Implement queued -> processing -> completed/failed transitions.

Acceptance:

- Worker processes a queued generation locally.
- Stuck job recovery path exists.

### ENG-014: Create Generation API

- `POST /api/generations` creates a generation and enqueues job.
- Support idempotency with client request ID.

Acceptance:

- Duplicate submit does not create duplicate jobs.
- Generation can only be created for the owning user's uploaded image.

### ENG-015: Add Polling Endpoint

- `GET /api/generations/:id` returns status, safe error, progress metadata, and signed output URL if complete.

Acceptance:

- UI can poll every 3 seconds.
- Completed output URL is short-lived and user-scoped.

### ENG-016: Implement Retry

- `POST /api/generations/:id/retry` creates a new linked generation.
- Prior feedback reason is passed as metadata if available.

Acceptance:

- Retry does not mutate completed prior generation.
- Retry is tracked with `retry_clicked`.

## Epic 7: Results, Feedback, And Sharing

### ENG-017: Build Result Comparison View

- Show original and generated image in mobile-friendly layout.
- Include usable/not usable feedback.

Acceptance:

- Seller can visually compare before rating.
- Result screen tracks `result_viewed`.

### ENG-018: Capture Feedback

- Submit usable/not usable feedback.
- Require reason for not usable.

Acceptance:

- `feedback_submitted` is stored and tracked.
- Invalid reason is rejected.

### ENG-019: Download And Native Share

- Implement signed download URL.
- Use native share-sheet where supported.
- Provide download fallback.

Acceptance:

- User can save output on mobile.
- Share action tracks `share_clicked`.

## Epic 8: Observability

### ENG-020: Implement Event Taxonomy

- Track Phase 1 events from PRD slice.
- Capture server-side truth events from API/worker.

Acceptance:

- Funnel can show auth -> upload -> generation -> result -> feedback/download/share.

### ENG-021: Add Sentry And Worker Alerts

- Add Sentry to web/API/worker.
- Add alerts for generation failure spike, empty worker progress, and queue depth.

Acceptance:

- Worker exception appears in Sentry with generation ID.
- Queue failure can be detected during beta.

## Epic 9: Admin Debug

### ENG-022: Minimal Admin Generations View

- Add `/admin/generations`.
- Show user, thumbnail, mode, status, duration, model route, provider model, failure code, feedback reason, and retry link.

Acceptance:

- Admin can debug beta failures without database access.
- Admin route is protected.

## Suggested Build Order

1. ENG-001, ENG-002, ENG-005
2. ENG-003, ENG-004
3. ENG-007, ENG-008, ENG-009
4. ENG-010, ENG-011, ENG-012
5. ENG-013, ENG-014, ENG-015
6. ENG-017, ENG-018, ENG-019
7. ENG-020, ENG-021, ENG-022
8. ENG-016 after the first happy path works

## Phase 1 Exit Criteria

- New beta user completes first generation on mobile.
- First-generation timing is measured end to end.
- Output can be rated, downloaded, or shared.
- Every generation records model route, provider model, duration, status, cost estimate, and failure code if failed.
- Admin can inspect failed jobs.
- Product team can read daily activation, first-output usable rate, generation success rate, p95 generation time, and cost per usable generation.
