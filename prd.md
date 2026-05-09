**ORNAVA**

AI-Powered Jewelry Catalog Generator

Full Product Requirements Document - Phase-by-Phase Launch Plan

────────────────────

| **Version**       | 1.0 - Initial Release                 |
| ----------------- | ------------------------------------- |
| **Status**        | Pre-Launch / Planning                 |
| **Product**       | Ornava SaaS Platform                  |
| **Prepared**      | Product Team                          |
| **Date**          | 2025                                  |
| **Target Market** | India - Jewelry Sellers & Wholesalers |

# **Executive Summary**

Ornava is a SaaS platform that enables jewelers, wholesalers, and social commerce sellers to convert raw product photos into professional, marketing-ready catalog images using AI - at scale, without expensive photoshoots.

The product is pre-launch. This document covers the complete product vision, full feature specifications across all phases, and a step-by-step plan to move from zero to a product that captures early user feedback and iterates toward product-market fit.

**The Core Problem**

A small jeweler needs 200 catalog images for WhatsApp and Instagram every week.

A professional photoshoot costs ₹15,000-₹50,000 per session and takes 3-5 days.

Manual Photoshop editing takes 15-30 minutes per image.

Ornava reduces this to under 10 minutes for 50 images at a fraction of the cost.

# **Market Opportunity & Target Users**

## **Market Context**

- India has 500,000+ registered jewelry businesses, the majority being small to mid-size.
- Instagram and WhatsApp-based jewelry commerce is growing at 35%+ YoY.
- Professional product photography is inaccessible for 80% of these businesses due to cost.
- No Indian-market-focused AI catalog tool exists at the time of writing.

## **Primary User Segments**

| **Segment**                | **Estimated Size** | **Pain Intensity** |
| -------------------------- | ------------------ | ------------------ |
| Segment                    | Size               | Pain Intensity     |
| Small jewelers (1-5 staff) | ~300,000           | Very High          |
| Jewelry wholesalers        | ~80,000            | High               |
| WhatsApp/Instagram sellers | ~120,000           | Very High          |
| Jewelry exporters          | ~20,000            | Medium             |

## **User Pain Points**

- High cost of professional photography (₹15K-₹50K per session)
- Inconsistent image quality across catalog
- Slow turnaround (3-5 days for edited photos)
- No tool designed for Indian jewelry formats and styles
- WhatsApp sharing requires manual image resizing

# **Product Vision & Principles**

## **Vision Statement**

**_"Every jeweler in India should be able to produce studio-quality catalog images in minutes, not days, without ever hiring a photographer."_**

## **Design Principles**

- Speed first - a user must see a generated image within 2 minutes of upload.
- Fidelity above all - no AI alteration of jewelry design, stones, or proportions.
- Mobile-first - target users are phone-first; the UI must be fully usable on mobile.
- WhatsApp-native - outputs are sized and formatted for immediate WhatsApp sharing.
- Minimal friction - onboarding must require no tutorials or setup.

# **Phase Overview - Roadmap at a Glance**

| **Phase** | **Name**         | **Goal**                                            | **Timeline** |
| --------- | ---------------- | --------------------------------------------------- | ------------ |
| Phase 0   | Foundation       | Set up infra, design system, auth, billing skeleton | Weeks 1-2    |
| Phase 1   | Core MVP         | Upload, generate, export - solo user flow           | Weeks 3-6    |
| Phase 2   | Feedback Launch  | Beta with 20-50 real jewelers, collect signal       | Weeks 7-8    |
| Phase 3   | Iterate & Polish | Fix top issues, improve quality, onboarding         | Weeks 9-12   |
| Phase 4   | Growth Features  | Batch, catalog builder, WhatsApp share              | Weeks 13-18  |
| Phase 5   | Monetisation     | Paid plans, credit system, conversion funnel        | Weeks 19-24  |
| Phase 6   | Scale            | Team features, analytics, mobile app                | Month 7-12   |

# **Phase 0 - Foundation (Weeks 1-2)**

Before writing a single feature, the engineering foundation must be solid. Phase 0 is infrastructure-only - no user-facing features.

## **0.1 Tech Stack Decisions**

