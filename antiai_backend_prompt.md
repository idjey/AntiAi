# AntiAI.me — Backend Engineering Prompt
## Pricing Architecture Update: Add Business Tier + Enforce Plan Limits

**Context for the AI / developer reading this:**
You are working on the AntiAI.me monorepo — a NestJS backend with Prisma/PostgreSQL.
The codebase uses Ed25519 cryptographic signing for video proofs, Stripe for billing,
and has the following current plan tiers: `free | pro | elite`.
We are adding a `business` tier and enforcing proper plan-based limits throughout.

---

## CHANGE 1 — Prisma Schema (`packages/database/prisma/schema.prisma`)

### 1a. Add `business` to the `PlanTier` enum

```prisma
// BEFORE:
enum PlanTier {
  free
  pro
  elite
}

// AFTER:
enum PlanTier {
  free
  pro
  business   // ← ADD THIS
  elite
}
```

### 1b. Add `schemaVersion` to the `Proof` model (future-proofing)

```prisma
// Inside model Proof { ... }, add after the `kid` field:
schemaVersion Int @default(1) @map("schema_version")
```

### 1c. Add `ipHash` to `ContentFlag` for abuse prevention

```prisma
// Inside model ContentFlag { ... }, add after `userId`:
ipHash Bytes? @map("ip_hash")
```

### 1d. Run the migration

```bash
npx prisma migrate dev --name add_business_tier
npx prisma generate
```

---

## CHANGE 2 — Plan Limits Configuration

Create a new shared constants file at:
`packages/common/src/plan-limits.ts`

```typescript
// packages/common/src/plan-limits.ts
// Single source of truth for all plan-based limits.
// Import this wherever plan enforcement is needed.

export type PlanTier = 'free' | 'pro' | 'business' | 'elite';

export interface PlanLimits {
  videosPerMonth: number;        // -1 = unlimited
  shopProducts: number;          // -1 = unlimited
  apiCallsPerMonth: number;      // -1 = unlimited
  challengeAccess: boolean;      // Liveness / Dynamic Proof feature
  customDomain: boolean;
  whiteLabelBadge: boolean;
  analyticsAccess: boolean;
  customHandle: boolean;
  customBackgrounds: boolean;
  transparencyLogExport: boolean;
  proofExpiryDays: number;       // How long issued proofs remain active
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    videosPerMonth: 5,
    shopProducts: 1,
    apiCallsPerMonth: 0,
    challengeAccess: false,
    customDomain: false,
    whiteLabelBadge: false,
    analyticsAccess: false,
    customHandle: false,
    customBackgrounds: false,
    transparencyLogExport: false,
    proofExpiryDays: 90,
  },
  pro: {
    videosPerMonth: 100,
    shopProducts: -1,
    apiCallsPerMonth: 0,
    challengeAccess: false,
    customDomain: false,
    whiteLabelBadge: false,
    analyticsAccess: true,
    customHandle: true,
    customBackgrounds: true,
    transparencyLogExport: false,
    proofExpiryDays: 365,
  },
  business: {
    videosPerMonth: 500,
    shopProducts: -1,
    apiCallsPerMonth: 10_000,
    challengeAccess: true,       // KEY differentiator vs Pro
    customDomain: true,
    whiteLabelBadge: false,
    analyticsAccess: true,
    customHandle: true,
    customBackgrounds: true,
    transparencyLogExport: false,
    proofExpiryDays: 365,
  },
  elite: {
    videosPerMonth: -1,
    shopProducts: -1,
    apiCallsPerMonth: -1,
    challengeAccess: true,
    customDomain: true,
    whiteLabelBadge: true,
    analyticsAccess: true,
    customHandle: true,
    customBackgrounds: true,
    transparencyLogExport: true,
    proofExpiryDays: 365,
  },
};

/**
 * Returns the plan limits for a given tier.
 * Falls back to free limits if tier is unrecognised.
 */
export function getPlanLimits(tier: PlanTier | string): PlanLimits {
  return PLAN_LIMITS[tier as PlanTier] ?? PLAN_LIMITS.free;
}
```

---

## CHANGE 3 — Proof Service (`apps/api/src/proofs/proofs.service.ts`)

### 3a. Remove the debug console.log block

**Find and DELETE this entire block (it leaks key metadata in production):**

