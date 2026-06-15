# Logo Branding Feature — PRD

## 1. Executive Summary

Indian jewelers sharing AI-generated catalog images on WhatsApp want their shop logo on every image — it signals authenticity, builds brand recognition, and removes the "AI-generated" feel. This feature lets users upload their logo once, configure placement, and have it automatically composited onto every generated image using Sharp (libvips) in the worker pipeline. Zero additional AI cost, <300ms added latency.

---

## 2. Problem Statement

- **Who:** Jewelers/wholesalers using Ornava to generate catalog images for WhatsApp sharing
- **What:** Generated images look generic — no shop identity. Customers receiving these images can't tell which jeweler sent them.
- **Why painful:** Jewelers manually add logos in third-party apps (PixelLab, Canva) before sharing — adds 2-5 min per image, breaks the flow, and many skip it entirely.
- **Evidence:** Direct feedback from beta jewelers: "Agar mera logo hota toh seedha bhej deta" (If my logo was there, I'd send it directly)

---

## 3. Target Users & Personas

**Primary:** Active jeweler (generates 5+ images/week, shares on WhatsApp daily)
- Has a shop logo (PNG, usually designed by a local graphic designer)
- Wants images to look "from my shop" not "from an app"
- Tech comfort: can upload files, use sliders, but won't edit JSON

**Secondary:** New jeweler (just onboarded, exploring the tool)
- May not have a logo ready yet
- Should be nudged but not blocked

---

## 4. Strategic Context

| Factor | Detail |
|--------|--------|
| Business goal | Increase share rate per generation (currently ~40% → target 65%) |
| Retention lever | Logo setup = investment in the tool → higher switching cost |
| Competitive moat | No competitor in Indian jewelry AI space offers auto-branding |
| Why now | Beta users explicitly asked; feature is low-cost, high-impact |
| Cost | ₹0 additional per image (Sharp compositing is CPU-negligible) |

---

## 5. Solution Overview

### User Flow

```
Profile → Logo Settings → Upload PNG → Pick Position → Set Size → Preview → Save
                                                                         ↓
Generation Request → AI Model → Output Image → [Logo Composite Step] → Branded Image → R2
                                                                         ↓
Result Screen → Shows branded image → Share on WhatsApp
                                    → "Download without logo" (secondary action)
```

### Key Features

1. **Logo Upload** — PNG, JPG, and WebP, max 10MB, stored in R2 with a matching file extension
2. **Position Picker** — Visual 5-option grid: top-left, top-right, bottom-left, bottom-right, bottom-center
3. **Size Slider** — 8% to 25% of output image width (default: 12%)
4. **Live Preview** — Client-side CSS overlay on a sample image (no server round-trip)
5. **Auto-Application** — Worker composites logo after AI generation, before storing output
6. **Clean Download** — Worker stores both branded and clean versions; result screen offers both
7. **Onboarding Nudge** — Dismissible banner on result screen for users without logo

### Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Frontend   │────▶│  API Routes  │────▶│  R2 (Logos)     │
│  (Profile)  │     │  /api/logo   │     │  users/x/brand/ │
└─────────────┘     └──────────────┘     └─────────────────┘
                                                   │
┌─────────────┐     ┌──────────────┐              ▼
│  Worker     │────▶│  Sharp       │◀── Read logo from R2
│  (BullMQ)  │     │  composite() │──▶ Write branded output to R2
└─────────────┘     └──────────────┘──▶ Write clean output to R2
```

---

## 6. Success Metrics

| Metric | Current | Target | Timeframe |
|--------|---------|--------|-----------|
| Logo upload rate (% of active users) | 0% | 60% | 30 days post-launch |
| Share rate per generation | ~40% | 65% | 30 days post-launch |
| Avg time from generation to share | ~45s | <15s | 30 days |
| Logo nudge → upload conversion | N/A | 30% | 14 days |

---

## 7. Technical Constraints

- **Logo format:** PNG, JPG, or WebP (transparent PNG works best)
- **Max file size:** 10MB (supports common phone and gallery exports while preventing abuse)
- **Min dimensions:** 100×100px (below this, logo is too blurry at 12% overlay)
- **Max dimensions:** 2000×2000px (larger is wasteful; Sharp resizes anyway)
- **Storage:** R2 originals bucket, path: `users/{userId}/branding/logo.{png|jpg|webp}`
- **Worker dependency:** Sharp 0.34.x (already installed)
- **Latency budget:** <300ms added to generation pipeline
- **Caching:** Worker caches logo buffer in memory (LRU, 50 entries) to avoid R2 read per generation

---

## 8. Out of Scope (v1)

| Not building | Why |
|---|---|
| SVG logo support | Requires separate rendering and security handling |
| Opacity control | Adds UI complexity; fixed at 100% for v1 (logos should be opaque) |
| Multiple logos | One logo per user is sufficient for v1 |
| Logo on catalog builder exports | Separate feature; catalog has its own layout system |
| Watermark mode (tiled/semi-transparent) | Future premium feature |
| Per-generation logo toggle | Adds friction to the generation flow; global toggle is enough |

---

## 9. Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| User uploads a logo without transparency | High | Low | Accept it and explain that transparent PNG works best |
| Logo too small/blurry on output | Medium | Medium | Enforce 100px minimum; show preview at actual render size |
| Worker fails to read logo from R2 | Low | Medium | Graceful fallback: generate without logo, log event, notify user |
| Logo compositing slows batch processing | Low | Low | Sharp is <300ms/image; 50-image batch adds ~15s total (parallel) |

---

## 10. Open Questions

- [RESOLVED] Storage location → R2 originals bucket
- [RESOLVED] Library → Sharp (already in deps, fastest for Node.js)
- [DECIDED] Always-on by default once uploaded (global toggle in settings)
- [FUTURE] Should we offer a "Powered by Ornava" co-brand option for free-tier users?