| **Layer**     | **Technology**                          |
| ------------- | --------------------------------------- |
| Frontend      | Next.js 14 + Tailwind CSS (PWA-ready)   |
| Backend       | Node.js / Express or Next.js API routes |
| Database      | PostgreSQL (Supabase or Railway)        |
| Auth          | NextAuth.js - Gmail OAuth + Phone OTP   |
| Image Storage | Cloudflare R2 or AWS S3                 |
| AI Engine     | fal.ai - openai/gpt-image-2/edit        |
| Queue         | BullMQ + Redis (Upstash)                |
| Payments      | Razorpay (India-first)                  |
| Hosting       | Vercel (frontend) + Railway (backend)   |
| Analytics     | Mixpanel or PostHog (self-hosted)       |

## **0.2 Infrastructure Setup Checklist**

- Create monorepo structure (apps/web, apps/api, packages/shared)
- Set up CI/CD pipeline (GitHub Actions)
- Configure staging and production environments
- Set up Cloudflare R2 buckets (uploads, generated, exports)
- Configure Redis instance for job queues
- Set up Supabase project with initial schema
- Configure Razorpay account and webhook endpoints
- Set up error monitoring (Sentry)
- Set up uptime monitoring (Better Uptime or Uptime Robot)

## **0.3 Database Schema (Initial)**

- users: id, email, phone, name, avatar, created_at, plan, credits_remaining
- images: id, user_id, original_url, status, type, tags, created_at
- generations: id, image_id, mode, output_url, status, credits_used, created_at
- jobs: id, user_id, type, status, progress, payload, created_at
- catalogs: id, user_id, name, layout, image_ids\[\], logo_url, created_at
- subscriptions: id, user_id, plan, credits_total, credits_used, renewal_date
- transactions: id, user_id, amount, credits, razorpay_id, status, created_at

**Phase 0 Exit Criteria**

✓ All services running in staging environment

✓ Auth flow working (Gmail + OTP)

✓ Image can be uploaded and stored

✓ One test generation succeeds via fal.ai

✓ Razorpay test payment goes through

# **Phase 1 - Core MVP (Weeks 3-6)**

Phase 1 builds the minimum end-to-end user flow: a jeweler can sign up, upload photos, generate AI images, and download the results. Nothing more.

## **1.1 Authentication & Onboarding**

### **Login Methods**

- Gmail OAuth via NextAuth
- Phone number + OTP via Twilio or MSG91
- Auto-create user account on first login

### **Onboarding Flow (5 steps max)**

- Welcome screen - 1 sentence value prop + CTA
- Upload 1-3 sample images
- Select generation mode (On-Model / Studio / Close-Up)
- Watch preview generate in real time
- See result - prompt to continue with free credits

**Critical Onboarding Rule**

The user must see a generated image within 90 seconds of signup.

This is the single most important activation metric for Ornava.

If the first generation takes more than 2 minutes, onboarding must show a progress animation and estimated wait time.

## **1.2 Image Upload**

- Drag-and-drop upload zone
- Click to select files
- Supported: JPG, PNG
- Max file size: 20MB per image
- Upload progress indicator per file
- Client-side validation (format, size)
- Uploaded images stored in Cloudflare R2
- Thumbnail generated and cached on upload

## **1.3 AI Generation Engine**

### **Provider**

fal.ai - openai/gpt-image-2/edit API. Prompts are constructed server-side. Users never write prompts directly.

### **Generation Modes**

| **Mode** | **Description**                                                        |
| -------- | ---------------------------------------------------------------------- |
| On-Model | Jewelry worn by a model. Realistic skin contact, natural lighting.     |
| Studio   | Product on clean luxury background. White, cream, or gradient surface. |
| Close-Up | Macro photography style. Extreme detail, texture enhancement.          |

### **Prompt Architecture**

Prompts are templated server-side based on: (a) generation mode, (b) product type tag, (c) category tag. Example:

_"Professional jewelry catalog photo. \[PRODUCT TYPE\] in \[CATEGORY\] style. The jewelry must appear EXACTLY as in the input image - no design changes, no added stones, no shape modifications. \[MODE-SPECIFIC INSTRUCTIONS\]. Studio lighting, high-resolution, luxury catalog aesthetic."_

### **Fidelity Constraints (Non-Negotiable)**

- No shape changes to jewelry
- No added or removed stones
- Maintain proportions and fine details
- If fidelity score (SSIM) falls below threshold, flag for user review

