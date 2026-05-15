---
name: mobile-screen-design
description: Design or redesign a mobile screen from scratch using PM + UX principles. Use when building a new screen, redesigning an existing one, or reviewing a design before implementation.
intent: >-
  Guide the design of a mobile screen using a structured process: define the user goal, map the information hierarchy, apply mobile UX principles (thumb zones, one primary action, progressive disclosure), and produce a component spec ready for implementation.
type: interactive
best_for:
  - "Designing a new screen from scratch"
  - "Redesigning an existing screen that isn't working"
  - "Reviewing a design before handing off to dev"
  - "Deciding what to show/hide on a screen"
  - "Writing a design spec for a developer"
scenarios:
  - "Design the result screen for Ornava"
  - "Redesign the dashboard to show generated images better"
  - "What should the mode selection screen look like?"
  - "Help me design the credit purchase flow"
  - "Review this screen design before I implement it"
---

## Purpose

Design or redesign a mobile screen using a structured, PM-informed process. Combines **information architecture**, **mobile UX principles**, and **component thinking** to produce a screen that is clear, thumb-friendly, and conversion-optimized.

---

## Screen Design Process (5 Steps)

### Step 1: Define the Screen's Job
Every screen has one job. Answer:
- **What is the user trying to accomplish?** (one sentence)
- **What is the one action we want them to take?** (primary CTA)
- **What information do they need to make that decision?**
- **What would make them leave without completing the action?**

### Step 2: Information Hierarchy
List everything that could appear on the screen. Then ruthlessly prioritize:

| Priority | Content | Why |
|---|---|---|
| Must have | Primary CTA, key info | User can't complete goal without it |
| Should have | Supporting context | Reduces friction/anxiety |
| Nice to have | Secondary actions | Useful but not blocking |
| Remove | Everything else | Adds noise, reduces focus |

### Step 3: Layout (Mobile-First)
Apply the **F-pattern + Thumb Zone** model:

```
┌─────────────────────┐
│  Header / Title     │  ← Eyes land here first
│                     │
│  Key visual / info  │  ← Supporting context
│                     │
│  Secondary content  │  ← Progressive disclosure
│                     │
│  ┌───────────────┐  │
│  │  Primary CTA  │  │  ← Thumb zone (bottom 40%)
│  └───────────────┘  │
└─────────────────────┘
```

Rules:
- Primary CTA always in bottom thumb zone
- Most important info in top 1/3 (above fold)
- One primary CTA per screen
- Secondary actions smaller, lower contrast

### Step 4: Component Spec
For each element on screen, specify:
- Component type (Button, Card, Input, etc.)
- State (default, loading, error, success, empty)
- Content (exact copy, not placeholder)
- Interaction (what happens on tap)

### Step 5: Edge Cases
Design for:
- **Empty state** — First time user, no data
- **Loading state** — Async operation in progress
- **Error state** — Something went wrong
- **Success state** — Action completed
- **Long content** — What if text is 3x longer than expected?

---

## Mobile UX Principles Applied

### Thumb Zone Map (390px wide phone)
```
┌─────────────────────┐
│  ████████████████   │  ← Hard to reach (top)
│  ████████████████   │
│  ░░░░░░░░░░░░░░░░   │  ← OK (middle)
│  ░░░░░░░░░░░░░░░░   │
│  ░░░░░░░░░░░░░░░░   │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  ← Easy (bottom) ← PUT CTAs HERE
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
└─────────────────────┘
```

### One Screen, One Goal
- If a screen has 2 primary CTAs, it has 0 primary CTAs
- Use progressive disclosure: show details only when needed
- Use bottom sheets / modals for secondary flows

### Copy Principles
- Labels: 1-3 words max
- Body copy: max 2 lines before truncation
- CTA copy: verb + noun ("Upload photo", "Share on WhatsApp", "Download image")
- Error copy: "What went wrong" + "What to do" (not "Error 422")

---

## Ornava Screen Specs

### Result Screen (`/result`) — Most Important Screen
**User goal:** Download or share the generated image.

**Must have:**
- Generated image (large, full-width)
- Before/after toggle (shows value)
- "Share on WhatsApp" button (primary CTA — thumb zone)
- "Download" button (secondary)
- "Try again" / "Generate another" (tertiary)

**Should have:**
- Feedback (usable / not usable) — helps improve the model
- Mode label (Studio / On Model / Close-up)

**Remove:**
- Technical metadata (generation time, model ID)
- Navigation to unrelated screens

**Layout:**
```
┌─────────────────────┐
│  ← Back    Result   │
│                     │
│  ┌───────────────┐  │
│  │               │  │
│  │  Generated    │  │
│  │  Image        │  │
│  │               │  │
│  └───────────────┘  │
│  [Before] [After]   │  ← Toggle
│                     │
│  Was this usable?   │
│  [✓ Yes] [✗ No]    │
│                     │
│  ┌───────────────┐  │
│  │ Share WhatsApp│  │  ← Primary CTA
│  └───────────────┘  │
│  Download  Retry    │  ← Secondary
└─────────────────────┘
```

### Dashboard (`/dashboard`)
**User goal:** See recent work + start a new generation.

**Must have:**
- "Create new" FAB or prominent button
- Recent generations grid (visual, not list)
- Credits remaining

**Remove:**
- Long text descriptions
- Status text for completed items (show image, not "Completed")

### Mode Select (`/brief`)
**User goal:** Choose how to present the jewelry.

**Must have:**
- 3 mode cards with visual preview (not just text)
- Clear labels: "On Model", "Studio", "Close-Up"
- One-tap selection → auto-advance

**Remove:**
- Long descriptions (replace with 5-word subtitles)
- Separate "Continue" button (tap card = select + advance)

---

## Design Handoff Checklist

Before handing to developer:
- [ ] All states designed (default, loading, error, empty, success)
- [ ] All copy finalized (no "Lorem ipsum")
- [ ] Touch targets ≥ 44px
- [ ] Primary CTA in thumb zone
- [ ] Colors use design tokens (not raw hex)
- [ ] Spacing uses 4/8px grid
- [ ] Edge cases documented

---

## Related Skills
- **mobile-ux-audit** — Audit before redesigning
- **ui-design-system-review** — Check token/component consistency
- **lean-ux-canvas** — Validate the screen's purpose before designing
- **user-story** — Write stories for each screen state
