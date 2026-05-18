"use client";

import { useState, type FormEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signIn } from "next-auth/react";
import { PlateOtpInput } from "@/components/plate-otp-input";

/**
 * Report gate — Phase 6.3 editorial reframe with Continue-with-Google
 * as the primary unlock option.
 *
 * Sits between "What's Missing" and "At Renewal" in /report/[id] for
 * customers who haven't verified their email yet. Two paths through:
 *
 *   1. Continue with Google  →  one tap, ~5s round-trip via OAuth
 *      (the official Google button, identical to /me/login)
 *   2. Email + 4-digit code →  the existing OTP flow (preserved as
 *      fallback for visitors who don't have a Google account, or
 *      prefer email)
 *
 * Editorial styling locked in:
 *   · No more gradient bg-brand-navy modal — replaced with hairline
 *     section break + serif heading + plum CTAs
 *   · Mono kicker · serif headline with italic-plum accent
 *   · Email field in the editorial capsule treatment (plum focus)
 *   · `brand-alert` for true errors, not the old red-rose family
 *
 * WhatsApp field dropped from V1 of this surface — it was marked
 * "coming as soon as our setup is approved" in the old code (not
 * actually functional) and added friction at the moment of highest
 * conversion pressure. We'll re-introduce WhatsApp on a different
 * surface (post-sign-in nudge) when the Business API is wired.
 */

type Step = "form" | "otp";

interface Props {
  /** Optional — analytics / future server hints. */
  reportId?: string;
  /** The customer's registration plate, surfaced inside the OTP
   *  input as a plate-style continuation (e.g. `DL-09-CAU-2020`). */
  vehiclePlate?: string;
  /** Fallback shown in the plate area when the registration number
   *  is missing — typically the make + model (e.g. "Audi A6"). */
  vehicleLabel?: string;
}

