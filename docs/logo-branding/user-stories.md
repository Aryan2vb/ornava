# Logo Branding — User Stories

## Epic Hypothesis

**We believe that** allowing jewelers to upload their shop logo and auto-apply it to every generated image  
**will result in** higher WhatsApp share rates and stronger perceived ownership of outputs  
**We will know we are right when** share-per-generation rate increases by 20% and logo upload adoption reaches 60% of active users within 30 days.

---

### User Story 001:

- **Summary:** Upload shop logo to brand all generated images

#### Use Case:
- **As a** jeweler using Ornava for the first time
- **I want to** upload my shop logo in my profile settings
- **so that** every generated image automatically carries my branding when I share it with customers

#### Acceptance Criteria:
- **Scenario:** Jeweler uploads a supported logo from their phone gallery
- **Given:** I am on the Profile > Logo Settings screen
- **and Given:** I have a PNG, JPG, or WebP file (≤10MB) on my device
- **When:** I tap "Upload Logo" and select the file
- **Then:** The logo is uploaded to R2, a preview shows it overlaid on a sample image, and my logo settings are saved as enabled

---

### User Story 002:

- **Summary:** Choose logo position on generated images

#### Use Case:
- **As a** jeweler who has uploaded their logo
- **I want to** pick where my logo appears on the image (corner/center-bottom)
- **so that** the logo doesn't cover the jewelry and looks professional

#### Acceptance Criteria:
- **Scenario:** Jeweler selects bottom-right position from the visual picker
- **Given:** I am on the Logo Settings screen with a logo already uploaded
- **and Given:** I see a visual position picker showing 5 options (4 corners + center-bottom)
- **When:** I tap the "bottom-right" position option
- **Then:** The preview updates in real-time showing my logo in the bottom-right corner, and the setting is persisted

---

### User Story 003:

- **Summary:** Adjust logo size on generated images

#### Use Case:
- **As a** jeweler who has uploaded their logo
- **I want to** adjust how big or small my logo appears on the output
- **so that** it's visible but doesn't dominate the jewelry image

#### Acceptance Criteria:
- **Scenario:** Jeweler drags the size slider to 15%
- **Given:** I am on the Logo Settings screen with a logo uploaded
- **and Given:** I see a size slider (range: 8%–25% of image width)
- **When:** I drag the slider to 15%
- **Then:** The preview updates showing the logo at 15% of image width, and the setting is saved

---

### User Story 004:

- **Summary:** See live preview of logo placement before generating

#### Use Case:
- **As a** jeweler configuring their logo settings
- **I want to** see a realistic preview of how my logo will look on a generated image
- **so that** I can be confident it looks good before I spend credits

#### Acceptance Criteria:
- **Scenario:** Preview updates as jeweler changes position and size
- **Given:** I have uploaded a logo and I'm on the Logo Settings screen
- **and Given:** A sample jewelry image is shown with my logo overlaid
- **When:** I change position or size settings
- **Then:** The preview updates within 200ms reflecting the new placement without a network request

---

### User Story 005:

- **Summary:** Generated images automatically include my logo

#### Use Case:
- **As a** jeweler with logo settings configured
- **I want to** receive every generated image with my logo already applied
- **so that** I can immediately share branded images on WhatsApp without extra steps

#### Acceptance Criteria:
- **Scenario:** Generation completes with logo composited
- **Given:** I have a logo uploaded with enabled=true and position=bottom-right, size=12%
- **and Given:** I submit a generation request
- **When:** The AI generation completes
- **Then:** The output image stored in R2 has my logo composited at the configured position and size

---

### User Story 006:

- **Summary:** Download image without logo when needed

#### Use Case:
- **As a** jeweler viewing a completed generation
- **I want to** have the option to download the clean (no-logo) version
- **so that** I can use the image for other purposes like printing or a different brand context

#### Acceptance Criteria:
- **Scenario:** Jeweler downloads the clean version from the result screen
- **Given:** I am on the result screen viewing a branded (logo-applied) generation
- **and Given:** I see a secondary "Download without logo" option
- **When:** I tap "Download without logo"
- **Then:** The clean version (without logo overlay) is downloaded to my device

---

### User Story 007:

- **Summary:** Nudge to upload logo for users who haven't set one up

#### Use Case:
- **As a** jeweler who hasn't uploaded a logo yet
- **I want to** be reminded that I can brand my images
- **so that** I discover the feature and start sharing professional-looking catalogs

#### Acceptance Criteria:
- **Scenario:** First-time result screen shows logo nudge banner
- **Given:** I have completed a generation but have no logo uploaded
- **and Given:** I am on the result screen
- **When:** The result loads
- **Then:** A dismissible banner appears: "Add your shop logo → branded images" with a link to Logo Settings
