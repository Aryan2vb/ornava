---
name: ui-design-system-review
description: Review a product's UI for design system consistency — tokens, components, spacing, typography, color. Use when screens feel inconsistent or before building a component library.
intent: >-
  Audit a product's UI against design system principles: design tokens (color, spacing, typography), component consistency, visual hierarchy, and accessibility. Produces a gap analysis and a prioritized list of what to standardize first.
type: component
best_for:
  - "Screens feel visually inconsistent"
  - "Building a component library from scratch"
  - "Onboarding a new designer to the product"
  - "Pre-launch design polish pass"
  - "Identifying what CSS/tokens to extract"
scenarios:
  - "Review Ornava's UI for design consistency"
  - "What design tokens should I extract from my CSS?"
  - "My screens look inconsistent — what's wrong?"
  - "Help me build a component library for my mobile app"
---

## Purpose

Review a product's UI for **design system consistency** — the invisible layer that makes a product feel polished and professional vs. cobbled together. Covers design tokens, component reuse, spacing rhythm, typography scale, color usage, and accessibility.

---

## Design System Layers (Bottom to Top)

```
┌─────────────────────────────────┐
│  5. Patterns (flows, templates) │
├─────────────────────────────────┤
│  4. Components (Button, Card)   │
├─────────────────────────────────┤
│  3. Elements (Icon, Input)      │
├─────────────────────────────────┤
│  2. Tokens (color, spacing, type│
├─────────────────────────────────┤
│  1. Foundations (grid, motion)  │
└─────────────────────────────────┘
```

Start auditing from Layer 1 up. Inconsistency at Layer 2 (tokens) causes chaos at Layer 4 (components).

---

## Audit Checklist

### Layer 1: Foundations
- [ ] Grid system defined? (columns, gutters, margins)
- [ ] Base unit defined? (4px or 8px grid)
- [ ] Motion/animation principles? (duration, easing)
- [ ] Breakpoints defined? (mobile, tablet, desktop)

### Layer 2: Design Tokens
**Color:**
- [ ] All colors named and documented (not raw hex values in components)
- [ ] Semantic tokens exist: `--ink`, `--muted`, `--gold`, `--danger`, `--success`
- [ ] Dark mode tokens? (if needed)
- [ ] Accessible contrast ratios? (WCAG AA: 4.5:1 for text)

**Spacing:**
- [ ] Spacing scale defined? (4, 8, 12, 16, 20, 24, 32, 40, 48...)
- [ ] Consistent padding/margin usage across components?
- [ ] No magic numbers (e.g., `padding: 13px` — why 13?)

**Typography:**
- [ ] Type scale defined? (12, 13, 14, 15, 16, 20, 22, 26, 32...)
- [ ] Font weights consistent? (400, 500, 600, 700 — not 650)
- [ ] Line heights defined per size?
- [ ] No inline font-size overrides scattered in components?

### Layer 3: Elements
- [ ] Icon set consistent? (same library, same stroke weight)
- [ ] Input styles consistent across all forms?
- [ ] Link styles consistent?

### Layer 4: Components
- [ ] Button variants defined? (primary, secondary, ghost, destructive)
- [ ] Button states? (default, hover, active, disabled, loading)
- [ ] Card/panel variants consistent?
- [ ] Navigation component reused (not duplicated)?
- [ ] Loading states consistent? (spinner vs skeleton vs progress bar)
- [ ] Error states consistent?
- [ ] Empty states designed for all lists/grids?

### Layer 5: Patterns
- [ ] Form patterns consistent? (label position, error placement, submit button)
- [ ] Navigation patterns consistent? (back button, breadcrumbs)
- [ ] Confirmation patterns? (destructive actions always confirm)

---

## Ornava Design Token Audit

Current tokens in `globals.css`:

```css
--ground: #fdfaf5;       /* Page background */
--surface: #f5f0e8;      /* Card/panel background */
--surface-raised: #fffaf0; /* Elevated surface */
--ink: #1a1a1a;          /* Primary text */
--muted: #6b5e4f;        /* Secondary text */
--line: #e8dece;         /* Borders */
--line-strong: #d9c9b4;  /* Strong borders */
--gold: #b8860b;         /* Primary brand */
--gold-bright: #d4a843;  /* Hover/accent */
--emerald: #0d5d4a;      /* Success alt */
--success: #0d5d4a;      /* Success */
--success-soft: #e6f3ed; /* Success background */
--danger: #a43d2f;       /* Error */
```

**Gaps to address:**
- No `--danger-soft` (error background) — currently hardcoded `#fef2f0`
- No spacing scale tokens — spacing is hardcoded throughout
- No type scale tokens — font sizes scattered
- No `--radius-*` tokens — border-radius values inconsistent (10px, 12px, 14px, 16px, 20px all used)
- No shadow tokens — box-shadow values duplicated

**Recommended additions:**
```css
--danger-soft: #fef2f0;
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--shadow-sm: 0 1px 4px rgba(0,0,0,0.06);
--shadow-md: 0 2px 12px rgba(0,0,0,0.08);
```

---

## Component Inventory (Ornava)

| Component | Exists | Consistent | Notes |
|---|---|---|---|
| Button (primary) | ✅ `.button` | Mostly | Multiple inline overrides |
| Button (secondary) | ✅ `.button.secondary` | ✅ | |
| Input | ✅ `.input`, `.login-input` | ❌ | Two separate styles |
| Card/Panel | ✅ `.panel`, `.soft-panel`, `.row-card` | ❌ | 3 variants, unclear when to use which |
| Bottom Nav | ✅ `.bottom-nav` | ✅ | |
| Progress Bar | ✅ `.upload-progress-bar` | — | Only used in upload |
| Status Badge | ✅ `.status-pill` | Mostly | |
| Empty State | ❌ | — | Only in gallery, not standardized |
| Loading Spinner | ✅ `.spinner` | — | Not visible in CSS |
| Error Message | ❌ | — | Inline styles scattered |

**Priority fixes:**
1. Unify `.input` and `.login-input` into one component
2. Clarify `.panel` vs `.soft-panel` vs `.row-card` — document when to use each
3. Create a standard `.error-message` component
4. Create a standard `.empty-state` component

---

## Accessibility Quick Check

- [ ] Color contrast: `--gold` (#b8860b) on `--ground` (#fdfaf5) = **3.8:1** ⚠️ Fails AA for small text (need 4.5:1)
- [ ] All interactive elements have focus styles?
- [ ] All images have alt text?
- [ ] Touch targets ≥ 44×44px?
- [ ] Form inputs have associated labels?
- [ ] Error messages linked to inputs via `aria-describedby`?

**Note:** `--gold` on white fails WCAG AA for body text. Use `--ink` for body text, reserve `--gold` for large text (18px+) or decorative use only.

---

## Output Template

```markdown
## Design System Review: [Product Name]
**Date:** [Date]
**Scope:** [Screens reviewed]

### Token Gaps
| Token | Issue | Fix |
|---|---|---|

### Component Issues
| Component | Issue | Priority |
|---|---|---|

### Accessibility Issues
| Issue | WCAG Criterion | Fix |
|---|---|---|

### Recommended Next Steps
1. [Highest priority]
2. ...
```

---

## Related Skills
- **mobile-ux-audit** — Usability issues (this skill = visual consistency)
- **mobile-screen-design** — Redesign after audit
- **user-story** — Write stories for design system work