```typescript
// DELETE THIS ENTIRE BLOCK:
console.log('--- DEBUG ENV VARS ---');
console.log('ConfigService KID:', kid);
console.log('ConfigService PrivateKey Length:', privateKeyB64?.length);
console.log('Process.env KID:', process.env.SIGNING_KEY_ID);
console.log('Process.env PrivateKey Length:', process.env.SIGNING_PRIVATE_KEY_B64?.length);
console.log('All Env Keys:', Object.keys(process.env).filter(k => k.startsWith('SIGNING_')));
console.log('----------------------');
```

### 3b. Add subscription + plan limit enforcement to `issueProof`

Add the following checks AFTER the `existingActive` proof check and BEFORE
the signing key retrieval. Import `getPlanLimits` from the common package.

```typescript
import { getPlanLimits } from '@antiai/common';

// Inside issueProof(), after the existingActive check:

// ── Plan & subscription gate ──────────────────────────────────────────────
const subscription = await this.prisma.subscription.findUnique({
  where: { userId },
});

// Block suspended or lapsed subscriptions
if (!subscription || subscription.status === 'canceled' || subscription.status === 'unpaid') {
  throw new ForbiddenException('Active subscription required to issue proofs.');
}

const limits = getPlanLimits(subscription.plan);

// Enforce monthly video quota (-1 = unlimited)
if (limits.videosPerMonth !== -1 && subscription.videosThisMonth >= limits.videosPerMonth) {
  throw new BadRequestException(
    `Monthly proof limit reached (${limits.videosPerMonth} videos). Please upgrade your plan.`
  );
}

// Check user is not suspended
const user = await this.prisma.user.findUnique({
  where: { id: userId },
  select: { isSuspended: true },
});
if (user?.isSuspended) {
  throw new ForbiddenException('Account suspended. Contact support.');
}
// ─────────────────────────────────────────────────────────────────────────
```

### 3c. Make `expiresAt` server-computed — never trust the client

**Replace the client-supplied `expires_at` with server-computed value:**

```typescript
// REMOVE from IssueProofDto: expires_at field entirely.

// REPLACE this line in issueProof():
// const expiresAt = new Date(dto.expires_at);   ← DELETE

// WITH:
const limits = getPlanLimits(subscription.plan);
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + limits.proofExpiryDays);
```

**Update `IssueProofDto` (`apps/api/src/proofs/dto/issue-proof.dto.ts`):**

```typescript
// BEFORE:
export class IssueProofDto {
  @IsString()
  video_id: string;

  @IsDateString()
  expires_at: string;   // ← REMOVE THIS
}

// AFTER:
export class IssueProofDto {
  @IsString()
  video_id: string;
  // expires_at is now server-computed from plan limits — never client-supplied
}
```

Do the same for `ReissueProofDto` — remove `expires_at` from it as well.

### 3d. Increment `videosThisMonth` after successful proof issuance

After the `transparencyLog.create` call at the end of `issueProof`, add:

```typescript
// Increment monthly usage counter
await this.prisma.subscription.update({
  where: { userId },
  data: { videosThisMonth: { increment: 1 } },
});
```

### 3e. Add a PostgreSQL partial unique index to prevent race condition

Add this to your Prisma schema inside `model Proof`:

```prisma
// This enforces "one active proof per video" at the DB level,
// preventing the race condition in the application-level check.
@@index([videoId, status])  // replace existing @@index([videoId])
```

Then create a raw SQL migration:

```sql
-- migrations/add_one_active_proof_constraint.sql
CREATE UNIQUE INDEX IF NOT EXISTS one_active_proof_per_video
  ON proofs (video_id)
  WHERE status = 'active';
```

Run via: `npx prisma db execute --file migrations/add_one_active_proof_constraint.sql`

---

## CHANGE 4 — Challenge Access Gating

In the Challenges service (`apps/api/src/challenges/challenges.service.ts`),
add a plan check before allowing challenge creation:

```typescript
import { getPlanLimits } from '@antiai/common';

// At the top of createChallenge():
const subscription = await this.prisma.subscription.findUnique({
  where: { userId },
});
const limits = getPlanLimits(subscription?.plan ?? 'free');

if (!limits.challengeAccess) {
  throw new ForbiddenException(
    'Live Proof challenges require the Business plan or higher.'
  );
}
```

---

## CHANGE 5 — Monthly Usage Reset (Cron Job)

Add or update a scheduled task that resets `videosThisMonth` on the first of each month.

