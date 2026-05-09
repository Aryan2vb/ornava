# Ornava Phase 1 PRD Slice

Version: 0.1  
Status: Draft for design and engineering review  
Scope: Core MVP, first successful generation, mobile web  
Source PRD: `prd.md`  
Evidence status: Market-supported, user-specific assumptions pending beta interviews

## 1. Executive Summary

We are building the Phase 1 core MVP for WhatsApp-first Indian jewelry sellers so they can upload a raw jewelry photo, generate a catalog-ready image in one of three modes, review the result, and save or share it from a mobile browser within 90 seconds of signup. The goal is to prove that Ornava can deliver a trusted first transformation fast enough to become part of a seller's weekly catalog workflow.

## 2. Primary Proto-Persona

### WhatsApp-First Jewelry Seller Jaya

- Role: Owner, operator, or family member managing sales and product photos for a small jewelry store or social commerce business.
- Business type: Small jeweler, wholesaler, reseller, or Instagram/WhatsApp seller with frequent new inventory.
- Location context: India, often tier 1 to tier 3 city jewelry markets.
- Device context: Phone-first, Android-heavy, intermittent 4G, low tolerance for heavy setup.
- Current workflow: Takes photos on phone, forwards images to buyers on WhatsApp, posts selectively on Instagram, may use a local editor or basic apps for cleanup.
- Buying trigger: Needs to make new stock look professional quickly enough to sell before buyer interest cools.
- Trust barrier: Will reject the product immediately if stones, shape, finish, size, or design are visibly changed.

### Representative Voice

- "I need this piece to look premium, but it must still look like the exact item I am selling."
- "If I cannot send it on WhatsApp today, it is not useful."
- "I do not want to learn prompts. I want to upload, choose a style, and get the image."

### Validation Needed

- Interview 10-15 sellers across small retail, wholesale, and Instagram-first segments.
- Confirm weekly image volume, current editing cost, catalog turnaround time, and willingness to pay.
- Capture real examples of "unusable" AI outputs to define the fidelity rubric.

## 3. Problem Statement

### Problem Framing Narrative

I am a WhatsApp-first jewelry seller trying to turn new inventory into professional, buyer-ready images quickly, but professional shoots are expensive, editing takes too long, and basic phone photos make the jewelry look less premium than it is. Because buyers judge craftsmanship through small visual details like stones, polish, finish, and proportions, I cannot use a tool that makes the product look better by changing the actual design. This makes me feel slowed down, dependent on others, and worried that poor images are costing me sales.

### Final Problem Statement

WhatsApp-first jewelry sellers need a way to create premium catalog images from raw phone photos within minutes because current photoshoot and editing options are too slow, costly, or inconsistent, which delays sharing new inventory and risks making valuable jewelry look low quality.

## 4. Jobs To Be Done

### Core JTBD

When I receive or photograph new jewelry stock, I want to create trustworthy catalog-ready images quickly so I can share them with buyers on WhatsApp or Instagram before sales momentum fades.

### Functional Jobs

- Convert raw jewelry photos into polished catalog images.
- Generate images in the format needed for buyer sharing and social selling.
- Compare generated output against the original before using it.
- Save or share the result without desktop tools.

### Social Jobs

- Look professional and premium to buyers, retailers, and wholesalers.
- Signal that my catalog quality matches larger jewelry brands.
- Avoid looking careless because of poor lighting or inconsistent photos.

### Emotional Jobs

- Feel confident that the product still looks authentic.
- Avoid anxiety that AI changed a sellable detail.
- Feel in control of catalog creation without waiting on photographers or editors.

### Key Pains

- Photoshoots are too expensive and slow for frequent small catalog updates.
- Manual editing is tedious and does not scale to dozens of items.
- Generic AI tools require prompting and may alter the product.
- WhatsApp and Instagram sharing often require manual cropping, compression, or resizing.

### Desired Gains

- First usable generated image in <= 90 seconds from signup.
- Output that preserves jewelry design strongly enough for seller trust.
- Mobile-first workflow requiring no prompt writing.
- Share-ready file naming, dimensions, and compression.

## 5. Phase 1 Scope

### In Scope

- Mobile web onboarding for first generation.
- Gmail OAuth and phone OTP entry points if infrastructure is ready; at minimum one reliable auth path for beta.
- Upload or camera/gallery selection for 1-3 images.
- Client-side validation for JPG/PNG and max file size.
- Mode selection: On-Model, Studio, Close-Up.
- Server-side prompt generation with no user prompt entry.
- Generation job creation, polling, progress states, and failure state.
- Results view with original/generated comparison.
- Feedback capture: usable/not usable plus reason.
- Download and mobile share-sheet handoff for generated image.
- Analytics events needed to measure activation and failures.

