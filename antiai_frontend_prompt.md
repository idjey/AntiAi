# AntiAI.me — Frontend Engineering Prompt
## Pricing Page Redesign: New Tiers, Copy, and Conversion Optimisation

**Context for the AI / developer reading this:**
You are redesigning the `/pricing` page of AntiAI.me — a cryptographic video
verification service for YouTube and TikTok creators. The current page uses
generic SaaS copy and buries the core value proposition (Ed25519 tamper-proof
video badges). This prompt covers all frontend changes needed.

Stack assumption: Next.js (or equivalent React SSR framework), Tailwind CSS,
existing design system variables. Adapt as needed for your actual stack.

---

## SECTION 1 — Page Structure (top to bottom)

Redesign the pricing page in this exact order:

```
1. Trust bar (social proof numbers)
2. Headline + subheadline
3. Billing toggle (Monthly / Yearly)
4. Pricing tier cards (5 tiers)
5. Full feature comparison table
6. FAQ section
7. Enterprise CTA strip
```

---

## SECTION 2 — Trust Bar (NEW — add above headline)

Add a horizontal strip of 3–4 real-time stats above the headline.
Pull these numbers from your API or hardcode and update weekly until
you have a live endpoint.

```tsx
// TrustBar component
const stats = [
  { value: '12,400+', label: 'Videos verified' },
  { value: '340+',    label: 'Creators protected' },
  { value: '38',      label: 'Countries' },
  { value: '5',       label: 'Browsers supported' },
];
```

Visual style: single horizontal row, subtle background, small caps labels,
medium-weight numbers. No icons needed — numbers alone carry the weight.

---

## SECTION 3 — Headline + Subheadline

**Replace the current "Simple, transparent pricing." headline with:**

```
Headline (H1):
"Prove every video is really you."

Subheadline (H2 or paragraph):
"Cryptographic verification — not just a checkmark.
One badge that makes deepfakes provably impossible to fake."
```

Below the subheadline, add a single line in a muted colour:
```
"Start free. No credit card required. Upgrade when your audience grows."
```

---

## SECTION 4 — Billing Toggle

Keep the existing Monthly / Yearly toggle. Update the "Yearly" label:

```
BEFORE: "Yearly — Save up to $120"
AFTER:  "Yearly ✦ Save up to 20%"
```

When "Yearly" is selected, show the per-plan saving prominently
UNDER each card's price (not just in the header):

```tsx
// Under the price, when yearly is selected:
<span className="text-xs text-green-600 font-medium">
  Save ${yearlySaving}/year
</span>
```

Per-plan yearly savings to display:
- Pro:      "Save $60/year"
- Business: "Save $120/year"
- Elite:    "Save $240/year"

---

## SECTION 5 — Pricing Tier Cards

### Card layout (apply to all tiers)

Each card contains, top to bottom:
1. Tier name + optional badge ("Most Popular" / "New")
2. Price + period
3. Yearly saving line (if yearly toggle active)
4. Tier tagline (1 sentence — see below)
5. CTA button
6. Divider line
7. Feature list (leading with verification features, then creator page features)

### Tier 1 — Free

```
Name:     Free
Price:    $0 / forever
Tagline:  "See how verified content looks before you commit."
CTA:      "Get Started Free"
CTA URL:  /signup?plan=FREE

Features (in this order):
✓ View cryptographic badges on verified videos
✓ 5 verified videos per month
✓ Public creator profile page
✓ 1 shop product
✓ Basic colour themes
✗ Cannot issue proofs beyond 5/mo
✗ AntiAI.me badge shown on your content

Note under free features (small, muted text):
"Free proofs display the AntiAI.me badge. Upgrade to hide it."
```

### Tier 2 — Pro (Most Popular badge)

```
Name:     Pro
Badge:    "Most Popular"
Price:    $24.99/mo  |  $19.99/mo (yearly, billed $239.88)
Tagline:  "For creators who've been deepfaked — or don't want to be."
CTA:      "Upgrade to Pro"
CTA URL:  /signup?plan=PRO&interval=month (or year)
CTA style: Primary filled button (your brand colour)

Features (in this order — VERIFICATION FIRST):
✓ Cryptographic proof badge on every video
✓ 100 verified videos per month
✓ Tamper-proof Ed25519 digital signature
✓ Public verification URL for every video
✓ Analytics dashboard
✓ Unlimited shop products
✓ Custom backgrounds & effects
✓ Change your @handle
✓ Email support
✗ Live Proof challenges (Business+)
✗ Custom domain (Business+)
```

### Tier 3 — Business (NEW — "New" badge)

```
Name:     Business
Badge:    "New"
Price:    $49.99/mo  |  $39.99/mo (yearly, billed $479.88)
Tagline:  "For high-volume creators and agencies managing multiple channels."
CTA:      "Upgrade to Business"
CTA URL:  /signup?plan=BUSINESS&interval=month (or year)
CTA style: Secondary outlined button

Features (in this order):
✓ Everything in Pro
✓ 500 verified videos per month
✓ Live Proof challenges (liveness verification)  ← HERO FEATURE
✓ Custom domain for your creator profile
✓ API access (10,000 calls/month)
✓ Priority email support
✗ White-label badge (Elite only)
✗ Unlimited API calls (Elite only)
```

