# Ornava Phase 1 Model Evaluation Plan

Status: Draft  
Date: 2026-05-10  
Related: `adr_001_model_portability.md`, `system_design_phase1_v0_1.md`

## Goal

Select the first default image model route, `ornava-default-v1`, and create a repeatable process for promoting future better or cheaper models.

## Evaluation Principle

The winner is not the newest model. The winner is the model that produces the highest seller-trusted output per rupee and per minute.

## Candidate Models

Initial candidates should include:

- Current preferred model, for example `openai/gpt-image-2/edit`.
- One cheaper or faster fallback model.
- One high-quality challenger model.

The concrete list should be updated whenever a new model appears promising.

## Test Set

Collect 20-50 real jewelry images before beta.

Minimum coverage:

- 5 rings
- 5 earrings
- 5 necklaces/chains
- 5 bangles/bracelets
- 5 stone-heavy or kundan-style pieces
- 5 low-light or messy-background phone photos

For each input, preserve:

- original image
- product type
- source context
- known sensitive details to preserve
- whether the item has stones, engraving, filigree, or symmetry-sensitive details

## Modes To Test

Each candidate model should run:

- Studio
- On-Model
- Close-Up

If cost is high, start with Studio and Close-Up, then test On-Model only for top candidates.

## Scoring Rubric

Rate each output from 1 to 5.

| Dimension | What To Check |
| --- | --- |
| Design fidelity | Shape, silhouette, structure, and proportions preserved |
| Stone/detail preservation | Stones, engravings, texture, filigree, and fine details preserved |
| Premium catalog quality | Output looks professional enough to show a buyer |
| Realism | Lighting, background, model/skin/contact realism where applicable |
| WhatsApp readiness | Crop, clarity, file size, and mobile viewing quality |
| Prompt adherence | Mode-specific output matches Studio, On-Model, or Close-Up |

Hard fail if:

- jewelry shape changes materially
- stones are added or removed
- item becomes a different product
- output is visibly fake in a way that would embarrass the seller
- generation fails or returns unusable artifact

## Metrics To Capture

For every run:

- input image ID
- mode
- prompt template version
- model route
- provider
- provider model ID
- adapter version
- output URL/object key
- success/failure
- failure code
- latency
- estimated cost
- scorer
- score by dimension
- overall usable/not usable
- notes

## Promotion Criteria

A model can become `ornava-default-v1` if it meets:

- >= 70% overall usable rate across the eval set
- < 20% hard-fail rate for design or stone/detail changes
- p95 latency compatible with the 90-second onboarding target
- cost per usable generation supports planned pricing
- no severe privacy, licensing, or commercial restriction blockers

For replacing a default later, the challenger must either:

- improve usable rate by >= 10 percentage points, or
- reduce cost per usable generation by >= 25% without lowering usable rate, or
- improve p95 latency by >= 25% without lowering usable rate.

## Eval Workflow

1. Freeze test input set.
2. Freeze prompt template version.
3. Run all candidate models through the same adapter interface.
4. Store raw outputs and metadata.
5. Score outputs blind when possible.
6. Review hard fails separately.
7. Pick default route.
8. Save decision in ADR or model decision log.
9. Configure `IMAGE_MODEL_DEFAULT`.

## Human Review

At least one reviewer should understand jewelry details. General aesthetic review is insufficient because the core failure is not beauty; it is inaccurate product representation.

## Beta Learning Loop

During beta, compare eval predictions against real seller feedback:

- If sellers reject outputs that scored high internally, update rubric.
- If a specific mode performs poorly, route that mode to a different model.
- If a model is cheap but creates high retry rates, measure cost per usable output, not cost per raw generation.

## Decision Record Template

```md
## Model Decision: ornava-default-v1

Date:
Decision:
Selected route:
Provider:
Provider model ID:
Prompt template version:
Eval set size:
Usable rate:
Hard-fail rate:
p95 latency:
Estimated cost per usable generation:
Known weaknesses:
Next review date:
```
