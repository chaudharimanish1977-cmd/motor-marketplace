# BACKLOG

Running log of work that's been **discussed, deferred, or shipped-but-not-yet-validated.** Maintained across sessions so nothing slips through long stretches between conversations.

Add an entry when:
- We defer a build to a later session (`Deferred build`)
- We ship something that needs real-world or live-deploy verification (`Validation queue`)
- We agree on a founder / non-coding action item (`Strategic / non-coding`)
- A question came up that we couldn't answer in the moment (`Open questions`)

Remove an entry when it's actually done **and** verified — not when the code lands. Shipping ≠ done.

---

## 1. Validation queue
*Code is on `main`. Still needs a real-world check on the live deploy before it can be considered done.*

| Added | Item | Validation criteria |
|---|---|---|
| 2026-05-22 | **Durable QStash queue + holding/permanent-failure replies + Sentry** (this session) | (1) `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`, `SENTRY_DSN` set in Vercel. (2) Forward 3 docs → inbound webhook returns 200 within ~2s (mode=queued in response). (3) Worker `/api/jobs/audit-forward` processes the audit; reply email lands as normal. (4) Force a transient failure (set a bad ANTHROPIC_API_KEY briefly, then revert) → confirm holding email lands after first retry + final audit lands on a later retry. (5) Force 5 consecutive failures → confirm `/api/jobs/audit-forward-failed` fires + permanent-failure email lands + Sentry captures the alert. (6) When `QSTASH_TOKEN` absent, inbound still works via sync fallback (mode=sync). |
| 2026-05-22 | **Silent-doc-loss safety net + 5xx retry coverage** (`dc5b0ba`) | (1) Forward 3 good PDFs from a bypass-list sender → comparator shows 3 docs, no "Couldn't process" block. (2) Forward 2 good PDFs + 1 two-wheeler policy → comparator shows 2, "Couldn't process" lists the two-wheeler with its reason. (3) Vercel logs show retries on transient 5xx if they occur (look for `[anthropic] received 5xx on attempt`). |
| 2026-05-22 | **Per-doc Recommendation column + colour legend** (in earlier session) | Already on the validation list under PDF fixes — confirm next forward shows the Recommended Must/Good/May chips + colour legend block under the snapshot table. |
| 2026-05-22 | **Cross-doc bottom-line cache + excluded-docs in master PDF** (`03a5d95`, `cbe9689`) | (1) Two consecutive page loads of `/reports?print=1&docs=...` show "cache HIT" log on the second. (2) A forward with a two-wheeler doc + a good doc shows "Couldn't process" block in the master PDF (not just email). |
| 2026-05-18 | **`/me` portal editorial redesign** (`8602b20`) | (1) Masthead reads "Reading Room · Your portal" with serif italic-plum headline. (2) Policy cards now hairline-separated rows; status appears as mono uppercase kicker ("· Active ·", "· Renewal · 47d to go ·", "· Lapsed · 12d ago ·"). (3) Comparison launcher + renewal CTA + empty state all use editorial pull-quote vocab — no gradients, no shadowed cards. (4) Delete account confirm + delete policy confirm use coral left-rule + mono kicker + serif body. (5) Reminder schedule editor reads editorial in both summary + edit modes. (6) Mobile reads cleanly. (7) Account section sits below a hairline rule with mono "· Account ·" kicker. |
| 2026-05-18 | **Insights v1 — feed + inline rendering** (`810f6b3`) | (1) Open `/me/insights` on a verified session — feed shows the 3 sample insights filtered by your car profile. (2) Open `/report/[id]` for a CNG car in Mumbai with no Engine Protect — monsoon-engine-protect insight appears inline above the simulator. (3) Discovery line "N updates tied to gaps below" appears at top of §02. (4) Print mode (`?print=1`) hides all engagement-layer content. (5) Mobile: editorial spacing reads cleanly. |
| 2026-05-17 | **Save / Share buttons mobile fixes** (`723dc06`) | PDF downloads reliably on iOS Safari with the simplified single-file flow. Share-on-WhatsApp opens WhatsApp with pre-filled message. Both buttons match editorial plum styling. |
| 2026-05-17 | **Share-page copy update** (`723dc06`) | `/share/[token]` headline reads "Want the same audit on your car insurance?" and CTA reads "Audit my car insurance →". |
| 2026-05-17 | **DPDP scaffolding end-to-end** (`f8ce022`) | (1) `/privacy` carries the V1 draft policy + draft banner. (2) Upload dropzone shows the consent line. (3) `/me → Data & Consent` card renders, "Export JSON" returns the customer's full data. (4) OAuth signin + every `/api/parse` upload stamps `User.dpdpConsentGivenAt`. |
| 2026-05-17 | **Phase 7 audit closures end-to-end** (`6e6121f..091fec2`) | The full audit-promise loop: (1) Every gap has Show our work disclosure with deterministic checks + industry benchmark. (2) Inline ClaimSimulator with snap-slider on each gap. (3) Driving-profile chips at top of §02 + profile-aware checks. (4) Save report PDF, Share on WhatsApp. (5) Fleet summary on `/me` for multi-car households. |