Add a callout inside the Business card explaining Live Proof:
```tsx
<div className="rounded-lg bg-blue-50 border border-blue-100 p-3 my-3 text-xs text-blue-800">
  <strong>Live Proof</strong> — Issue a real-time liveness challenge
  that proves you're genuinely on camera. Viewers can verify it
  instantly. No competitor offers this.
</div>
```

### Tier 4 — Elite

```
Name:     Elite
Price:    $99.99/mo  |  $79.99/mo (yearly, billed $959.88)
Tagline:  "Unlimited everything. Your reputation, fully protected."
CTA:      "Upgrade to Elite"
CTA URL:  /signup?plan=ELITE&interval=month (or year)

Features (in this order):
✓ Everything in Business
✓ Unlimited verified videos
✓ Unlimited API calls
✓ White-label badge (hide AntiAI.me branding)
✓ Transparency log export (PDF/CSV)
✓ Featured in creator directory
✓ Dedicated support
```

### Tier 5 — Enterprise (NEW card — different visual style)

```
Name:     Enterprise
Style:    Full-width dark/muted card below the 4 main cards
Price:    Custom pricing
Tagline:  "For newsrooms, talent agencies, political campaigns,
           and legal evidence authentication."
CTA:      "Contact Us"
CTA URL:  /enterprise  (or a Calendly / Typeform link)

Features to highlight (2-column layout inside card):
✓ Everything in Elite          ✓ Bulk creator seats
✓ SLA guarantee (99.9% uptime) ✓ Custom key management
✓ White-label badge + domain   ✓ Compliance reporting
✓ Dedicated account manager    ✓ Custom contract terms

Logos or client category icons:
[Newsroom icon] Broadcast & Print
[Campaign icon] Political Campaigns
[Agency icon]   Talent Agencies
[Legal icon]    Legal Evidence Auth

Below logos, add a single trust line:
"Starting from $2,000/month. Average contract: $5,000/month."
```

---

## SECTION 6 — Full Feature Comparison Table

Below the pricing cards, add a collapsed/expandable comparison table.
Default state: collapsed with a "Compare all features" toggle button.

Table structure:

```
Feature                          Free    Pro     Business  Elite   Enterprise
─────────────────────────────────────────────────────────────────────────────
VERIFICATION
Verified videos per month         5      100      500       ∞          ∞
Cryptographic proof badge         ✓       ✓        ✓        ✓          ✓
Ed25519 digital signature         ✓       ✓        ✓        ✓          ✓
Public verification URL           ✓       ✓        ✓        ✓          ✓
Live Proof challenges             –       –        ✓        ✓          ✓
Proof expiry                    90 days  1yr      1yr      1yr        Custom
White-label badge                 –       –        –        ✓          ✓
Transparency log export           –       –        –        ✓          ✓

CREATOR PAGE
Shop products                     1       ∞        ∞        ∞          ∞
Custom backgrounds & effects      –       ✓        ✓        ✓          ✓
Change @handle                    –       ✓        ✓        ✓          ✓
Custom domain                     –       –        ✓        ✓          ✓
Featured in directory             –       –        –        ✓          ✓

ANALYTICS & API
Analytics dashboard               –       ✓        ✓        ✓          ✓
API access (calls/month)          –       –      10,000     ∞          ∞

SUPPORT
Email support                     –       ✓        ✓        ✓          ✓
Priority support                  –       –        ✓        ✓          ✓
Dedicated account manager         –       –        –        –          ✓
SLA guarantee                     –       –        –        –          ✓
```

Implementation note: use `✓` (green), `–` (grey dash), and `∞` (infinity symbol).
Highlight the Business column with a subtle left/right border to draw the eye.

---

## SECTION 7 — FAQ Section

Add below the comparison table. Use an accordion/expand pattern.
Include exactly these questions and answers:

