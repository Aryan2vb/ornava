# ADR-002: Async Webhook Architecture for AI Generation

Status: Accepted  
Date: 2026-05-13  
Related: `system_design_phase1_v0_2.md`, `adr_001_model_portability.md`

## Context

Phase 1 v0.1 used `fal.subscribe()` to submit image generation jobs, which synchronously polls until completion. This meant each BullMQ worker slot was held for the full ~25s of Fal.ai GPU inference time, even though the worker was doing roughly zero real work during that wait — it was just an HTTP keep-alive.

As beta user count scales, the 90-second activation SLA from the PRD (`phase1_prd_slice.md` §6) becomes the binding constraint. The math:

```
slots_needed = concurrent_users × service_time / (sla - service_time)
             = 50 × 25s / (90s - 25s)
             ≈ 20 parallel slots
```

For 500 concurrent users, we'd need 200 slots. Sizing for that with sync submission means either:

1. Scale vertical (bigger EC2) — expensive, limited by single-box RAM and DB connections
2. Scale horizontal (more worker containers) — complex, same root problem
3. Remove the wait entirely — structural fix

Option 3 is what Fal.ai is designed for. Their `fal.queue.submit()` API returns a `request_id` in ~500ms; completion is delivered via webhook.

## Decision

Move to async submission with webhook-driven completion.

**Submission side** (worker):
- Use `fal.queue.submit({ webhookUrl })` instead of `fal.subscribe()`
- Store returned `request_id` as `provider_job_id`
- Return from the job handler immediately — slot is freed

**Completion side** (web):
- Public endpoint `POST /api/webhooks/fal`
- Signature verification using Fal.ai's ED25519 + JWKS scheme. Public keys fetched from `https://rest.fal.ai/.well-known/jwks.json` (cached 24h). Timestamp freshness check (±5 min) to prevent replay attacks.
- Idempotent — status guard on UPDATE prevents double-processing
- Downloads output from Fal CDN, stores in R2, marks generation complete

**Recovery path** (reaper):
- Periodic task inside worker polling DB for stuck jobs (`processing` status + `provider_job_id` + `started_at` older than 60s)
- Calls `fal.queue.status()` to check real state
- Recovers missed webhooks; force-fails jobs older than 5 minutes

The `submit()` sync path is preserved on the adapter interface as a fallback. If `WEBHOOK_BASE_URL` is unset, worker automatically uses sync mode. This enables local development without ngrok and provides a safety fallback. Note: `FAL_WEBHOOK_SECRET` is **not** used — Fal signs webhooks with their own ED25519 keys, not a shared secret from us.

## Design Rules

- The `ImageModelAdapter` interface gains an optional `submitAsync()` method. Adapters that support async mode implement it; others only implement `submit()`.
- The async path must only activate when **both** env vars are set and the adapter supports it. This is a deliberate three-way AND to prevent partial configuration from breaking production.
- No status enum change. `provider_job_id` set during `processing` status is sufficient signal that the job is "submitted, awaiting webhook".
- Webhook handler must be idempotent by design (status-guarded UPDATE), not by external deduplication. Duplicate webhooks happen — they should be silent no-ops.
- Reaper must only run in async mode. In sync mode it would conflict with the worker's ownership of the job.
- Webhook handler returns 200 on internal errors (after marking DB failed) to prevent Fal retry storms. The user will see the failure state in our system; Fal doesn't need to retry us.

## Alternatives Considered

### A. Keep sync, scale horizontally
Add more worker containers until slot count is sufficient. At 500 users we'd need ~15 workers × t3.medium.

**Rejected.** Wasteful — each slot sleeps 92% of its life. Costs 10× what it should. Hits DB connection limits before user limit.

### B. Fal.ai polling instead of webhooks
Submit async, then poll `fal.queue.status()` from worker every 2s until done.

**Rejected.** Better than v0.1 but still keeps a worker slot tied up for the duration. Saves maybe 30% of worker time, not the 90%+ webhooks deliver. And we'd still need reaper-like logic.

### C. Replace BullMQ with serverless (AWS Lambda)
Each generation triggers a Lambda. No queue backpressure.

**Rejected for Phase 1.** Requires rewriting worker in a Lambda-compatible way. Image bytes are awkward over Lambda payload limits. Cold starts add latency. Worth revisiting at 5000+ users.

### D. Streaming/WebSocket connection to Fal
Persistent connection, submit many, receive results as they stream back.

**Rejected.** Fal.ai doesn't expose this mode. Would require custom infrastructure.

## Consequences

### Positive
- **12× effective worker throughput** — same infra handles ~500 users instead of ~50
- **Worker crash resilience** — Fal keeps processing, webhook or reaper completes job when web comes back
- **Workers become closer to stateless** — easier path to serverless migration if needed later
- **Natural multi-provider foundation** — each adapter can own its async pattern independently
- **Failure modes are explicit** — reaper timeout, webhook signature, download failure all map to distinct states

### Tradeoffs
- **Public webhook endpoint exposure** — attack surface now includes signature verification against Fal's JWKS. Mitigation: ED25519 verification with timestamp freshness check (±5 min) to prevent replay, return 401 on bad signature so monitoring is easy. We log rejected signatures with the reason code.
- **More moving parts** — three paths now converge on "complete the generation": webhook, reaper, sync fallback. Must stay idempotent.
- **Harder to test locally** — dev needs ngrok/cloudflared/equivalent for webhook mode. Sync fallback covers this, but devs testing async must tunnel.
- **Webhook delivery is best-effort** — Fal retries a few times. Reaper is our safety net but adds a 30-60s recovery lag.

## Non-Negotiables

- A generation that completes on Fal.ai must eventually be marked complete in our DB, even if every webhook delivery fails. Reaper ensures this.
- A duplicate webhook (same `request_id`) must be a no-op. Status-guarded UPDATE ensures this.
- No webhook endpoint accepts requests without signature verification in production (Fal ED25519 + JWKS).
- The sync fallback path must remain functional. Removing it would make local dev and Fal outage fallback impossible.

## Acceptance Tests

These must all pass before declaring the migration complete:

1. Submit 20 generations simultaneously in async mode — all complete within 30s wall time
2. Kill worker mid-submission — in-flight jobs recovered by reaper within 60s
3. Send duplicate webhook for completed generation — returns 200, no DB state change
4. Send webhook with invalid HMAC — returns 401, generation remains `processing`
5. Unset `WEBHOOK_BASE_URL` — worker silently falls back to sync, jobs still complete
6. Simulate Fal 500 during submission — adapter normalizes to `provider_unavailable`, marked retryable
7. Generation with `provider_job_id` set but no webhook for 6 minutes — reaper force-fails

## Monitoring

New log lines to watch:
- `[worker] submitted generation <id> to fal (request_id=<x>), slot freed after <ms>ms` — should be <3000ms p99
- `[fal-webhook] invalid signature, rejecting` — should be near zero; nonzero suggests misconfiguration or attack
- `[reaper] found <n> stuck generations` — should be zero most cycles
- `[reaper] generation <id> completed on fal but webhook missed. Recovering.` — indicates webhook reliability issues

## Open Questions

- Should we migrate the client-side 3s polling to SSE once the server side is event-driven?
- Does Fal.ai provide delivery receipts or retry metadata we can use to tune reaper interval?
- Should we emit a Sentry breadcrumb for every reaper recovery so it's visible above infra-level monitoring?