## **1.4 Generation Status & Results**

- Pending → Processing → Completed / Failed
- Polling every 3 seconds on the frontend
- Success: display original + generated side by side
- Failure: show reason + one-tap retry
- All results stored in generations table with output URL

## **1.5 Download**

- Download single generated image (full resolution)
- Download original alongside generated
- File naming: ornava\_{product_code}\_{mode}\_{timestamp}.jpg

**Phase 1 Exit Criteria**

✓ User can sign up via Gmail or phone

✓ User can upload a jewelry photo

✓ AI generates an output in one of three modes

✓ User can download the result

✓ End-to-end flow works on mobile browser

# **Phase 2 - Feedback Launch (Weeks 7-8)**

The product is not launched publicly. Phase 2 is a controlled beta with 20-50 real jewelers recruited manually. The goal is feedback signal, not growth.

## **2.1 Beta Recruitment Strategy**

### **Where to find beta users**

- WhatsApp jewelry seller groups (request admins for 5-minute demo)
- Instagram DMs to accounts with 1K-10K followers selling jewelry
- Physical visits to local jewelry markets (Indore, Surat, Jaipur)
- Referrals from first 5 users ("Invite a jeweler friend, both get 50 free credits")

### **Beta Onboarding Package**

- Personal WhatsApp onboarding call (15 minutes)
- Simple PDF guide with screenshots
- Direct WhatsApp support number for issues
- 100 free credits for the beta period

## **2.2 Feedback Collection System**

### **In-app feedback**

- Thumbs up / thumbs down on every generated image
- Optional: 1-tap reason if thumbs down (Wrong design / Unrealistic / Too dark / Other)
- Weekly NPS prompt after 5th generation

### **Qualitative feedback**

- 1-on-1 WhatsApp call after first week of use
- Google Form survey at end of beta (10 questions)
- Screen recording request for 3-5 willing users (observe real usage)

## **2.3 Key Feedback Questions**

- Does the jewelry design stay accurate in outputs?
- Is the output quality good enough to use in real catalogs?
- How does the speed compare to your current process?
- Which generation mode do you use most?
- What would make you pay for this?
- What is the single most frustrating thing about the current version?

## **2.4 Analytics to Track (Phase 2)**

| **Metric**               | **Definition**                             |
| ------------------------ | ------------------------------------------ |
| Activation rate          | % of signups who complete first generation |
| Time to first gen        | Minutes from signup to seeing first output |
| Fidelity thumbs up rate  | % of outputs rated positively              |
| Retry rate               | % of outputs that are regenerated          |
| D7 retention             | % of beta users who return after 7 days    |
| Images per user per week | Usage depth metric                         |

**Phase 2 Exit Criteria**

✓ 20+ beta users have generated at least 10 images each

✓ Fidelity thumbs-up rate > 70%

✓ D7 retention > 40%

✓ Top 3 issues identified and prioritised

✓ At least 5 users say they would pay for the product

# **Phase 3 - Iterate & Polish (Weeks 9-12)**

Based on Phase 2 feedback, Phase 3 fixes the top issues and raises quality before any public launch.

## **3.1 Expected Issues to Fix (Predicted)**

- Jewelry distortion on complex pieces (multi-stone, filigree work)
- On-model skin tone mismatch for darker skin tones
- Generation time spikes during peak hours
- Mobile UI bugs on lower-end Android devices
- Unclear error messages on generation failure

## **3.2 Quality Improvements**

- Add per-product-type prompt fine-tuning (necklaces vs rings vs earrings behave differently)
- Implement SSIM-based auto-fidelity check - flag low-fidelity outputs automatically
- Add variation generation: 3 outputs per image instead of 1, user picks best
- Before/after comparison slider on results screen

## **3.3 UX Improvements**

- Simplify onboarding to 3 steps maximum based on drop-off data
- Add loading state with progress percentage and estimated time
- Add "Why did this fail?" explanations in plain language
- Improve mobile image upload (camera capture + gallery both work seamlessly)
- Add WhatsApp share button on every generated image

## **3.4 Infrastructure Hardening**

- Add auto-retry for failed jobs (up to 3 attempts)
- Implement rate limiting per user to prevent abuse
- Add queue position display ("Your image is #4 in queue")
- Set up Cloudflare CDN for generated image delivery

