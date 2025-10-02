# InsiderEdge — Insider-Trading Tracker

A fast, trustworthy insider-trading signal platform that ingests disclosures from NSE / BSE, normalizes and deduplicates them, stores canonical records in Convex DB, and notifies subscribed users (email) when new high-value events appear.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture-high-level)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started--quick-setup)
- [Environment Variables](#environment-variables)
- [Development](#development-run-locally)
- [Convex Setup](#convex-schema-codegen--dev)
- [Supabase Setup](#supabase-auth--smtp-dev-vs-prod)
- [Crawlers & Scraping](#crawlers--scraping-strategy)
- [Cron / Scheduling](#cron--scheduling-every-5-minutes)
- [Notifications](#notifications-observer-pattern)
- [API Endpoints](#api-endpoints-examples)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting--common-issues)
- [Project Structure](#project-structure-short)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Unified ingestion** of insider trading disclosures from NSE & BSE (scraper + optional vendor APIs)
- **PDF/table parsing** fallback and JSON/XHR endpoint bootstrapping to avoid headless browser where possible
- **Deduplication & canonicalization** using signature/hash of key fields
- **Convex DB storage** with typed server mutations/queries
- **User authentication** via Supabase (email/password + OAuth Google)
- **Observer pattern** for notifications: when `unifiedInsiderTrading` gets new rows, matching users are emailed
- **Configurable alerts** (future): per-symbol subscriptions, thresholds, digesting
- **Live frontend** (Next.js + Convex react) with reactive queries
- **Dev & prod friendly** email flow (Supabase built-in SMTP for dev, custom SMTP / Resend for prod)

## Architecture (high level)

```
Crawler(s) (Node.js / Playwright or direct JSON fetch)
    ↓ normalize & dedupe
Convex mutation (upsert into unifiedInsiderTrading)
    ↓ event enqueue (or immediate notify)
Notification Dispatcher (worker) → Observer modules (email/push/webhook)
Convex DB (tables: unifiedInsiderTrading, bseInsiderTrading, nseInsiderTrading, users, alerts)
Frontend (Next.js + Convex react) — live feed, alert UI, auth via Supabase
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js (App Router), React, Tailwind CSS |
| **Backend DB** | Convex (serverless DB + functions) |
| **Auth** | Supabase Auth (email/password + Google OAuth) |
| **Scraper** | Playwright (`pwrequest` fallback) or direct JSON/XHR |
| **PDF Parsing** | PyMuPDF / Camelot / Tesseract (optional) |
| **Email** | Supabase SMTP (dev) / Nodemailer / Resend / SendGrid (prod) |
| **Queue** | Redis / SQS (optional) — Convex `event_queue` table for small scale |

## Getting Started — Quick Setup

### Prerequisites

- Node.js 18+ (recommended)
- npm or pnpm
- Convex account / `convex` CLI configured
- Supabase project (for auth) — get URL + anon key
- (Optional) Resend / SMTP credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-org>/insideredge.git
cd insideredge

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your credentials

# Run Convex codegen and dev server
npx convex codegen
npx convex dev

# In a separate terminal, start Next.js dev server
npm run dev
```

## Environment Variables

Create `.env.local` from this template:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=pk_XXXXXXXXXXXX

# Convex
NEXT_PUBLIC_CONVEX_URL=https://<your-convex-deployment-url>
CONVEX_SERVER_URL=http://localhost:8080
CONVEX_DEPLOY_KEY=__CONVEX_DEPLOY_KEY__

# SMTP (dev uses Supabase built-in; for prod provide real SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your@smtp.user
SMTP_PASS=supersecret
SMTP_FROM="InsiderEdge <no-reply@yourdomain.com>"

# Resend (optional)
RESEND_API_KEY=your_resend_api_key

# Other
NODE_ENV=development
PORT=3000
```

## Development: Run Locally

1. **Start Convex dev server:**
   ```bash
   npx convex dev
   ```

2. **Configure Supabase** project for auth. Provide `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

3. **Start Next.js dev server:**
   ```bash
   npm run dev
   ```

4. **Test cron endpoint** (manual invocation during development):
   ```bash
   curl http://localhost:3000/api/cron/nse
   ```

## Convex: Schema, Codegen & Dev

- **Single schema file:** `convex/schema.ts` 
- **Important:** Convex reads `convex/schema.ts` only — ensure you combine any sub-schemas there
- **After editing schema, always run:**
  ```bash
  npx convex codegen
  npx convex dev
  ```
- Server functions / mutations live in `convex/` (or `convex/functions`) and are compiled and available in the generated server helper `convex/_generated/server`

## Supabase: Auth & SMTP (Dev vs Prod)

### Configuration

- In Supabase dashboard → **Auth** → **Settings**: configure OAuth providers (Google), and Email template options
- **Development:** use Supabase built-in SMTP (Postmark sandbox). No SMTP env required
- **Production:** configure Custom SMTP or use an external provider (SendGrid, Postmark, SES). Provide SMTP envs from `.env.local`

### Auth Flows

- **Email/password:** `supabase.auth.signUp()` / `supabase.auth.signInWithPassword()`
- **OAuth (Google):** `supabase.auth.signInWithOAuth({ provider: 'google' })`
- **Sync user to Convex** by calling `api.users.upsertUser` mutation from client or server on auth event

## Crawlers & Scraping Strategy

### Prefer XHR/JSON Endpoint (No Headless Browser)

1. Use browser DevTools on NSE/BSE pages → filter XHR → find JSON endpoints
2. Typical flow:
   - `GET /` to bootstrap cookies
   - `GET /api/...` JSON endpoint with headers `Referer`, `User-Agent`, `Accept`, `X-Requested-With`

3. Example using Playwright request:
   ```typescript
   import { request as pwRequest } from 'playwright';
   
   const req = await pwRequest.newContext({ 
     extraHTTPHeaders: { 
       Referer: 'https://www.nseindia.com', 
       'User-Agent': '...' 
     }
   });
   
   await req.get('https://www.nseindia.com'); // bootstrap
   const res = await req.get('https://www.nseindia.com/api/corporates/insider-trades?symbol=RELIANCE');
   const json = await res.json();
   ```

### Fallback to Headful Playwright

If JSON not available:
- **Avoid** `headless: true` against NSE due to anti-bot detection
- If you must use headless, use cookie bootstrapping, allow fonts/stylesheets, and avoid blocking resources the page expects
- **Better:** use server-side Playwright request context as above, or switch to Puppeteer + stealth only if required (not recommended for stability)

## Cron / Scheduling (Every 5 Minutes)

### Vercel

Use `vercel.json` crons:

```json
{
  "crons": [
    { 
      "path": "/api/cron/nse", 
      "schedule": "*/5 * * * *" 
    }
  ]
}
```

### Self-host / Docker / Server

Use OS cron, `pm2`, or a small worker process with `node-cron`:

```javascript
import cron from 'node-cron';

cron.schedule('*/5 * * * *', async () => {
  await fetch('https://yourapp.com/api/cron/nse');
});
```

### Convex Event Queue

`upsertTrade` writes to `event_queue` or `notifications_queue` table; a dispatcher worker polls and sends emails reliably with retries.

## Notifications (Observer Pattern)

Implemented in Convex mutation (or in dispatcher):

- Insert into `unifiedInsiderTrading`
- Query `users` (or `alerts`) to compute matches
- Insert a `notifications` record for audit
- Enqueue or send email via SMTP/Resend

For scale, use an external queue (SQS / Redis streams) so email sending happens outside Convex mutation.

### Example Convex Mutation Snippet

```typescript
const id = await ctx.db.insert('unifiedInsiderTrading', { 
  ...trade, 
  createdAt: Date.now() 
});

// enqueue
await ctx.db.insert('eventQueue', { 
  type: 'TRADE_INSERTED', 
  tradeId: id, 
  createdAt: Date.now() 
});
```

Then a worker processes `eventQueue`, queries `alerts`, and calls observers (EmailObserver).

## API Endpoints (Examples)

### REST Endpoints

- `GET /api/scrape/nse?symbol=RELIANCE` — scrapes NSE, returns parsed rows
- `GET /api/cron/nse` — cron trigger to run ingestion & upsert to Convex

### Convex Mutations

- `api.nseInsider.insertTrades({ trades })`
- `api.unifiedInsider.insertTrade({...})`
- `api.users.upsertUser({ supabaseId, email, name })`

### Client Example (Convex React)

```tsx
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const insertTrades = useMutation(api.nseInsider.insertTrades);
await insertTrades({ trades: parsedRows });
```

## Testing

- **Unit test parsers** using example HTML/PDFs
- **Synthetic duplicate tests:** ensure dedupe hashing prevents duplicates
- **Integration test:** run `/api/cron/nse` → check Convex table for new rows → check `notifications` entries
- **Test email** using Supabase dev SMTP or Resend sandbox

## Troubleshooting / Common Issues

### 1. `convex` Schema/Type Mismatch (`never` Index Error)

- Ensure you have a single `convex/schema.ts` file at `convex/schema.ts`
- Run `npx convex codegen` after changing the schema, then restart `npx convex dev`

### 2. NSE Blocking Headless Playwright

- Bootstrap cookies by GETting `https://www.nseindia.com` before JSON calls
- Prefer JSON/XHR endpoints instead of full page rendering
- If using Playwright page, run headful or limit resource blocking (allow fonts/stylesheets)

### 3. Missing Types for Third-party Stealth Packages

- For unofficial plugins, add a small declaration in `src/types/` and ensure `tsconfig.json` includes that path

### 4. Email Deliverability

- For prod, set SPF/DKIM for your sending domain, use verified SMTP like SendGrid/Postmark/SES

### 5. Cron Not Running on Vercel Locally

- In dev, simulate cron with `node-cron` or use `curl` to call routes

## Project Structure (Short)

```
/app                      # Next.js app (pages / app router)
  /api
    /cron/nse/route.ts    # cron endpoint to scrape & upsert
/lib
  mailer.ts               # nodemailer / resend wrapper
/convex
  schema.ts               # Convex schema (single entry)
  nseInsider.ts           # Convex functions (mutations/queries)
  unifiedInsider.ts
  users.ts
  _generated              # generated by convex codegen
/src
  /scrapers
    nse.ts                # scraper logic (pwRequest + JSON fetch)
    parse.ts              # parser utilities
/context
  UserContext.tsx         # supabase + convex user sync
```

## Contributing

- Fork the repo and open a PR
- Run `npm install` and `npx convex dev` before development
- Keep changes to `convex/schema.ts` consolidated; run `npx convex codegen` after schema edits

## License

MIT License — see `LICENSE` file.

---

## Appendix — Useful Commands

```bash
# Install dependencies
npm install

# Convex commands
npx convex codegen
npx convex dev

# Next.js commands
npm run dev
npm run build
npm run start

# Test cron route locally
curl http://localhost:3000/api/cron/nse
```

---

## Next Steps

Want help with:

- **Generating a ready-to-run starter branch** (with Convex schema, example mutations, Next.js API cron route, and a simple dispatcher worker)?
- **Converting your current scraper to use NSE JSON API**? Paste a *Copy as cURL* from DevTools and I'll produce the exact `fetch` code that works server-side (no headless).

---

**Built with ❤️ for transparent financial markets**