```
Q: What happens to my verified videos if I cancel?
A: All proofs you've issued remain valid and publicly verifiable — forever.
   Cancelling your subscription stops new proof issuance, but never
   invalidates existing ones. Your viewers can still verify past videos.

Q: Can YouTube or TikTok see my verification?
A: No. AntiAI.me operates independently of platforms using a browser
   extension. Verification happens client-side in the viewer's browser —
   platforms have no visibility into our cryptographic layer.

Q: How is this different from YouTube's AI disclosure labels?
A: YouTube's labels are self-reported. Our badges are cryptographically
   signed — mathematically impossible to fake without your private key.
   They prove the video was uploaded by you, from your verified channel,
   at a specific point in time. No platform label offers this level of proof.

Q: What is "Live Proof" and why does it matter?
A: Live Proof (Business+) lets you issue a real-time challenge during a
   livestream or video — a random object or phrase that proves you're
   genuinely on camera at that moment. It's the only way to prove
   real-time authenticity. No deepfake can respond to an unknown challenge.

Q: Is my content stored by AntiAI.me?
A: No. We never store your video files. We sign cryptographic metadata
   about your video (channel ID, video ID, timestamp) — not the content
   itself. Your videos stay entirely on YouTube or TikTok.

Q: What happens if my signing keys are compromised?
A: We can instantly revoke any proof and issue new ones. Our transparency
   log records every issuance and revocation publicly, so anyone can audit
   the history of your verified content.

Q: Do you offer refunds?
A: Yes — 14-day full refund, no questions asked. Contact support@antiai.me.
```

---

## SECTION 8 — Enterprise CTA Strip

Add a full-width strip at the very bottom of the pricing page, above the footer:

```
Background: dark (your brand dark colour or near-black)
Content (centered):

Headline: "Protecting content at scale?"
Subtext:  "Newsrooms, talent agencies, and political campaigns
           use AntiAI.me to verify content across entire rosters
           of creators. Custom pricing, SLA, and dedicated support."
CTA:      [Book a Demo →]   [View Enterprise Features →]

Trust line (small, muted):
"Trusted by creators in 38 countries. No credit card required to start."
```

---

## SECTION 9 — Signup Flow Updates

When a user clicks any "Upgrade to X" CTA, the `/signup` page must:

1. Pre-select the correct plan from the URL param (`?plan=BUSINESS`)
2. Pre-select the interval (`?interval=year` shows yearly toggle active)
3. Show a plan summary sidebar on the right during checkout:
   ```
   You're upgrading to:  Business Plan
   Billed:               Monthly / $49.99
   First charge:         Today
   Cancel anytime:       Yes
   ```
4. After successful Stripe payment, redirect to `/dashboard?welcome=true`
   and show a one-time "Your first proof" onboarding modal.

---

## SECTION 10 — Meta Tags for the Pricing Page

Add these to the `<head>` of `/pricing` for SEO and social sharing:

```html
<title>Pricing — AntiAI.me | Cryptographic Video Verification</title>
<meta name="description"
  content="Prove your videos are real. AntiAI.me offers cryptographic
  verification badges for YouTube and TikTok creators. Free to start.
  Pro from $24.99/month." />
<meta property="og:title"
  content="Pricing — AntiAI.me | Prove Your Videos Are Real" />
<meta property="og:description"
  content="Tamper-proof Ed25519 badges for every video you publish.
  Start free. Pro from $24.99/month." />
<meta property="og:image" content="https://antiai.me/og-pricing.png" />
<meta name="twitter:card" content="summary_large_image" />

<!-- Structured data: SoftwareApplication -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AntiAI.me",
  "applicationCategory": "SecurityApplication",
  "offers": [
    {
      "@type": "Offer",
      "name": "Pro",
      "price": "24.99",
      "priceCurrency": "USD",
      "billingIncrement": "P1M"
    },
    {
      "@type": "Offer",
      "name": "Business",
      "price": "49.99",
      "priceCurrency": "USD",
      "billingIncrement": "P1M"
    },
    {
      "@type": "Offer",
      "name": "Elite",
      "price": "99.99",
      "priceCurrency": "USD",
      "billingIncrement": "P1M"
    }
  ]
}
</script>
```

---

## IMPLEMENTATION CHECKLIST

### New components to create:
- [ ] `TrustBar` — social proof stats strip
- [ ] `PricingToggle` — monthly/yearly switch with per-plan savings
- [ ] `PricingCard` — reusable card (5 variants)
- [ ] `LiveProofCallout` — blue callout inside Business card
- [ ] `EnterpriseCard` — full-width dark card
- [ ] `FeatureTable` — collapsible comparison grid
- [ ] `PricingFAQ` — accordion FAQ section
- [ ] `EnterpriseCTAStrip` — bottom dark strip

### Existing components to update:
- [ ] Pricing page copy — all headlines and taglines
- [ ] Signup flow — accept `plan` and `interval` URL params
- [ ] Dashboard — add welcome modal for new upgrades
- [ ] Feature gate messages — "This feature requires Business plan" etc.

### Feature gate messages (use consistently throughout the app):
```
Challenge/Live Proof:  "Live Proof challenges are available on the Business plan and above."
Custom domain:         "Custom domains are available on the Business plan and above."
White-label badge:     "White-labelling is available on the Elite plan."
API access:            "API access is available on the Business plan and above."
Analytics:             "Upgrade to Pro to unlock your analytics dashboard."
Handle change:         "Upgrade to Pro to change your creator handle."
```

### Routing:
- [ ] `/pricing` — main page
- [ ] `/enterprise` — dedicated enterprise landing page (create separately)
- [ ] `/signup?plan=X&interval=Y` — pre-selected checkout flow