---

## 2. Deferred build
*Agreed work that we've explicitly postponed to a later session. Organised by lane.*

### Insights — v1.5 (engagement layer · next thread)
- **Monthly digest cron** — daily cron checks for customers due a digest; bundles their pending matched insights (1–3 per customer); sends via email. Skip if no matches.
- **Editorial email template** — plain HTML, same voice as the renewal-reminder, signed off as Aryan.
- **Urgent breakout flag** — insights with `urgent: true` in frontmatter bypass the monthly queue and fire on author.
- **"Since last visit" tracking** — `User.insightsLastSeenAt`, updated on each `/me/insights` page load. Drives "matched" → "new since you last visited" semantics.
- **Authoring discipline** — pipeline / draft cadence to keep 1+ insight per month landing.
- **Prereq**: 5–10 authored insights so digests have content to bundle.

### Insights — v1.6 (WhatsApp leg)
- WhatsApp Business Account through Meta.
- Provider integration (AiSensy / Gupshup / Interakt) — ~₹2-5k/month + per-message cost.
- Approved message templates (Meta review takes 24–72h per template).
- DPDP-defensible WhatsApp consent capture on upload + signin flows.
- Send order: WhatsApp primary, email always-also.

### Analytics & product instrumentation
- **PostHog implementation** — event tracking + funnel analysis (upload → audit → gate verify → save / share / renewal CTA), session replay on key flows, feature flags for A/B tests, heatmaps on the report. India-region hosting / EU-region or self-hosted to stay DPDP-defensible. Privacy policy already references "anonymised event logs" so this slot exists.
- **Mock funnel analytics dashboard** (per Milestone 6 of the build plan) — admin-only view showing parser → report → bidding → purchase conversion, even with mock data. Paints the conversion story for the pitch deck.
- **Event taxonomy** — define the canonical events before instrumenting: `upload_started`, `policy_parsed`, `report_rendered`, `gate_otp_sent`, `gate_verified`, `report_saved`, `share_minted`, `whatsapp_share_opened`, `insight_viewed`, etc. Otherwise the data is unreadable.

### Observability (production-grade)
- **Error monitoring** — ✅ shipped 2026-05-22. Sentry wired via `@sentry/nextjs`; activates when `SENTRY_DSN` is set in Vercel. Auto-captures route handler exceptions; `/api/jobs/audit-forward-failed` explicitly calls `Sentry.captureMessage` so terminal queue failures page the team.
- **Performance / APM** — still on the list. LLM latency logged via `console.log`; cron job health by Vercel built-in. Datadog / Vercel Observability when forward volume grows.

### Renewal reminder email — editorial polish
- Cron + reminder rows work. Email template hasn't had editorial treatment.
- Subject line, body, signoff, footer — match the audit's voice.
- Per-channel variants when WhatsApp + SMS land (currently email-only).

### Year-over-year diff in audit
- When a customer uploads a renewal policy and we detect a prior `ParsedPolicy` with the same registration number, the new report opens with a "What's changed since last year" section: IDV Δ, NCB Δ, add-ons added/dropped, gaps closed/opened, at-risk Δ.
- Was originally part of the annual re-audit ask; got reframed into Insights, but the per-renewal YoY moment still has standalone value.

### Multilingual / Hindi rollout
- Hindi + 6 Indian languages via Google Cloud Translation was partially shipped (Round 26) but the footer switcher was removed per `d4f65fd` ("Footer: remove multilingual switcher (paused until later)"). Override-layer pattern lives at the Google API edge for hand-corrected phrases.
- Currently dormant — needs design + product decision on which surfaces re-enable it (full app vs report-only) and whether the override layer is sustainable solo.
- Per spec: report content multilingual via LLM-native capability is the V1 commitment; full UI translation is post-MVP.

