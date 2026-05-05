# Admin Email Marketing Architecture & Implementation Plan

## Overview
The goal is to build a robust, AI-powered Email Marketing and Newsletter tool directly into the AntiAI.me Admin Panel. This will allow the administrative team to communicate with all registered creators, push updates, provide marketing materials, and drive engagement.

## Expert Feature Suggestions
To make this a world-class email marketing tool (competing with Mailchimp/Sendgrid) built natively into our app, I recommend the following features:

1. **AI "Magic" Content Generation**:
   - Integration with an LLM API (OpenAI/Anthropic) to automatically draft marketing emails based on a single prompt (e.g., "Write an email to Elite users about our new Shorts support").
   - AI Subject Line generator to A/B test high open rates.

2. **WYSIWYG Drag-and-Drop Builder**:
   - A block-based visual editor (using libraries like `grapesjs` or `react-email`).
   - Pre-built, brand-aligned templates (Dark mode, Neon green accents, AntiAi.me logos pre-loaded).
   - Instant HTML/MJML rendering.

3. **Smart Audience Segmentation**:
   - Filter recipients dynamically based on Prisma database relations.
   - Example segments: "Free users with 0 verified videos", "Elite Subscribers", "Users who haven't logged in for 30 days".
   - Avoid spamming the entire database when targeted messaging works better.

4. **Analytics & Tracking**:
   - Open rates, click-through rates (CTR), and bounce tracking.
   - Track conversions directly within the platform.

5. **Asynchronous Background Processing**:
   - Sending 100k+ emails cannot block the Node.js event loop.
   - We must use a Redis-backed queue system (like `BullMQ`) to dispatch bulk emails asynchronously with retry logic and rate-limiting (to avoid AWS SES/Sendgrid blocks).

---

## Technical Stack
*   **Frontend (Admin Panel):** Next.js, React-Email (for building components), Novel or TipTap (for rich text), TailwindCSS.
*   **Backend:** NestJS, BullMQ (Redis Queues), Prisma ORM (for audience querying).
*   **Email Provider:** Resend, SendGrid, or AWS SES.
*   **AI Provider:** OpenAI or Anthropic API.

---

## Database Schema Additions (Prisma)
We will need to add the following models to `packages/database/prisma/schema.prisma`:
*   `EmailCampaign`: Tracks the campaign name, subject, HTML content, status (draft, scheduled, sent), and target audience segment.
*   `EmailTemplate`: Reusable base designs.
*   `EmailEvent`: Tracks opens, clicks, and bounces.

---

## Implementation Tasks

### Phase 1: Database & Queues
- [ ] Define `EmailCampaign`, `EmailTemplate`, and `EmailEvent` models in Prisma.
- [ ] Run Prisma migration.
- [ ] Set up BullMQ in the NestJS API for background task processing.
- [ ] Create the `EmailWorker` to consume jobs from the queue and interface with the SMTP/API provider.

### Phase 2: Core API Endpoints
- [ ] `POST /admin/emails/campaigns` - Create new draft.
- [ ] `PUT /admin/emails/campaigns/:id` - Update content/audience.
- [ ] `POST /admin/emails/campaigns/:id/send` - Enqueue to BullMQ.
- [ ] `GET /admin/users/segments` - Query users based on subscription plan or activity.

### Phase 3: AI Integration
- [ ] Create an `AiService` in NestJS.
- [ ] `POST /admin/emails/generate` - Accept a prompt and return HTML/Markdown formatted email body.
- [ ] `POST /admin/emails/generate-subject` - Generate catchy subject lines.

### Phase 4: Admin UI Builder (Next.js)
- [ ] Create the Email Campaigns list view (`/admin/emails`).
- [ ] Build the WYSIWYG Editor using `react-email` or `TipTap`.
- [ ] Integrate the "Generate with AI" magic wand button in the editor toolbar.
- [ ] Build the Audience Selector modal (filtering via Prisma queries).
- [ ] Add the "Send Test Email" functionality.

### Phase 5: Analytics
- [ ] Implement tracking pixels in outbound emails.
- [ ] Create webhook handler in API to receive SendGrid/Resend delivery events.
- [ ] Build the Campaign Analytics dashboard view.