File: `apps/api/src/scheduler/usage-reset.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsageResetService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async resetMonthlyUsage() {
    await this.prisma.subscription.updateMany({
      data: {
        videosThisMonth: 0,
        usagePeriodStart: new Date(),
      },
    });
    console.log('[UsageResetService] Monthly video counts reset.');
  }
}
```

Register in `AppModule` — ensure `@nestjs/schedule` is installed:
```bash
npm install @nestjs/schedule
```

---

## CHANGE 6 — Stripe Webhook Handler

When Stripe sends `customer.subscription.updated` events (e.g. plan upgrades,
cancellations), sync the plan to your database.

In your Stripe webhook handler, ensure you handle:

```typescript
case 'customer.subscription.updated': {
  const stripeSubscription = event.data.object;
  const planNickname = stripeSubscription.items.data[0]?.price?.nickname?.toLowerCase();
  // Map Stripe price nickname to your PlanTier enum
  const planMap: Record<string, string> = {
    'free': 'free',
    'pro': 'pro',
    'pro monthly': 'pro',
    'pro annual': 'pro',
    'business': 'business',
    'business monthly': 'business',
    'business annual': 'business',
    'elite': 'elite',
    'elite monthly': 'elite',
    'elite annual': 'elite',
  };
  const newPlan = planMap[planNickname] ?? 'free';

  await this.prisma.subscription.updateMany({
    where: { stripeSubscriptionId: stripeSubscription.id },
    data: {
      plan: newPlan as any,
      status: stripeSubscription.status as any,
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  });
  break;
}
```

---

## CHANGE 7 — Stripe Product Configuration

In Stripe Dashboard, create the following products and prices.
Use the exact nicknames below — they are used in the webhook handler above.

| Product     | Nickname           | Price       | Interval |
|-------------|-------------------|-------------|----------|
| Pro         | pro monthly        | $24.99      | month    |
| Pro         | pro annual         | $239.88     | year     |
| Business    | business monthly   | $49.99      | month    |
| Business    | business annual    | $479.88     | year     |
| Elite       | elite monthly      | $99.99      | month    |
| Elite       | elite annual       | $959.88     | year     |

Annual savings:
- Pro annual: $59.88/yr saved (was $36 — stronger incentive)
- Business annual: $119.88/yr saved
- Elite annual: $239.88/yr saved

Store the new Stripe Price IDs in your `.env`:

```env
STRIPE_PRICE_PRO_MONTHLY=price_xxxx
STRIPE_PRICE_PRO_ANNUAL=price_xxxx
STRIPE_PRICE_BUSINESS_MONTHLY=price_xxxx
STRIPE_PRICE_BUSINESS_ANNUAL=price_xxxx
STRIPE_PRICE_ELITE_MONTHLY=price_xxxx
STRIPE_PRICE_ELITE_ANNUAL=price_xxxx
```

---

## CHANGE 8 — API Rate Limiting by Plan

In the API access guard or middleware, enforce `apiCallsPerMonth` limits
for the Business tier. The Elite tier is unlimited.

```typescript
// apps/api/src/guards/api-rate.guard.ts
import { getPlanLimits } from '@antiai/common';

@Injectable()
export class ApiRateGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    if (!userId) return false;

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    const limits = getPlanLimits(subscription?.plan ?? 'free');

    if (limits.apiCallsPerMonth === 0) {
      throw new ForbiddenException('API access requires Business plan or higher.');
    }
    // For non-unlimited plans, check Redis counter here
    // For elite (-1), pass through immediately
    return true;
  }
}
```

---

## TESTING CHECKLIST

After all changes, verify:

- [ ] Free user can issue max 5 proofs/month, blocked on 6th
- [ ] Pro user can issue max 100 proofs/month
- [ ] Business user can issue max 500 proofs/month + access challenges
- [ ] Elite user has no proof limit
- [ ] Suspended user cannot issue proofs
- [ ] Canceled subscription cannot issue proofs
- [ ] `expires_at` is always server-computed, never accepted from client
- [ ] Two simultaneous proof requests for same video → only one succeeds (partial unique index)
- [ ] Monthly usage resets on 1st of month
- [ ] Stripe webhook correctly maps all 6 price IDs to plan tiers
- [ ] No debug console.log appears in production logs
- [ ] Challenge creation blocked for Free and Pro users
