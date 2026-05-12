# Motor Marketplace

AI-powered private car insurance marketplace for India. **V1 prototype** demonstrating: AI policy parser, curated report generator, reverse-bidding marketplace, end-to-end checkout, and renewal cadence preview.

## Build mode
This is the **investor-demo prototype** (3-day build). Some components are real, some are mocked — see the build plan at `memory/project_v1_build_plan.md`.

| Component | Mode |
|---|---|
| Policy parser | Real (Anthropic Claude) |
| Report generator | Real (Anthropic Claude) |
| PDF report download | Real (Puppeteer) |
| OTP gate | Mock (fixed code: `9993`) |
| Bidding orchestrator | Real with AI-generated insurer personas |
| KYC + Payment | Mockup (3-screen flows, no real verification) |
| Insurer connector | Mockup (adapter pattern, ready to swap) |
| Renewal cadence engine | Real preview (visualises 12 months of nudges) |

## Stack
- **Next.js 15** App Router + TypeScript + Tailwind CSS
- **Anthropic Claude API** for parsing + report + insurer personas
- **File-based JSON storage** (prototype only — swap for Vercel KV/Postgres on hosted deploy)
- **Puppeteer** for PDF report generation
- **react-dropzone** + `pdf-parse` for upload + text extraction

## Setup
1. Install Node 20+ (LTS recommended)
2. Copy `.env.example` to `.env.local` and add your `ANTHROPIC_API_KEY`
3. `npm install`
4. `npm run dev` → open http://localhost:3000

## Project structure
```
src/
  app/           Next.js App Router (pages + API routes)
  lib/           Anthropic client, DB helpers, prompts
  components/    UI components
data/
  seed-policies/ Real anonymised policies for parser testing
  db/            File-based JSON storage (prototype)
memory/          Claude session context — DO NOT DELETE
```

## Locked product spec
See `memory/project_motor_marketplace.md` for the complete V1 product spec including all locked decisions (regulatory model, bidding mechanics, customer journey, claim model, etc.).