**Phase 3 Exit Criteria**

✓ Fidelity thumbs-up rate improved to > 80%

✓ Generation failure rate < 5%

✓ Mobile flow fully functional on Android (Chrome)

✓ Before/after slider live

✓ WhatsApp share working

# **Phase 4 - Growth Features (Weeks 13-18)**

Phase 4 adds the features that turn Ornava from a novelty into a weekly workflow tool for jewelers.

## **4.1 Batch Processing**

- Select multiple images (up to 50) and apply the same generation mode
- Queue-based processing with real-time status per image
- Batch summary page: X completed, Y processing, Z failed
- Bulk download as ZIP
- Pause / cancel batch at any time

## **4.2 Inventory Management**

- Image grid view with filter by: status, product type, category, date
- Tag management UI (add/edit/remove tags)
- View all generations for a given product image
- Soft-delete with restore within 30 days
- Storage usage indicator

## **4.3 Catalog Builder**

### **Layout Templates**

- 2x2 grid - 4 products per page
- 3x3 grid - 9 products per page
- Single highlight card - 1 hero product
- Story format - optimized for Instagram/WhatsApp Stories

### **Customization Options**

- Upload brand logo - auto-placed in corner
- Add price (optional, editable per image)
- Add product code / SKU
- Choose background color for catalog pages
- Choose font style (3 options: classic, modern, bold)

### **Export Formats**

- Image bundle (ZIP of individual JPGs)
- PDF catalog (multi-page)
- WhatsApp-optimized images (< 2MB, correct aspect ratio)
- Facebook Ads creative (1080x1080, 1200x628)

## **4.4 Sharing & Distribution**

- One-tap WhatsApp share for single image
- Shareable catalog link (public URL, no login required for viewer)
- Catalog link expiry settings (7 days / 30 days / permanent)
- View count on shared catalog links

**Phase 4 Exit Criteria**

✓ Batch of 50 images processed in < 10 minutes

✓ Catalog builder produces a downloadable PDF

✓ WhatsApp share works in one tap

✓ Shareable catalog link opens correctly on mobile

# **Phase 5 - Monetisation (Weeks 19-24)**

Phase 5 activates the credit and subscription system. The product should have demonstrated clear value before asking users to pay.

## **5.1 Pricing Plans**

|                   | **Starter** | **Growth** | **Pro**     |
| ----------------- | ----------- | ---------- | ----------- |
| Monthly credits   | 200         | **1,000**  | Unlimited\* |
| Price (INR/month) | Free trial  | **₹799**   | ₹1,999      |
| Price (USD/month) | -           | **\$9.99** | \$24.99     |
| Batch processing  | No          | **Yes**    | Yes         |
| Catalog builder   | No          | **Yes**    | Yes         |
| WhatsApp share    | Yes         | **Yes**    | Yes         |
| Watermark         | Yes         | **No**     | No          |
| Priority queue    | No          | **No**     | Yes         |
| Team seats        | 1           | **1**      | 3           |

\* Fair use policy applies. Unlimited = up to 5,000 images/month.

## **5.2 Credit System**

- 1 credit = 1 generated image
- Batch processing deducts credits per image in the batch
- Credits top up automatically on renewal date
- Credits do not roll over (use them or lose them)
- Credit usage visible in real-time in the top bar
- Alert at 80% usage: in-context upgrade prompt
- Alert at 100%: hard wall with upgrade CTA

## **5.3 Conversion Strategy**

### **Free-to-Paid Triggers**

- In-context upgrade prompt when credits reach 80%
- Feature gate teaser: "Batch processing is available on Growth" with preview mockup
- Watermark removal offer after user downloads 5+ images
- Annual plan discount (20% off) shown at first upgrade attempt

### **Referral Program**

- Give 20 credits, get 20 credits (both parties benefit)
- Shareable referral link auto-generated per user
- Referral leaderboard for top referrers (gamification)

## **5.4 Razorpay Integration**

- One-time credit top-up purchases
- Monthly and annual subscription management
- Automatic webhook handling for payment events
- Invoice generation for GST compliance
- Payment failure recovery flow

**Phase 5 Exit Criteria**

✓ 10+ paying users within 2 weeks of paywall activation

✓ Free-to-paid conversion rate > 8%