### Out of Scope For Phase 1

- Batch processing.
- Catalog builder.
- Credit purchase flow and paid plans.
- Advanced manual editing tools.
- Dedicated WhatsApp Business API integration.
- Multi-user workspaces.
- Natural-language style prompting.
- Public catalog links.

## 6. Activation Metric

### Primary Activation Metric

First successful usable generation rate: percentage of new signed-up users who complete a generation, view the result, and mark it usable or download/share it within 90 seconds of signup.

### Target

- Beta target: >= 70% of invited users complete first generation within 90 seconds.
- Quality target: >= 60% of first outputs are marked usable by the seller.
- Phase 1 exit target: >= 80% complete first generation, >= 70% first-output usable rate, generation failure rate < 10%.

### Measurement Rules

- Start timestamp: `auth_completed` for new users.
- End timestamp: earliest of `feedback_submitted` with `rating=usable`, `download_clicked`, or `share_clicked`.
- Count as activated only if a generated output is available and the user reaches the result screen.
- Exclude internal test accounts and failed uploads caused by unsupported file types.

### Guardrail Metrics

- Auth completion rate should not fall below 80% for invited beta users.
- Upload failure rate should stay below 10%.
- Generation failure rate should stay below 10% in Phase 1.
- Median cost per successful generation must be tracked before monetization decisions.
- Unusable due to "design changed" should stay below 20% of rated outputs.

## 7. Event Taxonomy

| Event | Trigger | Key Properties |
| --- | --- | --- |
| `signup_started` | User opens auth flow | `entry_source`, `device_type`, `utm_source` |
| `auth_completed` | User successfully signs in | `auth_method`, `is_new_user`, `time_to_auth_ms` |
| `onboarding_started` | First onboarding screen loads | `user_id`, `device_type` |
| `upload_started` | User selects, captures, or drops image | `source`, `file_count`, `device_type` |
| `upload_validation_failed` | Client rejects file | `reason`, `file_size_mb`, `file_type` |
| `upload_completed` | Image stored and thumbnail available | `file_count`, `total_size_mb`, `upload_duration_ms` |
| `mode_selected` | User chooses generation mode | `mode`, `image_count`, `step_index` |
| `generation_requested` | Backend job is created | `mode`, `image_id`, `provider`, `prompt_template_version` |
| `job_status_changed` | Job changes state | `job_id`, `from_status`, `to_status`, `queue_position`, `elapsed_ms` |
| `generation_completed` | Output URL is stored | `job_id`, `mode`, `generation_duration_ms`, `provider_latency_ms` |
| `generation_failed` | Job fails terminally | `job_id`, `mode`, `error_code`, `retryable`, `attempt_count` |
| `result_viewed` | Results screen appears | `job_id`, `mode`, `time_from_auth_ms`, `time_from_upload_ms` |
| `feedback_submitted` | User rates output | `rating`, `reason`, `mode`, `product_type_optional` |
| `retry_clicked` | User retries generation | `reason`, `previous_job_id`, `mode` |
| `download_clicked` | User downloads image | `mode`, `file_size_mb`, `output_format` |
| `share_clicked` | User invokes mobile share flow | `target_if_available`, `mode`, `file_size_mb` |
| `onboarding_completed` | User lands in dashboard after first result | `activated`, `credits_remaining`, `time_from_auth_ms` |

### Feedback Reasons

For `rating=not_usable`, use one required reason:

- `design_changed`
- `stone_or_detail_changed`
- `unrealistic_model_or_skin`
- `too_dark_or_dull`
- `bad_crop_or_composition`
- `generation_failed_or_incomplete`
- `other`

## 8. User Stories And Acceptance Criteria

### Story 1: Fast Mobile Signup

Summary: Let an invited seller enter the product with minimal friction.

Use case:

- As a WhatsApp-first jewelry seller
- I want to sign in with the lowest-friction available method
- so that I can reach my first generated image without account setup work.

Acceptance criteria:

- Scenario: New invited seller signs in successfully
- Given I open Ornava on a mobile browser
- And I choose an available auth method
- When I complete authentication successfully
- Then I am taken directly into the first-generation onboarding flow and `auth_completed` is tracked.

