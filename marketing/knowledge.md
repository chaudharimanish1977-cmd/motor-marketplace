# RightOffer — Marketing Knowledge Base

> Upload this file to a Claude project / chat as context. It carries everything
> needed to write marketing copy across the three audiences (customers,
> investors, insurer partners) without further briefing.
>
> When in doubt about which audience the copy is for — ask the user.
> Default to **customer voice** for B2C, **investor voice** for the deck and
> data-room material, and **B2B voice** for insurer outreach.
>
> Last refreshed: 2026-05. Phase 1 is live; full V1 marketplace is in build.

---

## 1. The 30-second version

**RightOffer is an independent, AI-driven motor insurance audit + renewal
marketplace for Indian private-car owners.**

- Customers forward (or upload) their existing policy / renewal quote.
- An LLM-powered parser extracts every material detail.
- A Big-4-style audit comes back inside a minute — what's covered well, what's
  missing, what a claim would cost out of pocket, what to ask the insurer for
  at renewal, and (in V1, in build) a reverse-bidded best offer.
- The product reads like an editorial review — calm, plain-English, no jargon,
  no sales push, no commission conflict.
- Customer pays nothing. We earn IRDAI-capped broker commission on the
  policy they choose at renewal — same rate from every insurer, so the
  recommendation stays honest.

**Tagline (current):** *Right Cover. Right Price. The Right Offer.*

