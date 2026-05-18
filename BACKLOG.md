# BACKLOG

Running log of work that's been **discussed, deferred, or shipped-but-not-yet-validated.** Maintained across sessions so nothing slips through long stretches between conversations.

Add an entry when:
- We defer a build to a later session (`Deferred build`)
- We ship something that needs real-world or live-deploy verification (`Validation queue`)
- We agree on a founder / non-coding action item (`Strategic / non-coding`)
- A question came up that we couldn't answer in the moment (`Open questions`)

Remove an entry when it's actually done **and** verified — not when the code lands. Shipping ≠ done.

---

## Validation queue
*Code is on `main`. Still needs a real-world check on the live deploy before it can be considered done.*

| Added | Item | Validation criteria |
|---|---|---|
| 2026-05-18 | **Insights v1 — feed + inline rendering** (`810f6b3`) | (1) Open `/me/insights` on a verified session — feed shows the 3 sample insights filtered by your car profile. (2) Open `/report/[id]` for a CNG car in Mumbai with no Engine Protect — monsoon-engine-protect insight appears inline above the simulator. (3) Discovery line "N updates tied to gaps below" appears at top of §02. (4) Print mode (`?print=1`) hides all engagement-layer content. (5) Mobile: editorial spacing reads cleanly. |
| 2026-05-17 | **Save / Share buttons mobile fixes** (`723dc06`) | PDF downloads reliably on iOS Safari with the simplified single-file flow. Share-on-WhatsApp opens WhatsApp with pre-filled message. Both buttons match editorial plum styling. |
| 2026-05-17 | **Share-page copy update** (`723dc06`) | `/share/[token]` headline reads "Want the same audit on your car insurance?" and CTA reads "Audit my car insurance →". |

---

## Deferred build
*Agreed work that we've explicitly postponed to a later session.*

### Insights — v1.5 (next thread on this lane)
- **Monthly digest cron** — daily cron checks for customers due a digest; bundles their pending matched insights (1-3 per customer); sends via email. Skip if no matches.
- **Editorial email template** — plain HTML, same voice as the renewal-reminder, signed off as Aryan.
- **Urgent breakout flag** — insights with `urgent: true` in their frontmatter bypass the monthly queue and fire on author.
- **"Since last visit" tracking** — `User.insightsLastSeenAt`, updated on each `/me/insights` page load. Drives the count semantics from "matched" to "new since you last visited".
- **Note**: Only meaningful once we have 5–10 authored insights so the digest has anything to bundle. Authoring discipline is the prereq.

### Insights — v1.6 (WhatsApp leg)
- WhatsApp Business Account through Meta
- Provider integration (AiSensy / Gupshup / Interakt) — ~₹2-5k/month + per-message cost
- Approved message templates (Meta review takes 24-72h per template)
- DPDP-defensible WhatsApp consent capture on upload + signin flows
- Send order: WhatsApp primary, email always-also

### `/me` portal editorial redesign
- Today's policy cards, reminder schedule editor, empty state, and account section still wear the legacy SaaS palette (navy badges, rounded-2xl shadow cards). FleetSummary and DataConsentCard are editorial; the rest isn't.
- Bring the whole portal into design parity with the report.
- Single focused session — 1-2 chapters of work.

### Renewal reminder polish
- Existing cron + reminder rows work. Email template hasn't had editorial treatment.
- Subject line, body, signoff, footer — match the audit's voice.

### Year-over-year diff in audit
- When a customer uploads a renewal policy and we detect a prior `ParsedPolicy` with the same registration number, the new report opens with a "What's changed since last year" section: IDV Δ, NCB Δ, add-ons added/dropped, gaps closed/opened, at-risk Δ.
- Was originally part of the annual re-audit ask; got reframed to live inside the Insights system, but the specific YoY diff feature still has value as a one-time per-renewal moment.
- Lower priority than v1.5 digest cron.

### Data infrastructure migration
- File-DB / Upstash KV → Postgres + BigQuery.
- Unblocks the 5 data use cases discussed: IDV rationale, add-on penetration cohort analysis, used-car pricing, customer psychology, credit-bureau correlation.
- Heavy lift; defer until traffic / dataset size justifies it, or until one of the use cases blocks on it.

### Multi-product brand scaffolding
- Health vertical in ~3 months (per the multi-product roadmap).
- Single RightOffer parent brand, vertical sub-themes (motor = Garage / Reading Room editorial).
- Privacy policy already has forward-looking consent language; nothing structural built yet.

### `/pitch` deck refresh
- Existing `/pitch` route. Refresh with audit → personalization → share → fleet → insights loop as the centrepiece.
- Best done after one more polish pass on `/me` so screenshots are presentable.

---

## Strategic / non-coding
*Founder action items, no engineering output.*

| Added | Item | Notes |
|---|---|---|
| 2026-05-17 | **BFSI legal expert reviews `/privacy`** | Currently carries a draft banner. Senior compliance person from the founder's network is aware of the plan. Add ToS at the same time. |
| 2026-05-17 | **Grievance Officer name + direct contact in `/privacy`** | Post company incorporation. |
| 2026-05-17 | **Move AI sub-processor to Indian-region availability** | Currently US-hosted. Telegraphed in the privacy policy. Switch when Claude / equivalent ships an India region. |
| 2026-05-17 | **Start insurer conversations** | Audit-first wedge — strategy agreed yesterday. |

---

## Open questions
*Things to think through before committing to a direction.*

| Added | Question | Why it matters |
|---|---|---|
| 2026-05-18 | **What's the authoring cadence we can sustain for Insights?** | The Insights system only feels alive if there's a steady stream of new content. ≥ 1 a month is the floor; weekly is too pushy for this product. Need a draft pipeline (notes file? scheduled blocks?) to stay on it. |
| 2026-05-18 | **What does the YoY diff section actually look like in the report?** | If we go ahead with it, where in the report does it live? Above §01 as a "since last year" hero? Inline within §02 as gap deltas? Decision needed before build. |
| 2026-05-17 | **Postgres migration timing** | Trigger condition? Customer count, dataset row count, query latency, or specific use case unblocking? Should pick a measurable threshold rather than "when it feels right". |

---

*Last updated: 2026-05-18*
