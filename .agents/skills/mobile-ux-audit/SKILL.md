---
name: mobile-ux-audit
description: Audit a mobile screen or flow against Nielsen's 10 heuristics + mobile-specific principles. Use when reviewing a screen, flow, or prototype for usability issues before shipping.
intent: >-
  Run a structured UX audit on a mobile screen, flow, or prototype using Nielsen's 10 usability heuristics adapted for mobile (touch-first, thumb zones, small screen, distracted context). Produces a prioritized list of issues with severity ratings and actionable fixes.
type: interactive
best_for:
  - "Reviewing a screen before shipping"
  - "Finding usability issues in an existing flow"
  - "Aligning team on what 'good' looks like"
  - "Creating a design backlog from a UX audit"
scenarios:
  - "Audit my upload screen for usability issues"
  - "Review the onboarding flow against mobile UX principles"
  - "Find what's wrong with my login page UX"
  - "Run a heuristic evaluation on my bottom navigation"
---

## Purpose

Run a structured UX audit on a mobile screen or flow using **Nielsen's 10 Usability Heuristics** adapted for mobile-first, touch-driven interfaces. Produces a prioritized issue list with severity scores (0–4) and specific fixes.

Use this when you want expert-level UX feedback without user testing — fast, structured, actionable.

---

## Mobile-Specific Principles (Beyond Nielsen)

These extend Nielsen's heuristics for mobile context:

1. **Thumb Zone** — Primary actions must be reachable with one thumb (bottom 2/3 of screen). Danger zone = top corners.
2. **Touch Target Size** — Minimum 44×44px (Apple HIG) / 48×48dp (Material). Never smaller.
3. **One Primary Action Per Screen** — Mobile screens should have one clear CTA. Multiple CTAs = confusion.
4. **Distracted Context** — Users are on the move. Reduce cognitive load. Short labels, clear icons, no walls of text.
5. **Safe Area Insets** — Respect notch, home indicator, and system UI on iOS/Android.
6. **Loading Feedback** — Mobile networks are slow. Every async action needs a loading state.
7. **Empty States** — Every list/grid needs a designed empty state. Blank screens feel broken.
8. **Error Recovery** — Errors must be inline, specific, and tell the user exactly what to do.
9. **Gesture Discoverability** — Hidden gestures (swipe, long press) need affordances or onboarding.
10. **Offline/Degraded State** — What happens with no internet? Design for it.

---

## Nielsen's 10 Heuristics (Mobile-Adapted)

| # | Heuristic | Mobile Adaptation |
|---|---|---|
| 1 | Visibility of system status | Loading spinners, progress bars, upload %, skeleton screens |
| 2 | Match between system and real world | Use jeweller's language, not tech jargon |
| 3 | User control and freedom | Easy undo, back navigation, cancel upload |
| 4 | Consistency and standards | Same button styles, same icon meanings throughout |
| 5 | Error prevention | Validate before submit, confirm destructive actions |
| 6 | Recognition over recall | Show options, don't make users remember |
| 7 | Flexibility and efficiency | Power users can skip steps; beginners get guidance |
| 8 | Aesthetic and minimalist design | Remove every element that doesn't earn its place |
| 9 | Help users recognize/recover from errors | Inline errors, plain language, specific fix instructions |
| 10 | Help and documentation | Contextual hints, not a separate help page |

---

## Severity Scale

| Score | Label | Meaning |
|---|---|---|
| 0 | Not a problem | Cosmetic only, no fix needed |
| 1 | Cosmetic | Fix if time allows |
| 2 | Minor | Low priority fix |
| 3 | Major | High priority — fix before shipping |
| 4 | Catastrophic | Blocks users — fix immediately |

---

## Audit Process

### Step 1: Define Scope
- Which screen(s) or flow?
- What is the user's goal on this screen?
- What device/OS are we targeting?

### Step 2: Evaluate Each Heuristic
For each of the 10 heuristics + 10 mobile principles, ask:
- Is this violated?
- Where exactly?
- Severity (0–4)?
- Recommended fix?

### Step 3: Prioritize Issues
Sort by severity (4 → 0). Group by screen.

### Step 4: Output
Produce a table:

| Screen | Issue | Heuristic | Severity | Fix |
|---|---|---|---|---|
| Upload | "Select photo" button is at top of screen | Thumb Zone | 3 | Move CTA to bottom |
| Login | No loading state after Google sign-in tap | Visibility of Status | 4 | Add spinner on button tap |
| Dashboard | Empty state shows blank white screen | Empty States | 3 | Add illustration + CTA |

---

## Application for Ornava

### Screens to audit:
1. **Landing page** (`/`) — Does it convert? Is the CTA thumb-reachable?
2. **Login** (`/login`) — Is Google button prominent? Any friction?
3. **Upload** (`/upload`) — Is the drop zone usable on mobile? Touch targets?
4. **Brief/Mode select** (`/brief`) — Can users understand the 3 modes quickly?
5. **Result** (`/result`) — Is download/share thumb-reachable?
6. **Dashboard** (`/dashboard`) — Empty state? Image grid scannable?
7. **Bottom Nav** — Active state clear? Touch targets 44px+?

### Common Ornava-specific issues to check:
- Are all CTAs in the bottom thumb zone?
- Does every async action (upload, generation) have a loading state?
- Are error messages in plain Hindi/English (not "Error 500")?
- Is the WhatsApp share button prominent on the result screen?
- Does the gallery have a designed empty state?

---

## Output Template

```markdown
## UX Audit: [Screen Name]
**Date:** [Date]
**Auditor:** [Name]
**User Goal:** [What is the user trying to do?]

### Issues Found

| # | Issue | Heuristic | Severity | Fix |
|---|---|---|---|---|
| 1 | [Issue description] | [Heuristic] | [0-4] | [Specific fix] |

### Summary
- Critical (4): X issues
- Major (3): X issues
- Minor (1-2): X issues
- Total: X issues

### Recommended Priority Order
1. [Fix 1] — Severity 4
2. [Fix 2] — Severity 3
...
```

---

## Related Skills
- **lean-ux-canvas** — Frame the problem before auditing
- **mobile-screen-design** — Redesign screens after audit
- **ui-design-system-review** — Check consistency across screens
- **user-story** — Write stories for audit fixes