- Scenario: Authentication fails
- Given I am attempting to sign in
- When authentication fails or expires
- Then I see a plain-language error and can retry without losing my place.

### Story 2: Upload Jewelry Photos

Summary: Accept valid phone photos and reject unusable files clearly.

Use case:

- As a WhatsApp-first jewelry seller
- I want to upload or select 1-3 jewelry photos from my phone
- so that I can start generation from photos I already have.

Acceptance criteria:

- Scenario: User uploads valid photos
- Given I am in onboarding
- And I select 1-3 JPG or PNG files within the file-size limit
- When upload completes
- Then I see thumbnails for each uploaded image and `upload_completed` is tracked.

- Scenario: User selects invalid files
- Given I select an unsupported file type or oversized file
- When validation runs
- Then the invalid file is rejected with the reason shown and `upload_validation_failed` is tracked.

### Story 3: Choose Generation Mode

Summary: Help the seller choose the right output without prompt writing.

Use case:

- As a WhatsApp-first jewelry seller
- I want to choose between On-Model, Studio, and Close-Up modes
- so that I can generate the type of catalog image I need without writing a prompt.

Acceptance criteria:

- Scenario: User selects a mode
- Given at least one image has uploaded successfully
- When I choose a generation mode
- Then the selected mode is visually confirmed and `mode_selected` is tracked.

- Scenario: User continues without selecting a mode
- Given no mode is selected
- When I try to generate
- Then I am asked to select a mode before continuing.

### Story 4: Request First Generation

Summary: Submit a server-side AI generation job with fidelity constraints.

Use case:

- As a WhatsApp-first jewelry seller
- I want Ornava to generate the image for me
- so that I do not need to understand AI prompts or editing tools.

Acceptance criteria:

- Scenario: Generation job is created
- Given I have uploaded an image
- And I have selected a mode
- When I tap generate
- Then a backend job is created with the selected mode and server-side prompt template, and `generation_requested` is tracked.

- Scenario: Provider request cannot be started
- Given I tap generate
- When the backend cannot create a job
- Then I see a retryable error and no credit is deducted.

### Story 5: Show Generation Progress

Summary: Keep the seller informed while the image is being generated.

Use case:

- As a WhatsApp-first jewelry seller
- I want to see progress while generation runs
- so that I know whether to wait, retry, or come back.

Acceptance criteria:

- Scenario: Generation completes within target time
- Given a generation job is processing
- When the job completes
- Then I am taken to the results screen and `result_viewed` is tracked with time from auth and upload.

- Scenario: Generation exceeds 90 seconds
- Given a generation job is still processing after 90 seconds
- When the result is not ready
- Then I see an estimated wait state or queue position instead of a blank spinner.

- Scenario: Generation fails
- Given a generation job fails terminally
- When the failure is returned
- Then I see a plain-language reason, a retry option when retryable, and `generation_failed` is tracked.

### Story 6: Review Original And Generated Result

Summary: Let the seller verify product fidelity before using the image.

Use case:

- As a WhatsApp-first jewelry seller
- I want to compare the generated image against my original
- so that I can confirm the jewelry design is still accurate.

Acceptance criteria:

- Scenario: Result screen loads
- Given generation has completed
- When I view the result
- Then I can see both the original and generated image in a mobile-friendly comparison layout.

- Scenario: User rates result as usable
- Given I am viewing a result
- When I mark the image as usable
- Then `feedback_submitted` is tracked with `rating=usable`.

- Scenario: User rates result as not usable
- Given I am viewing a result
- When I mark it not usable
- Then I must choose a reason before submitting feedback.

### Story 7: Retry Failed Or Low-Quality Output

Summary: Give the seller a quick recovery path when generation is wrong.

Use case:

- As a WhatsApp-first jewelry seller
- I want to retry a failed or bad generation
- so that one poor output does not end my first session.

Acceptance criteria:

- Scenario: Retry from failed generation
- Given a generation failed with a retryable error
- When I tap retry
- Then a new job is created for the same image and mode and `retry_clicked` is tracked.

- Scenario: Retry from not usable result
- Given I marked a result not usable
- When I tap retry
- Then a new job is created and includes the prior feedback reason as metadata.

### Story 8: Save Or Share First Output

Summary: Make the generated image immediately usable outside Ornava.

Use case:

- As a WhatsApp-first jewelry seller
- I want to download or share the generated image from my phone
- so that I can send it to buyers or post it without extra editing.

Acceptance criteria:

