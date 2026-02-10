# AntiAI.me

Authenticity verification platform for creators. Protect your audience from deepfakes with cryptographic proof.

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm 9+

### Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start databases**

   ```bash
   docker-compose up -d
   ```

3. **Setup environment**

   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Initialize database**

   ```bash
   npm run db:push
   ```

5. **Run development servers**

   ```bash
   npm run dev
   ```

   - Web: <http://localhost:3000>
   - API: <http://localhost:4000>

## Project Structure

```
├── apps/
│   ├── web/          # Next.js frontend (Creator + Admin dashboards)
│   ├── api/          # NestJS backend API
│   └── extension/    # Chrome browser extension
├── packages/
│   ├── database/     # Prisma schema + migrations
│   ├── crypto/       # Ed25519 signing utilities
│   └── shared/       # Shared types
└── docker-compose.yml
```

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS
- **Backend**: NestJS, PostgreSQL, Redis
- **Crypto**: Ed25519 (@noble/ed25519)
- **Payments**: Stripe
- **Auth**: JWT, Google OAuth

## License

Proprietary - All rights reserved