### Dark mode — deep per-component audit
- Per `feedback_dark_mode.md`: a 2026-05-14 dark mode ship passed superficial checks but left several pages broken (gradient text headings unreadable, `from-white` card gradients not flipping, named-blue pills stuck light, SVG illustrations with hardcoded fills).
- Needs a deep per-component pass, not another CSS-variable shortcut. Walk every public page in dark mode before claiming done.
- Currently held off because the editorial redesign moved palette discipline forward; revisit when the rest of the surfaces are editorial.

### Data infrastructure migration
- File-DB / Upstash KV → Postgres + BigQuery (or equivalent India-region warehouse).
- Per V1 spec the production target was **Postgres on AWS RDS Mumbai + S3 Mumbai**; we're currently running Vercel KV + Vercel Blob because the prototype was solo-friendlier.
- Unblocks the 5 dataset moat use cases: IDV rationale, add-on penetration cohort analysis, used-car pricing, customer psychology, credit-bureau correlation.
- Trigger condition still TBD — see Open questions.

### Customer-journey completeness (per V1 build plan)
*The build plan's Milestones 3–5 deliverables; partially shipped but worth tracking what's missing.*
- **Bidding orchestrator (M3)** — 3-tier sourcing state machine (preferences → API auction → underwriter pool); insurer adapter abstraction; mock insurer rate-cards calibrated to public premium ranges. Bid surface exists at `/bid/[id]`; needs a sweep against M3's deliverables list to confirm tier behaviour + tiebreakers + 1-insurer graceful path.
- **Checkout mockup (M4)** — KYC 3 screens (Aadhaar / PAN / CKYC), Razorpay-style payment modal, "Issuing your policy…" spinner + sample policy PDF generated within 5s. `/checkout/[bidId]` exists; needs verification against M4 spec.
- **Renewal cadence — channel expansion (M5)** — SES email ✅; SMS via MSG91 ⏳; Telegram bot ⏳; WhatsApp post-MVP (own v1.6 lane). Lapsed-buyer "share your new policy" loop.
- **Demo time-skip mode (M5)** — admin toggle "Fast-forward N days" that fires all scheduled messages; key for "show me the flywheel" in pitches.

### Demo readiness (per V1 build plan M6)
- 3–5 pre-seeded demo personas across vehicle ages / IDVs / profiles so any viewer can pick a relatable one.
- End-to-end demo scripts (5-min and 15-min versions).
- Admin "behind the curtain" reveal — currently retired in `6856c6b`; either re-add as a debug toggle or build a fresh admin surface.
- Pre-recorded backup demo video (Loom) — pitch never depends on live LLM.
- Cached LLM responses for the 5 demo personas so pitches survive a live API hiccup.
- `/pitch` deck refresh — refresh with audit → personalization → share → fleet → insights loop as the centrepiece.

### Multi-product brand scaffolding
- Health vertical in ~3 months (per multi-product roadmap).
- Single RightOffer parent brand, vertical sub-themes (motor = Garage / Reading Room editorial).
- Privacy policy already has forward-looking consent language; nothing structural built yet.

### Production-target stack switches (per V1 spec)
- **LLM inference → Indian region** — currently calls Anthropic US; privacy policy commits to moving to Indian region when available. Bedrock Mumbai or Azure India per spec.
- **OCR → Textract Mumbai** — currently pure-LLM PDF parsing; spec called for AWS Textract for OCR. Worth revisiting once we see edge cases (scanned policies, image uploads).
- **Email → SES Mumbai** — currently Resend. Production target was AWS SES Mumbai for residency.
- **Scheduler → BullMQ on Redis** — currently Vercel Cron. Cleaner for the cadence engine + demo time-skip.
- These are infrastructure migrations, defer until the prototype shape stabilises and there's revenue / partnership to justify the lift.

---

## 3. Strategic / non-coding
*Founder action items, no engineering output.*