**Product URL:** [rightoffer.in](https://rightoffer.in) ·
**Email-forward inbox:** review@rightoffer.in

---

## 2. The problem RightOffer solves

The Indian motor insurance market is **₹85,000 cr+ annual gross premium**,
~70% renewals. Renewal is the moment of highest stakes and lowest information
for the customer. Today they face:

1. **Renewal-by-default.** ~80% renew with the incumbent without comparing —
   because comparing means filling the same form on five aggregator sites
   and dealing with the call-spam that follows.
2. **PolicyBazaar / aggregator model is lead-sales, not advice.** The
   customer's contact details are sold to insurers, who then call/SMS
   aggressively. The "comparison" is heavily commissioned and biased to the
   highest-paying insurer.
3. **Agents have commission conflict.** Higher add-on premium = higher
   commission. The customer can't tell whether "you need Zero Dep" is true
   advice or a sales line.
4. **Add-ons are confusing.** Engine Protector, Zero Dep, RTI, NCB Protect,
   Consumables, Key Replacement, RSA, LOPB — eight major add-ons, each with
   genuine value in some profiles and zero value in others, all priced
   opaquely.
5. **IDV is opaque.** Most customers don't know their IDV is even negotiable
   at renewal, or that a wrong IDV means under-payment on total loss.
6. **No one tells the customer what a claim would actually cost.**
   Out-of-pocket exposure across missing add-ons is rarely quantified — even
   though it's the single most useful number a buyer could see.

RightOffer fixes the audit asymmetry first (Phase 1), and the transaction
asymmetry second (V1 reverse bidding).

---

## 3. What's actually live today (Phase 1)

> Phase 1 = the audit + comparison product. Marketing copy describing live
> capability must stay inside this scope. The V1 marketplace (next section)
> is forward-looking.

### 3.1 What customers can do right now

- **Forward any motor policy or renewal quote** (PDF, image, multi-page) to
  `review@rightoffer.in`. No sign-up. No password.
- **Or upload directly** at rightoffer.in/upload — same flow without email.
- **Receive a personalised audit** (one PDF + a magic-link web view) inside
  ~2 minutes.
- **Forward multiple documents** (e.g. old policy + new renewal quote + a
  competing quote). RightOffer reads all of them, builds a **side-by-side
  comparator**, and gives a cross-document verdict ("keep your current
  HDFC policy but add Engine Protector + Consumables — ₹3,200, closes
  ₹2.6 L of claim-time exposure").
- **Open the comparator on the web** via a one-click magic link (no
  password — the link signs you in for 7 days).
- **Reply to the audit email** if anything needs a closer look. Every reply
  is read and answered.

### 3.2 What the audit actually contains

A single document. Editorial typography — serif body, mono labels — closer
to a financial-times review than to an insurance form. Sections in order:

1. **Owner + vehicle anchor** — make / model / year, RTO, registration.
2. **Aryan's bottom line** — one verdict, one highlighted "what to do"
   callout. (Aryan = our editorial advisor persona; see §6.)
3. **Coverage snapshot table** — every covered feature and every standard
   add-on (8 of them) shown side-by-side with status:
   - ✓ Covered (green)
   - ✗ Missing & matters (red)
   - ✗ Worth considering (amber)
   - ✗ Skippable (slate)
   - Plus a "Recommended" column tagged **Must have / Good to have / May have**
     for the customer's exact profile.
4. **Per-feature insights** — 1–3 sentences each on the add-ons that matter.
   Cites RTO flood-risk profile, vehicle age vs depreciation curve, fuel
   type, smart-key replacement cost, etc.
5. **Things to ask before binding** — 3–5 ready-to-copy questions /
   negotiation lines, phrased exactly as a buyer would WhatsApp them to
   their agent.
6. **Per-document annexure** — for each forwarded doc, a complete
   "test-drive review" of that single document, scored on a Critical /
   Watch / Decent / Good / Excellent meter, with claim-time math per gap
   ("Without this cover: ₹27,500 out of pocket. With this cover: ₹2,000.").
7. **Glossary** — every insurance term used in the report, in plain English,
   anchored to the customer's actual situation.
8. **How we read this** — a small "process trail" footer (read your policy
   line by line, identified X strengths, flagged Y gaps, evaluated 8 add-ons,
   wrote N renewal tips).

### 3.3 Distribution channel that makes Phase 1 distinctive

**Email forward as a first-class input.** This is the only consumer
insurance product in India where you can forward whatever piece of paper
your agent sent you (broker quote, scanned policy, WhatsApp PDF) and get a
real audit back, no friction. It works on phones, on desktops, with PDFs or
photos, single document or many. The customer journey is a forward + a
reply — there is no funnel to drop out of.

### 3.4 Phase 1 KPIs we care about

- Forward-to-report conversion (target: > 95%, dependent on parser robustness)
- Time from forward to audit delivery (target: < 120s including PDF render)
- Multi-doc forwards as % of total (signals the comparator is the killer feature)
- Magic-link open rate on the audit email
- Reply rate to the audit email (signals trust + engagement)
- Re-forwards within 12 months (the data-flywheel signal)

---

## 4. The full V1 vision (in build, for forward-looking marketing + investor / insurer talk)

> Anything in this section is **in build**, not live for customers yet. Mark it
> as roadmap when in customer copy. Investor + insurer copy can use it freely.

### 4.1 What V1 adds on top of Phase 1

- **Reverse-bidding marketplace.** Customer confirms a bundle. RightOffer
  RFQs that bundle to onboarded insurers. Insurers bid for that specific
  customer with a total-payable premium. Customer sees winner prominently
  + alternatives collapsed.
- **One-click curated bundle.** Customer can accept Aryan's recommended
  bundle in a single tap, or fine-tune add-ons themselves.
- **End-to-end checkout.** KYC (DigiLocker eKYC + PAN + CKYC) +
  Razorpay/PayU + insurer policy issuance in under 5 minutes.
- **Renewal cadence engine.** Every parsed policy becomes a contactable
  lead with 60/30/15/7/1-day pre-expiry nudges + post-expiry continuation +
  lapsed-buyer re-engagement loop, across email + SMS + Telegram (WhatsApp
  post-MVP).

### 4.2 The bidding mechanics in one para

Insurer bids = total payable premium. TP component is IRDAI-fixed (no
discounting). Insurers compete on OD premium + add-on bundle pricing.
Sourcing happens in three tiers in priority order: (1) insurer-pre-configured
rate cards, (2) real-time API auction against the insurer's rating engine,
(3) time-boxed underwriter pool with SLA. Tiebreakers: lowest price → higher
platform rating → equal display order. The customer never sees their data
sold or pushed to call centres — the bid happens machine-to-machine.

### 4.3 The commercial model

- **Free for customers.** Always. No subscription, no transaction fee.
- **IRDAI-capped broker commission** on motor insurance (~17.5% OD,
  considerably lower on TP). Same rate from every onboarded insurer — zero
  commercial pressure on the recommendation.
- **Insurers pay nothing to list.** They pay only when they win a customer.
  Display order is never paid-for; only earned via consumer-rating CSAT.

### 4.4 Day-1 + months 2–3 launch shape

- IRDAI composite broker licence (no aggregator constraints on ranking).
- 1 insurer on day-1, insurers 2 and 3 onboarded over months 2–3.
- Renewals only (existing-policy upload required).
- Single-car per customer; data model multi-car-ready.
- Pan-India.

### 4.5 What's explicitly out of V1 scope

- New-car-buyer flow (Phase 2)
- Lapsed-policy purchase flow (Phase 2)
- Multi-car dashboard UI (data model ready, UI deferred)
- Platform-side claim filing / tracking (kept entirely with the insurer; keeps
  RightOffer clear of IRDAI Outsourcing of Activities rules)
- Live chat / call centre / synchronous support (in-app self-service only —
  the V1 promise is *savings*, not service breadth)
- WhatsApp BSP channel, native mobile apps, Hindi/regional UI strings (LLM
  multilingual report content is supported)

---

## 5. Brand identity

### 5.1 Name

- **RightOffer.** Plain compound. Same shape in voice (italic serif "r" +
  small-caps RightOffer) and in promise: *right cover at the right price.*
- **Sub-brand:** *RightOffer · Car* (sage-pill "CAR" lockup) — future-proofs
  the surface for Health / Life / Home (post-V1, multi-year).

### 5.2 Tone

Editorial, not transactional. Sound like a thoughtful financial review you
look forward to reading, not an insurance form you dread filling. Calm,
specific, useful. Confident without being preachy. Indian in idiom but
internationally-readable in vocabulary.

### 5.3 Visual

- **Type:** Serif body (Georgia / Source Serif feel), monospace labels
  (Menlo / mono) for kickers and small-print, sans for UI.
- **Palette:** charcoal text on off-white background. Brand accents —
  **plum** (#3A1E3D-ish) for editorial kickers + CTAs; **sage** for the CAR
  pill and the "Covered" status; **amber** for "worth considering"; **alert
  red** for missing-and-matters; **slate** for neutral copy.
- **Layout:** Plenty of vertical breathing. Mono small-caps kickers
  (`· COVERAGE SNAPSHOT ·`). Italic serif headlines with one or two words
  italicised for emphasis. No icons-as-decoration; icons only when they
  carry information (✓ / ✗ / chips).
- **Density signal:** A RightOffer document looks more like the
  Economist's car review than like a Tata AIG renewal letter. That's the
  point.

### 5.4 The Aryan persona

- **Aryan** is RightOffer's editorial advisor voice. He shows up in the
  audit ("Aryan's (Your RightOffer Advisor) bottom line"), in the email
  reply, in the renewal nudges later.
- Aryan is **not a chatbot**. He doesn't have a face, doesn't claim to be a
  person, never says "I". He's a stable byline — like a column you read
  every season at renewal.
- Aryan's job is to translate insurance into plain English with a verdict
  attached. He says things like *"At 0% NCB nothing to protect yet — revisit
  this once you build up to 20–25%."* — opinionated, specific, calmly
  certain.

### 5.5 What we never sound like

- Not pushy ("BUY NOW", "Limited time offer", "Save up to ₹X !!")
- Not jargon-y ("OD-cum-TP", "no-claim bonus inception")
- Not hedged ("you may want to consider perhaps reviewing")
- Not infantilising ("don't worry, we've got you")
- Not Western-fintech-cool ("✨ Boom. Your audit is here ✨")

---

## 6. Differentiators (vs the three real competitor categories)

### 6.1 vs PolicyBazaar / Insurancedekho / Coverfox (aggregators)

- They sell **leads** to insurers; we run a **bid auction** where insurers
  compete for the customer. Their incentive is volume; ours is fit.
- They optimise for **highest-commission insurer placement**; we charge the
  IRDAI-capped rate uniformly, so display order is purely consumer CSAT.
- Their core artifact is a **comparison table**; ours is an **audit**. The
  customer learns whether their *current* cover is right before being asked
  to switch.
- They drop the customer into a **call-centre funnel** post-quote; we never
  share contact details with insurers and there is no outbound call.
- They are **transaction-first**; we are **advice-first**. Phase 1 doesn't
  even sell anything.

### 6.2 vs Acko / Go Direct / direct-to-insurer

- Direct sites only show you **their own product**. RightOffer compares
  across insurers AND audits your existing cover from any insurer.
- Direct sites have no incentive to surface gaps in their own product;
  we're insurer-agnostic.

### 6.3 vs agents / brokers / WhatsApp-quote-spam

- An agent's commission rises with add-on premium → they overprescribe.
  RightOffer's commission is fixed by IRDAI → no overprescribe incentive.
- An agent emails you a PDF you can't decode without them. RightOffer
  decodes it independently.
- An agent is one click away from a sales conversation. RightOffer's audit
  is one email forward away from a written second opinion.

---

## 7. Proof points and numbers (usable in copy verbatim)

Use these as concrete anchors. Update if the underlying figures shift.

- **8 standard add-ons evaluated per audit** (Zero Dep, Engine Protector,
  Return to Invoice, Roadside Assistance, NCB Protection, Consumables, Key
  Replacement, Loss of Personal Belongings).
- **Audit delivered in ~2 minutes** from forward to email reply (incl.
  rendered PDF + magic-link web view).
- **No sign-up, no password, no form.** Forward an email; open the link.
- **Single doc or many.** Forward an old policy + new quote + competing
  quote, get a cross-document verdict.
- **Claim-time exposure quantified per gap.** "₹27,500 out of pocket without
  this cover; ₹2,000 with it" — derived from age/RTO/fuel/repair-bill data.
- **IDV cross-checked.** Against Cars24 / Spinny / OLX comparables for the
  exact variant, age, and metro.
- **RTO-aware.** Flood-prone metros (Mumbai, Kalyan, Chennai, Kolkata,
  Bengaluru) flagged for Engine Protector relevance; smart-key vehicles
  flagged for Key Replacement; older cars flagged for Consumables.
- **Bias-free by construction.** Same broker commission rate from every
  insurer; "best fit" is the only ranking criterion.
- **DPDP-compliant by default.** Explicit consent collected at the OTP gate;
  data residency 100% in India (no US-hosted LLM API calls in production);
  3-year retention or until consent withdrawal.

---

## 8. Compliance, trust, "what we don't do"

These are useful to surface in B2C copy as honest reassurance, in investor
copy as defensibility, and in insurer copy as integration comfort.

- **We are an IRDAI composite broker** — not an aggregator. Means our
  ranking can reflect fit, not just price.
- **We do not sell customer contact details.** Insurers see anonymised
  RFQs; the customer's identity flows only at policy-issuance time.
- **We do not file claims for you.** Claims stay with your insurer — by
  regulatory design, not laziness.
- **We do not call.** No outbound voice, no SMS spam, no WhatsApp blast.
  Comms are in-product + cadence-emails the customer can unsubscribe with
  one click.
- **We do not push the highest-commission product.** Same broker rate
  across every insurer.
- **We are an "independent review" for your records** — every audit ends
  with a *General Information Guide* note pointing back to the original
  insurer's policy wordings as the authoritative source.

---

## 9. The three audiences — angles per audience

### 9.1 B2C customer

**Core promise:** *Forward your policy. Get an honest, plain-English audit
of what's covered, what's missing, and what a claim would actually cost —
in 2 minutes.*

**Pains we mirror:** insurance is opaque, renewal feels like a guess,
agents push add-ons, aggregators trigger call-spam.

**Emotional register:** calm, smart-friend-who-just-read-it-for-you, never
fear-mongering.

**Best channels (Phase 1):**
- Word-of-mouth ("forward your policy to that thing") — the email-forward
  product is inherently shareable.
- Renewal-month organic content (the 30 / 15 / 7 days before expiry of any
  Indian car policy is when "should I renew this?" is searched).
- Twitter/X (urban car-owner audience overlaps with quote-screenshot
  culture).
- Reddit: r/IndiaInvestments, r/personalfinanceindia.
- LinkedIn for the founder narrative + B2B halo.
- Partnerships with car-owner communities (Team-BHP, owner clubs).

### 9.2 Investor / VC

**Core pitch:** *India motor insurance is ₹85k cr+ annual premium, ~70%
renewals, and the renewal moment is structurally under-served.
PolicyBazaar's leads-sales model and direct-to-insurer apps both lock the
customer out of an honest second opinion. RightOffer is an IRDAI broker
licence + an AI-native audit + a reverse-bidding marketplace. The audit
acquires the customer at the moment of highest intent; the marketplace
monetises at uniform broker commission; the renewal cadence engine
compounds CAC across years.*

**The flywheel one-liner:** *Every parsed policy is a contactable lead
forever. The customer doesn't churn — they just renew, and we already know
their car, their NCB, their pincode, their gap pattern.*

**Defensibility:**
- IRDAI composite broker licence (web-aggregator regs would forbid the
  ranking logic).
- Insurer-side API spec we own; insurers integrate to *our* shape, not the
  other way around.
- Data flywheel: every audit deepens the parser's accuracy and the bidding
  signals, which deepens audit quality, repeat.
- No commission conflict by construction — uniform IRDAI-capped broker fee
  across insurers.

**Traction signals to feature (when available):** parser-pass rate, audit
turnaround, forward volume, multi-doc forward %, reply-to-audit rate,
re-forward-in-12-months %, insurer LOIs, day-1 partner, conversion at the
RFQ → bid step once bidding goes live.

### 9.3 Insurer / partner

**Core pitch to an insurer:** *We send you bids from customers who have
already chosen their bundle. No lead-list of phone numbers — just a clean
RFQ on a specific bundle for a specific vehicle, with a transparent
tiebreaker on price and CSAT. You pay only when you win. Commission is at
the IRDAI cap, identical to every other insurer on the platform — so your
placement is decided on fit, not on what you'll pay us.*

**What they get:**
- High-intent RFQs at renewal moment.
- No middleware aggregator — direct integration to our API spec (3-tier
  sourcing: rate-card preferences, real-time API auction, time-boxed
  underwriter pool — pick any combination).
- Sandbox + OpenAPI spec before scaling integration.
- Customer profile carrying full audit context (parsed policy, claim
  disclosure, declared preferences) — quality input that's hard to fake.

**What we ask for:**
- Day-1 partner: rate-card flexibility + one of the three API integration
  paths + commitment to honour bids machine-to-machine for a defined
  validity window.

---

## 10. Sample copy library

### 10.1 Taglines (ready-to-use or adapt)

- *Right Cover. Right Price. The Right Offer.*  ← current primary
- *The renewal review your agent won't write.*
- *Forward the policy. Get the audit. Skip the pitch.*
- *Insurance, in plain English — at the one moment it actually matters.*
- *An honest second opinion on your motor cover, by email.*
- *Two minutes. One PDF. Zero call-spam.*
- *Your policy, audited like a balance sheet.*
- *The independent review aisle India's motor insurance never had.*
- *Renewal-time clarity for car owners — without the call centre.*
- *Read the cover before you renew it.*

### 10.2 Hero block — landing page (customer)

**Heading:** *Read your policy before you renew it.*

**Sub:** *Forward any motor insurance policy or renewal quote to
review@rightoffer.in. In two minutes you'll have a calm, plain-English
audit — what's covered, what's missing, and what a claim would actually
cost. Multiple documents? We compare them side by side. No sign-up, no
password, no call-spam.*

**CTA:** *Forward a policy →*  /  *or upload it here.*

### 10.3 Hero block — landing page (investor variant for /investor)

**Heading:** *An AI-native audit and reverse-bidding marketplace for
India's ₹85,000 cr motor insurance market.*

**Sub:** *Renewal is the moment of highest intent and lowest information.
RightOffer audits any policy in two minutes, then runs a transparent
auction for the customer's renewal — at the IRDAI-capped broker
commission, identical from every insurer. Built on an IRDAI composite
broker licence. Data residency in India.*

**CTA:** *Open the V1 deck →*

### 10.4 Email subjects (customer-facing)

- *Your motor audit is ready — Audi A6 (2015)*
- *Read your renewal before you sign it*
- *Three documents, one verdict*
- *What your HDFC quote leaves uncovered*
- *Two minutes well spent on your renewal*

### 10.5 Social posts — Twitter/X (sketches)

> Most Indian car owners renew on autopilot. They don't know their IDV is
> negotiable. They don't know Engine Protector is critical in Mumbai
> monsoon and skip-able in Indore. They don't know a missing Consumables
> cover means ₹8k out of pocket on any major repair.
>
> So we built a thing. Forward your policy to review@rightoffer.in. Get an
> audit. Decide.

> 8 add-ons. 1 IDV. 1 NCB. 1 policy type. A handful of decisions a year.
> And nobody you'd trust to walk you through it for free.
>
> rightoffer.in — independent motor insurance audit. No sign-up, no
> call-spam.

### 10.6 Ad headline + body (Phase 1 — performance)

- **Headline:** *Forward your policy. Skip the renewal guesswork.*
  **Body:** *Two-minute audit by email. What's covered, what's missing,
  what a claim would cost. No sign-up.*
- **Headline:** *The motor insurance review your agent won't write.*
  **Body:** *Independent. Plain English. Free for car owners. Try one
  document or compare three.*
- **Headline:** *Three quotes? Forward them all.*
  **Body:** *We compare them side by side and write the verdict.*

### 10.7 Deck headline patterns (investor)

- *India's renewal moment is structurally under-served.*
- *Aggregators sell leads. We run an auction.*
- *Every parsed policy is a contactable lead forever.*
- *IRDAI broker licence + AI-native audit + reverse-bidding.*
- *Same broker rate from every insurer. No commercial bias by construction.*

### 10.8 Insurer outreach (B2B email opener)

> *Hi [Name], we're RightOffer — an IRDAI composite broker running an
> AI-native audit and reverse-bidding marketplace for motor renewals. Our
> bids reach you as clean RFQs on specific bundles for specific vehicles.
> You pay only when you win, at the IRDAI-capped broker rate — uniform
> across every insurer on the platform. Worth a 20-minute walkthrough on
> the integration paths?*

---

## 11. DO / DON'T for marketers and copywriters

### Do

- Treat insurance like a serious topic explained simply, not a serious topic
  hidden behind tone.
- Quantify out-of-pocket risk in rupees whenever possible — that's the
  single most persuasive number in the category.
- Use specific add-on names, specific cities, specific claim scenarios.
- Lead with the audit. The auction is the second beat, not the first.
- Mention the email-forward channel often — it's the most distinctive
  product feature in Phase 1.
- Keep CTA verbs gentle: *Forward · Open · Read · Compare · Decide.*

### Don't

- Don't promise specific savings amounts (e.g. "Save ₹4,000"). Use ranges
  ("often ₹3,000–₹8,000 on add-on rebalancing alone") and condition on
  profile.
- Don't badge ourselves as "compare 30 insurers!". We're not an aggregator.
- Don't write "lowest premium guaranteed" — premium is one variable; fit is
  the other.
- Don't claim claim assistance / claim filing. We don't do that, and IRDAI
  rules require we don't.
- Don't use scare-language about specific insurers. Our voice is calmly
  comparative, not adversarial.
- Don't anthropomorphise Aryan beyond an editorial byline (no avatar, no
  chat bubbles, no "Hi I'm Aryan!").

---

## 12. Plain-English glossary (use freely in copy)

- **IDV (Insured Declared Value)** — the agreed market value of your car at
  policy purchase. The maximum your insurer pays on total-loss. A higher
  IDV protects you better but raises premium; a lower IDV saves premium
  today but leaves you short.
- **NCB (No-Claim Bonus)** — discount on next year's premium for staying
  claim-free. Year 1 → 20%; Year 2 → 25%; Year 3 → 35%; Year 4 → 45%;
  Year 5+ → 50%. One claim resets it to 0. Rebuilding takes ~4–5 claim-free
  years.
- **NCB Protection** — small add-on that lets you make one claim without
  losing the NCB.
- **OD (Own Damage)** — the part of motor insurance that covers accidental
  damage, fire, theft, natural disasters to your own car. This is where
  insurers compete on price; TP can't be discounted.
- **TP (Third-Party)** — the IRDAI-fixed liability portion. Mandatory by
  law. No discounting allowed.
- **Comprehensive Package** — OD + TP combined. What most owners need.
- **Zero Depreciation** — removes the insurer's deduction for parts'
  depreciation at claim time. Best value Years 1–5; less useful as the car
  ages.
- **Engine Protector** — covers consequential engine damage from flooding
  / hydrostatic lock / oil leakage. Base policy does NOT cover this.
  Essential in flood-prone metros.
- **RTI (Return to Invoice)** — on total-loss, tops up the IDV gap to the
  original on-road invoice value. Best value Years 1–3.
- **RSA (Roadside Assistance)** — 24/7 towing, battery jump, flat-tyre,
  locked-keys help. Cheap and high-utility.
- **Consumables Cover** — covers engine oil, brake fluid, AC gas, nuts,
  bolts in claim repairs (otherwise deducted). Worth more on older cars.
- **Key Replacement** — covers cost of replacing dealer-programmed smart
  keys. Worth it on premium vehicles.
- **LOPB (Loss of Personal Belongings)** — covers laptop / bag / phone if
  stolen after a vehicle break-in. Most relevant to premium-vehicle owners.
- **RTO (Regional Transport Office)** — issues your car's registration.
  RightOffer infers city + flood-risk profile from this.
- **DPDP Act 2023** — India's Digital Personal Data Protection Act.
  Explicit consent required for processing PII; RightOffer collects it at
  the OTP gate.

---

## 13. FAQ (use as raw material; rephrase per channel)

**Is RightOffer free?**
For car owners, yes — always. We earn a broker commission from the insurer
when you buy a policy through us. That commission is capped by IRDAI and
identical from every insurer on the platform.

**Are you an aggregator like PolicyBazaar?**
No. We're an IRDAI composite broker. Aggregator regulations would prevent
us from ranking by fit instead of by price alone. We also don't sell your
contact details to insurers — there's no call-centre on the other side of
an audit.

**Do I have to sign up?**
No. Forward any motor policy or renewal quote to review@rightoffer.in and
we'll reply with an audit. If you want to download or save the audit, we
ask for a phone number at that point (per India's data-protection rules).

**Can you read a scanned image, or only PDFs?**
Both. PDF, JPG, PNG, HEIC, multi-page — all handled.

**What if I have multiple quotes?**
Forward them all. We'll build a side-by-side comparator and give a
cross-document verdict on which to take and what to negotiate.

**Can you file a claim for me?**
No. Claims stay with your insurer — that's by regulatory design (the IRDAI
Outsourcing of Activities Regulations keep claim handling with the
insurer). We help you understand your cover and choose well; the insurer
handles claims directly.

**Will you call me?**
No. We only contact you over email (and SMS for the OTP).

**How is the recommendation independent?**
Because the broker commission we earn is identical from every insurer
on the platform. There's no insurer we'd nudge you toward for a higher
margin — there's no higher margin available.

**Where does my data go?**
Stored in India. No US-hosted LLM API calls. Retained for 3 years after
your last interaction, or until you tell us to delete it (reply DELETE to
any email).

---

## 14. Tech credibility one-liners (for investor / insurer / dev-audience copy)

- **LLM-native parser** with structured JSON extraction and per-field
  confidence scoring; regression-tested against a growing seed set of real
  policies.
- **Puppeteer-rendered editorial PDF** matching the on-screen report 1:1 —
  one HTML/CSS source, no parallel template.
- **Vercel + Vercel KV (Upstash Redis) + Vercel Blob** for the live stack;
  AWS Mumbai-region for the V1 inference + DB layer.
- **Postmark Inbound** for the email-forward webhook; **Resend** for outbound.
- **Cron-driven renewal cadence engine** (Phase 1 has the hourly digest
  scaffold; V1 adds the BullMQ-backed 60/30/15/7/1-day cadence).
- **Magic-link auth** (HMAC-signed tokens, 7-day expiry) for the audit
  reply — no passwords anywhere on the customer surface.

---

## 15. Distribution + acquisition notes for Phase 1

The product is built so the customer can come back with a piece of paper
(email) instead of a workflow (form). That changes which channels make
sense:

- **High-trust referrals and word of mouth.** The forward-an-email gesture
  is shareable in WhatsApp groups, owner forums, friend-of-a-friend asks.
  Treat existing customers as the primary acquisition channel — *"forward
  your policy to that RightOffer thing"* is an entire customer-acquisition
  motion if even 5% of audits get re-forwarded.
- **Renewal-timing content.** SEO + organic for "Audi A6 insurance
  renewal Delhi", "Honda City renewal NCB", "Maruti Swift policy review
  India" type queries — every Indian car-model + renewal-intent query is a
  target.
- **Twitter/X for the founder narrative + product transparency.** Audit
  screenshots, claim-time-math threads, and "what an audit looks like" walk-throughs.
- **LinkedIn for the investor + insurer halo + recruiting + B2B narrative.**
- **Reddit (r/IndiaInvestments, r/personalfinanceindia).** Long-form
  explainer answers that link back to forward-the-policy.
- **Owner communities (Team-BHP, marque-specific clubs).** Editorial
  partnerships (we'll review your readers' policies for free).
- **Email forward is the ad unit.** Anywhere we can place
  `review@rightoffer.in` and *"forward any motor insurance policy"* — that's
  the entire ask. Print, podcast read, sticker on a windshield. Low
  friction is the moat.

---

## 16. Quick-reference appendix

- **Brand name:** RightOffer · Car
- **Tagline (current):** Right Cover. Right Price. The Right Offer.
- **Customer entry-point:** rightoffer.in · review@rightoffer.in
- **Founder + reply address:** chaudharimanish1977@gmail.com
- **Editorial byline:** Aryan (Your RightOffer Advisor)
- **Voice in one sentence:** *Calm, specific, plain-English second opinion at
  the renewal moment — never a sales pitch.*
- **Phase 1 in one sentence:** *Forward your policy, get a Big-4-style
  audit by email in two minutes.*
- **V1 in one sentence:** *Audit + reverse-bidding marketplace for motor
  renewals, on an IRDAI broker licence, with uniform commission so the
  ranking stays honest.*
- **What we will never do:** call you, file your claim for you, sell your
  contact details, push the highest-commission product.
