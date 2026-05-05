# AntiAI Extension - Multi-Platform Architecture & Future Roadmap (For LLM Agents)

This document serves as a master reference for future AI agents and developers working on the AntiAI Browser Extension, specifically focusing on the **Multi-Platform Adapter Architecture** (YouTube, TikTok, Instagram, Facebook) and the **God-Tier Backend Database Refactor**.

## 1. Multi-Platform Adapter Strategy (Frontend)

The extension no longer assumes YouTube. `content.ts` has been completely rewritten using a scalable `PlatformAdapter` pattern.

**Technical Checklist for Implementation:**
- [x] **Adapter Scaffold:** `content.ts` exports an array of adapters. To add a new platform, implement the `PlatformAdapter` interface (`detect`, `getVideoId`, `injectBadge`, etc.).
- [x] **YouTube Shorts Integration:** The YouTube adapter natively parses `/shorts/(.*)` URLs and hooks into `MutationObserver` to bypass infinite-scroll SPA routing limitations.
- [ ] **DOM Selectors (TikTok/Meta):** The biggest upcoming challenge is writing resilient DOM selectors for TikTok and Meta, as they use heavily obfuscated, frequently changing React class names (e.g., `css-1qwerty`). Use structural pseudo-classes instead of direct class names.
- [ ] **Auto-Skip Feature:** Implement an observer that reads the API verification status. If the API returns `status: "ai_slop"`, programmatically execute the platform's native "Next Video" action to auto-scroll past garbage content.

## 2. God-Tier Backend Architecture (NestJS & Prisma)

Currently, the API endpoints and database schemas are tightly coupled to YouTube (e.g., `?youtube_video_id=123`). As an expert backend architect, I mandate that the entire database must be refactored into a **Platform-Agnostic Schema**. 

### A. The Platform-Agnostic Database Schema Refactor
We must eliminate `youtubeId` columns and replace them with a composite key of `platform` and `platformId`.

```prisma
// The core registry of all videos across the internet
model VideoRecord {
  id          String   @id @default(cuid())
  platform    String   // 'youtube', 'tiktok', 'instagram', 'facebook'
  platformId  String   // The video ID on that specific platform
  url         String?  // Optional full URL for fallback
  status      String   @default("unverified") // 'verified', 'unverified', 'ai_slop'
  
  // Relations
  flags       ContentFlag[]
  context     VideoContext?

  @@unique([platform, platformId]) // Composite unique constraint is CRITICAL
  @@index([platform])
}

// Crowdsourced Intelligence
model ContentFlag {
  id          String   @id @default(cuid())
  videoId     String   // Foreign key to VideoRecord.id
  video       VideoRecord @relation(fields: [videoId], references: [id], onDelete: Cascade)
  userId      String?  // Optional: ID of the user flagging it
  reason      String   // E.g., "Deepfake", "Voice Clone"
  status      String   @default("pending") // pending, approved, rejected
  createdAt   DateTime @default(now())

  @@index([videoId])
}

// Public Community Notes
model VideoContext {
  id          String   @id @default(cuid())
  videoId     String   @unique // Foreign key to VideoRecord.id
  video       VideoRecord @relation(fields: [videoId], references: [id], onDelete: Cascade)
  note        String   // The public "Community Note"
  approvedBy  String   // Admin ID who approved it
  createdAt   DateTime @default(now())
}
```

### B. The API Routing Strategy
1. **Unified Endpoint:** The extension currently hits `GET /public/verify`. It must now pass `?platform=tiktok&video_id=123`.
2. **NestJS Strategy:** The NestJS `VerifyController` will accept a DTO with `@IsEnum(['youtube', 'tiktok', 'instagram', 'facebook']) platform`. 
3. **Database Lookups:** Prisma lookups will change from `findUnique({ where: { youtubeId: id } })` to `findUnique({ where: { platform_platformId: { platform, platformId } } })`.

## 3. Core Principles for Agents
*   **Performance First:** Do not run `fetch` checks for arrays of videos on the feed. Only verify the `is-active` video.
*   **Security Strictness:** The extension must NEVER use `innerHTML`. All DOM injections must use `document.createElement`.
*   **Graceful Degradation:** If the backend API goes down, the extension must fail silently and default to the neutral state so it does not freeze the user's browser.