| Added | Item | Notes |
|---|---|---|
| 2026-05-17 | **BFSI legal expert reviews `/privacy`** | Currently carries a draft banner. Senior compliance person from the founder's network is aware of the plan. Add ToS at the same time. |
| 2026-05-17 | **Grievance Officer name + direct contact in `/privacy`** | Post company incorporation. |
| 2026-05-24 | **Set up grievance@rightoffer.in mailbox + ensure monitoring** | /privacy promises responses within 7 working days. Today this address is referenced but the mailbox isn't confirmed to be live + actively read. Create the mailbox at Titan (same way as review@), wire forwarding to hello@ or a dedicated address you check daily. Without this, the published policy is technically non-compliant on day one. |
| 2026-05-17 | **Move AI sub-processor to Indian-region availability** | Currently US-hosted. Telegraphed in the privacy policy. Switch when Claude / equivalent ships an India region. |
| 2026-05-17 | **Start insurer conversations** | Audit-first wedge — strategy agreed yesterday. |
| 2026-05-18 | **Day-1 insurer partner pick** | Affects rate-card flexibility, API maturity, garage coverage. Per V1 spec — strategic decision pending before bid orchestrator shifts from mock personas to real insurer. |
| 2026-05-18 | **Insurers 2 & 3 onboarding** | V1 spec commits to 3 total by month 3 post-launch. Build the LOIs in parallel with the day-1 partner. |
| 2026-05-18 | **KYC vendor pick** | Signzy / Hyperverge / Karza per spec. Read docs + pricing; commit before M4 checkout goes from mock to real. |
| 2026-05-18 | **IRDAI composite broker licence** | V1 spec requires the licence before the marketplace flows go from mock to live. Web-aggregator licence is explicitly not enough. |
| 2026-05-18 | **Payment gateway accounts** | Razorpay + PayU sandbox accounts (both for redundancy + best-conversion routing per spec). |
| 2026-05-18 | **MSG91 + Telegram bot accounts** | For SMS + Telegram channels in the cadence engine. |
| 2026-05-22 | **Provision Upstash QStash + add env vars to Vercel** | Create a QStash account at console.upstash.com, copy the token + current/next signing keys. Add to Vercel project env: `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`. Free tier covers 500 messages/day, plenty for Phase 1. Without these env vars the inbound webhook stays on the sync fallback path (still works, no queue benefit). |
| 2026-05-22 | **Provision Sentry project + add `SENTRY_DSN` to Vercel** | Create a Sentry project for the `rightoffer.in` Node runtime; copy DSN. Add `SENTRY_DSN` to Vercel env. Optional: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` for source-map upload (improves stack traces). Without DSN, Sentry SDK is a no-op. |
| 2026-05-18 | **Authoring cadence commitment** | Insights system only feels alive with ≥ 1 new insight per month. Pipeline + protected calendar block needed before v1.5 ships. |

---

## 4. Open questions
*Things to think through before committing to a direction.*

| Added | Question | Why it matters |
|---|---|---|
| 2026-05-18 | **What's the authoring cadence we can sustain for Insights?** | The Insights system only feels alive if there's a steady stream of new content. ≥ 1 a month is the floor; weekly is too pushy for this product. Need a draft pipeline (notes file? scheduled blocks?) to stay on it. |
| 2026-05-18 | **What does the YoY diff section actually look like in the report?** | If we go ahead, where in the report does it live? Above §01 as a "since last year" hero? Inline within §02 as gap deltas? Decision needed before build. |
| 2026-05-17 | **Postgres migration trigger condition?** | Customer count, dataset row count, query latency, or specific use case unblocking? Should pick a measurable threshold rather than "when it feels right". |
| 2026-05-18 | **Insights — placeholder vs production mode?** | The 3 sample insights serve as content today; system is live. Open: do we add a feature flag to gate the entry-points (chip in /me, discovery line in /report) until digest cron + authoring cadence are in place, or trust the matching engine to keep noise low? |
| 2026-05-18 | **PostHog hosting choice — cloud EU vs self-hosted India?** | DPDP-defensible options are PostHog EU cloud (CDN-fronted, processor not controller) or self-hosted on Indian-region infra (Hetzner / DigitalOcean Bangalore / AWS Mumbai). Self-hosted is cheaper at scale + cleaner for the privacy story; EU cloud is cheaper at the prototype stage. |
| 2026-05-18 | **Insight target schema — extend tags, or LLM-driven matching?** | Audience filter is currently typed fields (missingAddOns, isCngOrLpg, etc.). Long term: do we expand fields incrementally (typed, deterministic) or move to a freeform natural-language audience description matched via LLM ("CNG cars under 5 years in flood-prone metros")? Typed scales worse; LLM scales better but is non-deterministic. |

---

*Last updated: 2026-05-22 (post durable-queue + Sentry + customer-facing exception handling)*