✓ Razorpay payments + invoices working correctly

✓ Credit deduction and limit enforcement working

# **Phase 6 - Scale (Month 7-12)**

Phase 6 is post-PMF scaling. Features here are conditional on Phase 5 proving sustainable revenue.

## **6.1 Mobile App (PWA → Native)**

- Phase 6a: PWA improvements - add to home screen, offline queue, push notifications
- Phase 6b: React Native app for Android (primary target market)
- Phase 6c: iOS app
- Camera capture for immediate upload from phone camera

## **6.2 Team & Collaboration Features**

- Workspace with multiple seats (owner, editor, viewer roles)
- Shared inventory and catalog access
- Image approval workflow: editor generates, owner approves
- Activity log per workspace

## **6.3 Advanced Generation**

- ControlNet integration for precision jewelry placement on model
- Custom model skin tone selection (6 options)
- Background customization: choose from 20 studio backgrounds
- Style presets: Bridal Gold, Minimalist Silver, Royal Kundan, Modern Diamond

## **6.4 Analytics Dashboard**

- Per-catalog link analytics: views, time spent, most-viewed products
- Generation quality trends over time
- Credit usage forecasting ("at current pace, credits run out in X days")
- Top-performing product types by output quality score

## **6.5 Integrations & Distribution**

- WhatsApp Business API integration for direct catalog broadcast
- Facebook Ads Manager direct upload
- Shopify app for direct product image publishing
- Multi-language catalogs (Hindi, Gujarati, English)

**Phase 6 Entry Conditions**

• MRR > ₹1,00,000 (Phase 5 proven)

• WAU > 500 active users

• NPS score > 40

• Core fidelity score consistently > 85%

# **Launch Strategy - Getting First Feedback**

The product is not launched yet. This section outlines the specific steps to go from zero to your first real users providing real feedback.

## **Step 1: Pre-Launch Setup (Before Phase 2)**

- Build a simple landing page at ornava.in with: headline, 60-second demo video, email waitlist form.
- Create a WhatsApp Business number dedicated to Ornava support.
- Create a Google Form for beta applicant screening (business type, monthly photo needs, city).
- Set up PostHog or Mixpanel with event tracking from day one.
- Prepare a demo video using real jewelry images - 60 seconds, no narration needed, just show the transformation.

## **Step 2: Waitlist Building (2 Weeks Before Beta)**

- Post the demo video in 5-10 WhatsApp jewelry seller groups with a soft CTA to join the waitlist.
- DM 50 jewelry Instagram accounts with < 50K followers - offer free beta access.
- Post in IndiaMART seller forums.
- Visit 2-3 local jewelry markets and show a live demo on a phone.
- Target: 100-200 waitlist signups before beta opens.

## **Step 3: Controlled Beta Invite (Phase 2 Begin)**

- Send personal WhatsApp invites to top 30 waitlist signups.
- Onboard each with a 15-minute WhatsApp call.
- Give them 100 free credits and your direct number for issues.
- Check in after 3 days with: "Have you tried it? What's your first impression?"

## **Step 4: Feedback Loop (Phase 2 Running)**

- Monitor in-app thumbs up/down daily.
- Do 5-10 qualitative calls in Week 2 of beta.
- Ship fixes weekly - tell users when their feedback caused a change.
- Create a private WhatsApp group for beta users - community builds loyalty.

## **Step 5: Public Soft Launch (After Phase 3)**

- Open self-serve signup with free tier (20 credits).
- Post a "we built this" story on LinkedIn and Twitter/X.
- Submit to ProductHunt (schedule for a Tuesday or Wednesday).
- Ask top beta users to post a WhatsApp status showing a transformation.
- Target: 500 signups in the first week of public launch.

**The Single Most Important Launch Rule**

Do NOT launch publicly until at least 5 beta users say they would be "very disappointed" if Ornava went away.

This is the Rahul Vohra / Sean Ellis PMF test.

If you hit 40%+ "very disappointed" in your beta survey, you have product-market fit signal. Launch confidently.

If not, stay in Phase 3 and keep iterating.

# **Non-Functional Requirements**

## **Performance**