export function ReportGate({
  reportId: _reportId,
  vehiclePlate,
  vehicleLabel,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  // True once the OTP has verified successfully and we've kicked
  // off `router.refresh()`. We don't reset `submitting` on success
  // (the component is about to unmount), but we still need a flag
  // so the button copy can flip to "Unlocked — opening…" rather
  // than staying on "Unlocking…" indefinitely if the refresh is
  // slow on a flaky connection.
  const [verified, setVerified] = useState(false);

  /* ─── Continue with Google ───────────────────────────────────────── */

  function onGoogle() {
    if (googlePending) return;
    setGooglePending(true);
    // Send the customer back to the same report URL after the OAuth
    // round-trip — the page re-renders without the gate because the
    // ro-session cookie is now set.
    void signIn("google", { callbackUrl: pathname || "/me" });
  }

  /* ─── OTP fallback ────────────────────────────────────────────────── */

  async function onSubmitForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const cleanEmail = email.trim();
    if (
      !cleanEmail ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)
    ) {
      setError("Please enter a valid email.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/report-gate/request-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? "Couldn't send the code. Try again.");
        return;
      }
      setStep("otp");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmitOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting || verified) return;
    const cleanOtp = otp.replace(/\D/g, "").slice(0, 4);
    if (!/^\d{4}$/.test(cleanOtp)) {
      setError("Enter the 4-digit code we emailed you.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/report-gate/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: cleanOtp,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        verified?: boolean;
        error?: string;
      };
      if (!res.ok || !data.verified) {
        setError(data.error ?? "Couldn't verify the code.");
        setSubmitting(false);
        return;
      }
      // Success — lock the button into a final "Unlocked, opening…"
      // state while the server-component refresh removes the gate.
      // We deliberately DON'T reset `submitting` here; the component
      // will unmount when the page re-renders without the gate, so
      // any state change is wasted work. Resetting it created a
      // visible flicker where the button briefly reverted to its
      // default copy before the page re-rendered.
      setVerified(true);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setSubmitting(false);
    }
  }

  async function onResend() {
    if (resending) return;
    setResending(true);
    setError(null);
    try {
      const res = await fetch("/api/report-gate/request-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        setError("Couldn't resend right now. Try again in a minute.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setResending(false);
    }
  }

  /* ─── Render ──────────────────────────────────────────────────────── */

  return (
    <section className="relative mt-2 md:mt-4">
      {/* Editorial section break above + below — signals "we cut off
       *  here" without using a modal frame. */}
      <div className="border-t border-brand-charcoal/15" />

      <div className="max-w-xl mx-auto pt-9 md:pt-12">
        {/* Kicker — caring, not "locked". The customer just spent
            two minutes giving us their policy and their answers; the
            tone here should acknowledge that, not gatekeep. */}
        <div className="text-center font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-plum font-bold">
          · Oops — we haven&rsquo;t met yet ·
        </div>

        {/* Headline */}
        <h2 className="mt-4 text-center font-serif font-medium text-[28px] md:text-[36px] tracking-[-0.02em] leading-[1.1] text-brand-charcoal m-0">
          Wait, we&rsquo;d love to{" "}
          <span className="italic text-brand-plum">send this to you.</span>
        </h2>

        {/* Intro — empathetic, considerate. Names the trade-off (you
            lose the saved copy + future updates) without making the
            customer feel locked out. */}
        <p className="mt-3 text-center font-serif italic text-[15px] md:text-[16px] leading-[1.55] text-brand-slate max-w-md mx-auto">
          Your full review is ready — but without your email we
          can&rsquo;t keep a copy for you, remind you when renewal
          comes around, or share insights we curate for your car. One
          quick step, no sales calls, ever.
        </p>

        {/* Google button — primary path */}
        <div className="mt-7 md:mt-9">
          <button
            type="button"
            onClick={onGoogle}
            disabled={googlePending || submitting}
            aria-label="Continue with Google"
            className="w-full inline-flex items-center justify-center gap-3 h-11 px-4 rounded-md bg-white border border-[#dadce0] hover:bg-[#f8f9fa] disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium text-[14px] tracking-[0.005em] text-[#3c4043] shadow-[0_1px_2px_rgba(60,64,67,0.06)] font-sans"
          >
            <GoogleGlyph />
            <span>
              {googlePending
                ? "Opening Google…"
                : "Continue with Google"}
            </span>
          </button>
        </div>

        {/* Separator */}
        <div className="mt-6 md:mt-7 flex items-center gap-3">
          <div className="flex-1 border-t border-brand-charcoal/15" />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand-slate">
            or with email
          </span>
          <div className="flex-1 border-t border-brand-charcoal/15" />
        </div>

        {/* OTP flow — form or otp step */}
        <div className="mt-6 md:mt-7">
          {step === "form" ? (
            <form onSubmit={onSubmitForm} className="space-y-3">
              <label className="block">
                <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate font-bold mb-1.5">
                  Email address
                </span>
                <input
                  type="email"
                  required
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={submitting || googlePending}
                  className="w-full px-4 py-3 font-serif text-[15px] text-brand-charcoal placeholder:text-brand-slate/50 bg-brand-offwhite border border-brand-charcoal/15 rounded-full focus:outline-none focus:border-brand-plum focus:ring-2 focus:ring-brand-plum/15 transition-colors disabled:opacity-60"
                />
              </label>

              {error && (
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-alert font-bold text-center">
                  · {error} ·
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || googlePending || !email}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-brand-plum text-brand-offwhite px-7 py-3 rounded-full font-serif italic font-medium text-[15px] min-h-[44px] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {submitting
                  ? "Sending the code…"
                  : "Email me a 4-digit code"}
              </button>
            </form>
          ) : (
            <form onSubmit={onSubmitOtp} className="space-y-3">
              <div className="text-center">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand-sage font-bold">
                  · Check your inbox ·
                </div>
                <p className="mt-2 font-serif italic text-[14px] md:text-[15px] text-brand-slate leading-[1.55]">
                  We sent a 4-digit code to{" "}
                  <span className="not-italic text-brand-charcoal">
                    {email}
                  </span>
                  .
                </p>
              </div>

              <div>
                <div className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate font-bold mb-2.5">
                  Tap the plate to type the code
                </div>
                <PlateOtpInput
                  vehiclePlate={vehiclePlate}
                  vehicleLabel={vehicleLabel}
                  value={otp}
                  onChange={setOtp}
                  disabled={submitting || verified}
                  autoFocus
                />
              </div>

              {error && (
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-alert font-bold text-center">
                  · {error} ·
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || verified || otp.length !== 4}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-brand-plum text-brand-offwhite px-7 py-3 rounded-full font-serif italic font-medium text-[15px] min-h-[44px] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {verified
                  ? "Unlocked — opening…"
                  : submitting
                    ? "Unlocking…"
                    : "Unlock the rest of my review"}
              </button>

              <div className="flex items-center justify-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
                    setOtp("");
                    setError(null);
                  }}
                  disabled={submitting || verified}
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate font-bold hover:text-brand-charcoal disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  · Different email ·
                </button>
                <button
                  type="button"
                  onClick={onResend}
                  disabled={resending || submitting || verified}
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-plum font-bold hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  · {resending ? "Sending…" : "Resend code"} ·
                </button>
              </div>

              <p className="text-center font-mono text-[9.5px] uppercase tracking-[0.12em] text-brand-slate pt-1">
                · Can&apos;t find it? Check Promotions / Spam · sender:
                hello@rightoffer.in ·
              </p>
            </form>
          )}
        </div>

        {/* Trust line — small editorial footer */}
        <p className="mt-7 md:mt-8 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-brand-sage font-bold">
          · No sales calls. Ever. · We only message about renewals ·
        </p>
      </div>

      <div className="mt-10 md:mt-12 border-t border-brand-charcoal/15" />
    </section>
  );
}

/* ─── Official Google glyph (multicoloured G, inline SVG) ────────── */

function GoogleGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.8595-3.0477.8595-2.3445 0-4.3286-1.5832-5.0359-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.9641 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.9641 10.71z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.9641 7.29C4.6714 5.1627 6.6555 3.5795 9 3.5795z"
        fill="#EA4335"
      />
    </svg>
  );
}