- Scenario: User downloads output
- Given I am viewing a completed generation
- When I tap download
- Then the generated image downloads with a structured filename and `download_clicked` is tracked.

- Scenario: User invokes mobile share
- Given the browser supports native sharing
- When I tap share
- Then the mobile share sheet opens with the generated image or shareable file, and `share_clicked` is tracked.

- Scenario: User completes onboarding
- Given I have downloaded, shared, or marked the result usable
- When I continue
- Then I land on the dashboard and `onboarding_completed` is tracked.

## 9. Non-Functional Requirements For Phase 1

- Mobile viewport: Must work at 390 x 844 px and common Android Chrome dimensions.
- First generation target: <= 90 seconds from `auth_completed` to `result_viewed` for p50 beta users.
- Generation status polling: Every 3 seconds unless replaced by server-sent events or websockets.
- Image privacy: Original and generated images must be scoped to the signed-in user.
- Storage: Uploaded originals and generated outputs must use private storage with signed access.
- Accessibility: All primary actions must be reachable with screen-reader labels and visible focus states.
- Failure states: No infinite spinner; every terminal failure must map to a user-visible message and analytics error code.

## 10. Market Relevance Check

### Current Signal

The product remains relevant, but the competitive assumption should change from "no focused tool exists" to "focused tools exist, so Ornava must win on India-specific workflow, mobile simplicity, WhatsApp-native sharing, and jewelry fidelity."

### Supporting Signals

- India has a large jewelry market. IBEF reports India's gems and jewellery market was about US$85 billion in January 2025 and projects US$130 billion by 2030. Source: https://www.ibef.org/industry/gems-jewellery-india
- The export side is large but volatile, which increases pressure on sellers to differentiate and move inventory efficiently. GJEPC reported FY 2025-26 gem and jewellery exports of US$27.72 billion, with growth in rupee terms but a 3.32% dollar decline. Source: https://gjepc.org/news_detail.php?news=india-s-gem-jewellery-exports-in-fy-2025-26-at-usd-27-72-billion-signals-structural-reset-towards-broad-based-growth-reducing-dependence-on-a-single-market
- Conversational commerce is a strong India-specific route. Bain and Meta's "Win with Conversations" report says more than 650 million Indians are active on social and messaging platforms, while only about 30% shop online, and only about 5 million of 30 million formalized small businesses sell online. Source: https://www.bain.com/insights/win-with-conversations/
- Meta is actively investing in WhatsApp business workflows in India, including payments, calling, and business AI. This validates WhatsApp as a business operating surface for small sellers, but also means Ornava should integrate with the user's WhatsApp workflow rather than compete with WhatsApp itself. Source: https://about.fb.com/news/2025/09/bringing-new-tools-to-help-businesses-boost-engagement-customer-support-and-discoverability/
- AI jewelry photography is already an active category. Tools such as Nimora AI, Rawshot, Scalio, and NeuroViz position around AI jewelry/product photography, fast generation, no photoshoots, model/studio outputs, and ecommerce-ready visuals. Sources: https://nimoraai.com/, https://rawshot.ai/solution/ai-jewelry-product-photography, https://scalio.app/industry/jewelry-product-photography/, https://neuroviz.ai/ai-jewelry-photographer/

### Product Implication

Ornava should not position only as "AI jewelry photography." That category is already forming. The sharper wedge is:

AI catalog image generation for Indian jewelry sellers who sell through WhatsApp and Instagram, with strict design fidelity, mobile-first onboarding, INR/Razorpay monetization, and share-ready outputs.

### Validation Questions For Beta

- Do sellers trust AI-generated jewelry images enough to send them to real buyers?
- Which mode produces the first "I would actually use this" moment: Studio, On-Model, or Close-Up?
- Is a share-ready WhatsApp image more valuable than a high-resolution ecommerce image?
- What output failure is unforgivable: design change, stone change, skin/model realism, lighting, crop, or file format?
- What is the seller's real willingness to pay per usable image or per monthly image volume?

## 11. Open Decisions Before Build Lock

- Pick the minimum supported auth path for Phase 1 beta if Gmail plus OTP is too much scope.
- Decide whether Phase 1 includes only native mobile share-sheet or a dedicated WhatsApp share action.
- Define exact file limits and compression targets for WhatsApp-ready output.
- Define the first fidelity review rubric beyond SSIM.
- Decide whether a first failed generation consumes a credit during beta. Recommendation: no.
- Decide whether onboarding accepts 1 image only or 1-3 images. Recommendation: 1 required, up to 3 allowed.