| **Requirement**         | **Target**                             |
| ----------------------- | -------------------------------------- |
| Single image generation | < 45 seconds p95                       |
| Batch of 50 images      | < 10 minutes total                     |
| Page load (LCP)         | < 2.5 seconds on 4G                    |
| Image upload (10MB)     | < 5 seconds on 4G                      |
| API response time       | < 200ms p95 (non-generation endpoints) |

## **Reliability**

- Uptime target: 99.5% monthly
- Auto-retry failed generation jobs up to 3 times
- Graceful degradation if fal.ai is unavailable (queue jobs, notify user)
- Database backups every 6 hours

## **Security**

- All images stored in private R2 buckets - no public URLs without signed tokens
- JWT-based session management with 7-day expiry
- Rate limiting on all API endpoints
- GDPR-lite: user can delete all their data from the account settings page
- No images shared across users - strict row-level security in Supabase

## **Scalability**

- Stateless API servers - horizontally scalable
- Queue-based generation - scales independently of web tier
- Cloudflare CDN for all generated image delivery
- Database connection pooling via PgBouncer

# **Risks & Mitigation**

| **Risk**                  | **Impact**                                     | **Mitigation**                                                                                                   |
| ------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Jewelry design distortion | Core value prop fails, users churn immediately | SSIM fidelity check, per-type prompt tuning, variation selection (pick best of 3)                                |
| fal.ai downtime           | Generations unavailable, user frustration      | Job queue holds jobs, notify users, fallback to manual queue with email notification                             |
| Slow generation speed     | Users abandon mid-flow                         | Progress indicator with ETA, async flow (generate in background + notify)                                        |
| Low beta retention        | No signal to iterate from                      | Personal onboarding call, WhatsApp support, beta community group                                                 |
| Low paid conversion       | Revenue doesn't materialise                    | Defer paywall until NPS > 40; test pricing with beta cohort first                                                |
| Competitor enters market  | Commoditisation risk                           | Move fast, build India-specific features (Razorpay, Hindi, WhatsApp-native), lock in top users with annual plans |
| Storage costs spike       | Unit economics break                           | Compress generated images to < 500KB, delete original uploads after 90 days (with user consent)                  |

# **Success Metrics by Phase**

| **Phase** | **Metric**               | **Target**                             |
| --------- | ------------------------ | -------------------------------------- |
| Phase 1   | Time to first generation | < 90 seconds from signup               |
| Phase 1   | Generation success rate  | \> 90%                                 |
| Phase 2   | Beta activation rate     | \> 80% of invitees generate 10+ images |
| Phase 2   | Fidelity thumbs-up rate  | \> 70%                                 |
| Phase 2   | D7 retention             | \> 40%                                 |
| Phase 3   | Fidelity thumbs-up rate  | \> 80%                                 |
| Phase 3   | Generation failure rate  | < 5%                                   |
| Phase 4   | Images per user per week | \> 50 for active users                 |
| Phase 4   | Batch usage rate         | \> 40% of active users use batch       |
| Phase 5   | Free-to-paid conversion  | \> 8%                                  |
| Phase 5   | MRR                      | ₹50,000 within 60 days of paywall      |
| Phase 6   | WAU                      | \> 500                                 |
| Phase 6   | NPS                      | \> 40                                  |

# **Appendix - Out of Scope & Future Considerations**

## **Out of Scope (All Phases through Phase 5)**

- Video generation or product reels
- AR try-on features
- Advanced manual image editing tools (crop, filters, etc.)
- ERP or full inventory management system
- Direct marketplace listing (Flipkart, Amazon)
- AI-generated ad copy or product descriptions

## **Phase 7+ Considerations (Not Committed)**

- International expansion (Middle East, Southeast Asia)
- White-label version for jewelry software resellers
- API access for enterprise users
- AI-generated ad copy and product descriptions
- Integration with Indian e-commerce platforms (Meesho, IndiaMART)
- Physical sample catalog printing fulfillment

## **Open Questions (To Be Resolved in Phase 2)**

- Should users be able to provide style feedback in natural language, or are 3 modes sufficient?
- Is a watermark on free tier acceptable to Indian jewelers, or will it kill adoption?
- Should pricing be in INR only, or dual INR/USD from launch?
- Is phone OTP login alone sufficient, or is Gmail OAuth important for the target user?

_This document is a living artifact. Update it after every phase._

**ORNAVA - Confidential Product Document - 2025**