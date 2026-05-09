# ADR-001: Model-Portability Architecture

Status: Accepted for Phase 1 draft  
Date: 2026-05-10  
Related: `system_design_phase1_v0_1.md`, `phase1_prd_slice.md`

## Context

Ornava's core value depends on AI image generation quality, latency, and cost. Image models are changing quickly. A model that is best today may be worse than a cheaper or higher-fidelity model next month.

Phase 1 may start with a model such as `openai/gpt-image-2/edit`, but the codebase must not become dependent on that model ID or any single provider's SDK semantics. The product should be able to adopt a new image model quickly after a validation pass, similar to how modern AI products add newly released models without redesigning the app.

## Decision

Ornava will use a model-portability layer from Phase 1.

Product code will call a stable Ornava model route, such as `ornava-default-v1`, not a provider-specific model ID. Provider model IDs, provider SDKs, request formats, response formats, limits, and error shapes will be isolated behind:

- `ImageModelAdapter`
- `imageModelRegistry`
- runtime configuration
- eval-based model promotion

The generation pipeline will persist both the stable route and concrete provider model used for each generation.

## Design Rules

- UI code must not import provider SDKs.
- API route handlers must not hard-code provider model IDs.
- Prompt-building code must not care which provider receives the request.
- Worker code must resolve the selected model from the registry before calling an adapter.
- Provider-specific errors must be normalized into stable internal error codes.
- Every generation must store `model_route`, `provider`, `provider_model_id`, `provider_job_id`, `prompt_template_version`, and `adapter_version`.
- A new model can be added as a registry entry and adapter without changing the onboarding, upload, results, feedback, or analytics flows.

## Internal Contract

```ts
type GenerationMode = "on_model" | "studio" | "close_up";

type ImageGenerationRequest = {
  generationId: string;
  userId: string;
  mode: GenerationMode;
  inputImage: {
    objectKey: string;
    signedUrl: string;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
  };
  prompt: string;
  output: {
    aspectRatio: "1:1" | "4:5" | "9:16";
    format: "jpeg" | "png" | "webp";
    quality: "draft" | "standard" | "high";
  };
  metadata: {
    promptTemplateVersion: string;
    clientRequestId: string;
  };
};

type ImageGenerationResult = {
  provider: string;
  modelId: string;
  providerJobId?: string;
  outputUrl?: string;
  outputBytes?: Buffer;
  width?: number;
  height?: number;
  costEstimateMinor?: number;
  latencyMs: number;
  rawMetadata?: Record<string, unknown>;
};

interface ImageModelAdapter {
  submit(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
  normalizeError(error: unknown): NormalizedGenerationError;
}
```

## Runtime Selection

Model selection should be layered:

1. Global default: `IMAGE_MODEL_DEFAULT=ornava-default-v1`
2. Mode override: `IMAGE_MODEL_STUDIO`, `IMAGE_MODEL_ON_MODEL`, `IMAGE_MODEL_CLOSE_UP`
3. Beta cohort override for controlled tests
4. Admin override for debugging and manual comparison

## Promotion Rule

A new model should not become default because it is newer. It should become default only if it beats or matches the current default on:

- first-output usable rate
- design fidelity
- stone/detail preservation
- p95 generation latency
- cost per usable generation
- failure rate
- consistency across Studio, On-Model, and Close-Up modes

## Consequences

### Positive

- Faster adoption of better/cheaper models.
- Lower vendor lock-in.
- Cleaner worker design.
- Easier A/B tests by mode or beta cohort.
- Better debugging because every output records the concrete provider/model used.

### Tradeoffs

- Slightly more upfront engineering than a direct provider call.
- Adapters must be maintained as providers change APIs.
- The registry and eval process need discipline, otherwise model swaps can become arbitrary.

## Non-Negotiable

No Phase 1 code path should require rewriting product logic to change from one image model to another.
