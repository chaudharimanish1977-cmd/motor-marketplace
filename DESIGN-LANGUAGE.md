# RightOffer · Design language reference

This document is the source of truth for which cute ink-line element
lands on which product surface. It is meant to be read **before** any
new surface is built, so we always reach for the right metaphor and
never reuse one for the wrong moment.

The live preview of every element is at **`/preview/smileys`** (24
sections, organised in two rounds). When in doubt, open the preview.

## The two principles

1. **Never reuse a metaphor for the wrong moment.** The petrol-pump
   metaphor belongs to renewal. The traffic-jam metaphor belongs to
   the customer's pre-RightOffer pain state. They are not
   interchangeable. Reusing them dilutes both.
2. **Cute earns its place by being useful.** The illustration must
   serve the moment — reducing anxiety on a loader, signalling
   severity on a finding, celebrating a success. Decorative use
   without a job is rejected.

## The vocabulary · what goes where

### Emotional / feedback moments

| Element | Component | Canonical use |
|---|---|---|
| 5-point rating scale | `CarSmiley` (1-5) | Post-report feedback widget, post-bid follow-up, in-product NPS |
| Thank-you car | `ThankYouCar` | Post-upload screen, magic-link confirmation, post-feedback toast, receipt screens, legal-page masthead |

### Process / state moments

| Element | Component | Canonical use |
|---|---|---|
| Parsing loader (the cutest one) | `LoaderScene` | Upload-page parse wait (~30-60s) — replaces the generic spinner |
| Service-garage parsing | `SketchGarage` | Softer alternate loader for second-time customers / returning users |
| Onboarding step markers | (composed inline using `SketchCar`) | Upload → Parsing → Reviewing → Verdict → Share progress dots |
| Open road · success | `SketchOpenRoad` | Post-verdict thank-you state. "You're set. Drive on." |

### Input / interaction moments

| Element | Component | Canonical use |
|---|---|---|
| Number-plate OTP | `NumberPlateOTP` | `/me/login`, report email-gate OTP, any code-entry screen. **Brand signature.** |
| Roof-rack upload car | `SketchUploadCar` | `/upload` hero, empty `/me` "drop your first" state |

### Data-display moments

| Element | Component | Canonical use |
|---|---|---|
| Traffic-light severity | `TrafficLightDot` (high/mid/ok) | Inline next to each finding row on the report (GAP / WATCH / OK) |
| Vintage speedometer | `SketchSpeedometer` | Report header score (e.g. 62/100) |
| Vehicle-type silhouettes | `SketchSedan`, `SketchHatchback`, `SketchSUV` | Sample-review hero, vehicle-specific page contexts, pricing-tier markers |

### Action / CTA moments

| Element | Component | Canonical use |
|---|---|---|
| Petrol-pump renewal | `SketchPetrolPump` | Renewal-reminder emails, `/me` renewal-countdown card, renewal landing |
| Highway exit sign | `SketchExitSign` | Switch-insurer recommendation moment on report/comparison |
| Roadside / spare tyre | `SketchRoadside` | Explainer for add-ons (RSA, Zero-Dep, Engine-Protect) — "what this actually does" |

### Empty / error / edge moments

| Element | Component | Canonical use |
|---|---|---|
| Awful car-smiley | `CarSmiley rating={1}` | 404 / unrecoverable error pages |
| Standard ink-line car | `SketchCar` | Empty `/me` state ("no policies yet"), in-card empty states |

### Narrative / about moments

| Element | Component | Canonical use |
|---|---|---|
| Stuck in a jam | `SketchTrafficJam` | About / "why RightOffer" page hero. Pain-state visual. Used **once** per surface — don't repeat. |
| Sedan hero | `SketchSedan` | Founder-note / about-page editorial illustrations |
| Share / OG card | (composed inline with body-type sketch) | Public report share previews — `<vehicle>` silhouette + headline |

## When building a new surface

Run this checklist before deciding "we'll just put text here":

1. **What is the customer feeling at this moment?**
   - Anxious (waiting) → loader
   - Successful (just finished) → thank-you / open road
   - Frustrated (error) → awful smiley
   - About to act (CTA) → action-specific metaphor
2. **What category does the surface belong to?** Match it against
   the table above. If nothing fits, the surface might not need a
   cute element — that's fine; not every moment earns one.
3. **Is the metaphor I'm picking already used somewhere?** If yes,
   confirm it's the same *kind* of moment. Petrol-pump for renewal
   is correct; petrol-pump for "buy more cover" is *not* — the user
   isn't refuelling at the latter, they're upgrading.
4. **Does the surface need a brand-new metaphor?** If yes, propose
   it before building. The vocabulary stays small on purpose — adding
   to it dilutes the existing entries.

## What stays English / unstyled by design

These elements deliberately don't get the cute-element treatment:

- **Wordmark** (`r RightOffer CAR`) — brand mark, not body copy.
- **₹ amounts and vehicle names** (Maruti Swift, ₹2,400) — data.
- **Editorial mono labels** (`LETTER № 06`) — typographic structure.
- **Privacy/terms body prose** — long-form legal needs to be readable
  above all else. Only the masthead gets a small thank-you car.

## File layout

```
src/components/
  car-smiley.tsx           — CarSmiley (1-5), ThankYouCar
  sketches.tsx             — SketchCar (animated), SketchSedan,
                             SketchHatchback, SketchSUV, SketchCarStatic,
                             SketchDoc, SketchLoupe, SketchVerdict,
                             SketchDesk
  sketches-scenes.tsx      — SketchUploadCar, SketchPetrolPump,
                             SketchTrafficJam, SketchGarage,
                             TrafficLightDot, SketchSpeedometer,
                             SketchOpenRoad, SketchRoadside,
                             SketchExitSign
  loader-scene.tsx         — LoaderScene
  number-plate-otp.tsx     — NumberPlateOTP

src/app/preview/smileys/page.tsx
  — Live preview of every element in its mock context.
```

## Future additions

If the product introduces a moment we don't have a metaphor for, the
process is:

1. Brainstorm 2-3 car-themed metaphors that fit
2. Pick the strongest, sketch it
3. Add to `/preview/smileys` first as a mock
4. Get approval before wiring into the real surface
5. Update this document

Never bypass step 3. Mock-first, ship-second.
