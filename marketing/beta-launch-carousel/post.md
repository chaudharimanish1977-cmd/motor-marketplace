# RightOffer — Beta launch LinkedIn

Two artefacts here. Post the **announcement** on day 1; the **deep deck**
is the second-wave / website follow-up.

---

## DAY 1 — Announcement post (5-slide tight deck)

**Deck:** `announcement.pptx`
**Previews:** `previews-announcement/slide-0[1-5].png`

### Narrative arc
1. **Hook** — "Most owners read their policy *once*. After it's too late." Pattern-interrupt opener.
2. **Why we built this** — family-burned story in 'we' voice. *"Someone close to us discovered at claim time…"*
3. **Gap caught (illustrative)** — Zero-dep cover expired silently, ~₹38,000. Footer flags it as anonymised composite.
4. **The ask** — envelope sketch, `review@rightoffer.in`, *Two minutes. Free. No signup.*
5. **What's next** — soft Phase 2 signal: *"Phase 2: something bigger. Stay close."*

### Post body (founder-voice, we-pronoun)

```
Someone close to us discovered at claim time that their motor policy didn't actually cover their car.

That's when we started reading policies for ourselves.

Then we built the audit nobody else was going to.

Forward your motor insurance to review@rightoffer.in. In two minutes we'll send back an honest read — coverage gaps, IDV check, add-on relevance, what to ask before you renew.

No signup. No comparator. No insurer push.

RightOffer is live in Beta.

→ rightoffer.in

#InsurTech #MotorInsurance
```

---

## DAY 2-3 — Deep deck (10-slide "how it works")

**Deck:** `beta-launch-carousel.pptx`
**Previews:** `previews/slide-0[1-9].png` + `slide-10.png`
**Motion variants:** `motion/cover.gif`, `cover.mp4`, `deck.mp4`

Post this as a **separate document/video post** a couple of days after the announcement, framed as *"More on how RightOffer works"* or *"For those who asked how we read"*. This is also the artefact to link from the website / share in DMs with people who want to understand the mechanism.

---

## Earlier draft (kept for reference)

### Flavor C (short and punchy)

```
RightOffer is live in Beta.

Forward your motor insurance policy to review@rightoffer.in.
In two minutes, you'll get an honest editorial audit — coverage gaps, add-on relevance, IDV check, what to ask your insurer.

No comparator. No sales calls. No insurer push.

Phase 1: the audit. Phase 2: brewing.

→ rightoffer.in

#InsurTech #MotorInsurance
```

## Carousel

Eight slides, 1080×1350 (4:5 portrait). Editorial Reading Room v3 — cream bg, plum/sage accents, Newsreader serif, mono small-caps kickers.

| # | Slide | Purpose |
|---|-------|---------|
| 1 | Cover — "Your motor insurance, *audited.*" | Hook + Beta-is-live kicker |
| 2 | "We renew it. We don't *read* it." | Behavior framing |
| 3 | "Most policies have *a gap.*" | What's at stake (directional, no fabricated stat) |
| 4 | "A *column* you trust." | Wedge — editorial, not comparator |
| 5 | "Three steps." | Forward → Aryan reads → Audit lands |
| 6 | "Five things in every audit." | Coverage / Gap / IDV / Add-ons / Renewal |
| 7 | "Phase 2 is *brewing.*" | Reverse-bidding teaser |
| 8 | rightoffer.in + review@rightoffer.in | CTA + wordmark |

## Motion variants

Three video artefacts live in `motion/` for use as standalone LinkedIn posts:

| File | Use case |
|------|----------|
| `motion/cover.gif` | 4-second loop of just the cover slide — plum car drives in from offscreen-left and parks. ~390 KB. Drop into messaging / DMs / embeds. |
| `motion/cover.mp4` | Same animation, 30fps h264 MP4. ~35 KB. Sharper than the GIF on LinkedIn feed. |
| `motion/deck.mp4` | Full 10-slide walkthrough, ~36 seconds. Cars animate on slides 1 (cover), 9 (brewing trio races in), and 10 (CTA car drives in). Crossfade between every slide. |

**How to use the motion assets:**

- Keep the carousel (`beta-launch-carousel.pptx`) as the primary post — it lets people swipe at their own pace.
- Post `motion/deck.mp4` as a *separate* video post a day or two later for second-wave reach. LinkedIn's algorithm favours native video.
- Use `motion/cover.mp4` (or `cover.gif`) as a teaser when DMing the launch to specific contacts.

## Posting notes

- Upload `beta-launch-carousel.pptx` to LinkedIn as a document post. LinkedIn renders each page as a swipeable card.
- The Newsreader serif may fall back to Cambria on viewers without the font installed — that's the explicit fallback in `build.py` and visually almost identical.
- Slide 3 deliberately makes no specific monetary claim. If we want to swap in a real number from `/admin/dashboard` later, edit `build.py:slide_stake` and rerun.

## Regenerating

```bash
cd marketing/beta-launch-carousel

# Static carousel:
python build.py
powershell -ExecutionPolicy Bypass -File export-png.ps1  # renders previews/

# Motion variants (depends on previews being up to date):
python motion-build.py
```
