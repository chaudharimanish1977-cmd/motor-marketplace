"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import {
  CheckCircle2,
  Mail,
  Star,
  Home,
  Sparkles,
  Bell,
  BellRing,
  Loader2,
} from "lucide-react";
import { Confetti } from "@/components/confetti";

const RATING_LABEL: Record<number, string> = {
  1: "Could be better",
  2: "It was OK",
  3: "It was helpful",
  4: "Really useful",
  5: "Loved it",
};

interface Props {
  email: string;
  mobile: string;
  parsedPolicyId: string;
  policyExpiryDate?: string;
}

export function ThankYouFlow({
  email,
  mobile,
  parsedPolicyId,
  policyExpiryDate,
}: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (rating === null) return;
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10">
      <Confetti />

      <div className="w-full max-w-md space-y-5">
        {/* CARD 1 — mail-sent confirmation */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-orange-50/40 border border-emerald-200 shadow-elevated overflow-hidden">
          <div className="px-6 pt-7 pb-6 text-center">
            <div className="inline-flex w-14 h-14 rounded-full bg-brand-success items-center justify-center shadow-elevated mb-3">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-brand-charcoal mb-1">
              Your report is on its way
            </h1>
            <p className="text-sm text-brand-slate mb-3 leading-relaxed">
              Thanks for trusting RightOffer. We&apos;ve emailed your full
              policy review to
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-brand-light-gray font-mono text-xs font-semibold text-brand-charcoal break-all max-w-full">
              <Mail className="w-3.5 h-3.5 text-brand-deepblue shrink-0" />
              <span className="truncate">{email || "your inbox"}</span>
            </div>
            <div className="text-[11px] text-brand-slate mt-2.5">
              Check your inbox in the next minute · also peek in promotions /
              spam.
            </div>
          </div>
        </div>

        {/* CARD 2 — renewal opt-in (only when we have policy + mobile) */}
        {parsedPolicyId && mobile && (
          <RenewalOptInCard
            email={email}
            mobile={mobile}
            parsedPolicyId={parsedPolicyId}
            policyExpiryDate={policyExpiryDate}
          />
        )}

        {/* CARD 3 — feedback */}
        <div className="rounded-3xl bg-white border border-brand-light-gray shadow-soft overflow-hidden">
          <div className="px-6 py-5">
            {!submitted ? (
              <>
                <div className="text-center mb-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-deepblue mb-1">
                    5-second feedback
                  </div>
                  <div className="text-sm font-semibold text-brand-charcoal">
                    How was your experience?
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1.5 mb-2">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = rating !== null && rating >= n;
                    return (
                      <button
                        key={n}
                        type="button"
                        aria-label={`Rate ${n} out of 5`}
                        onClick={() => setRating(n)}
                        className="p-0.5 transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star
                          className={clsx(
                            "w-8 h-8 transition-colors",
                            active
                              ? "fill-brand-orange text-brand-orange"
                              : "text-brand-light-gray"
                          )}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="text-center text-xs font-semibold text-brand-charcoal min-h-[18px] mb-3">
                  {rating !== null ? RATING_LABEL[rating] : "Tap a star"}
                </div>

                {rating !== null && rating <= 3 && (
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder="What could have been better? (optional)"
                    className="w-full px-3 py-2 mb-3 border-2 border-brand-light-gray rounded-xl text-sm text-brand-charcoal placeholder:text-brand-slate/50 focus:outline-none focus:border-brand-deepblue transition-colors resize-none"
                  />
                )}

                <button
                  type="button"
                  onClick={submit}
                  disabled={rating === null}
                  className={clsx(
                    "w-full py-2.5 rounded-xl font-bold text-sm transition-all",
                    rating !== null
                      ? "bg-brand-deepblue hover:brightness-110 text-white shadow-soft"
                      : "bg-brand-light-gray text-brand-slate cursor-not-allowed"
                  )}
                >
                  Submit feedback
                </button>
              </>
            ) : (
              <div className="text-center py-2">
                <div className="inline-flex w-10 h-10 rounded-full bg-brand-success items-center justify-center mb-2">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="font-bold text-brand-charcoal text-sm mb-0.5">
                  Got it — thank you!
                </div>
                <div className="text-[11px] text-brand-slate">
                  Your feedback helps us improve every review.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer link */}
        <div className="text-center pt-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-brand-deepblue text-sm font-semibold hover:underline"
          >
            <Home className="w-4 h-4" />
            Back to RightOffer Home
          </Link>
        </div>
      </div>
    </main>
  );
}

// ============================================================================
// Renewal opt-in — captures both email + WhatsApp in one tap
// ============================================================================

function RenewalOptInCard({
  email,
  mobile,
  parsedPolicyId,
  policyExpiryDate,
}: {
  email: string;
  mobile: string;
  parsedPolicyId: string;
  policyExpiryDate?: string;
}) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const niceDate = policyExpiryDate
    ? new Date(policyExpiryDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const subscribe = async () => {
    setErrorMsg(null);
    setState("saving");
    try {
      const res = await fetch("/api/reminders/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsedPolicyId, email, mobile }),
      });
      const data = await res.json();
      if (!res.ok || !data.subscribed) {
        throw new Error(data.error || "Couldn't save your preference");
      }
      setState("done");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    }
  };

  if (state === "done") {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-orange-50 to-white border-2 border-brand-orange/30 shadow-soft overflow-hidden">
        <div className="px-6 py-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-orange flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-brand-charcoal text-sm md:text-base">
              Locked in 🔒
            </div>
            <p className="text-xs md:text-sm text-brand-slate mt-1 leading-relaxed">
              We&apos;ll quietly nudge you{" "}
              {niceDate ? (
                <>
                  before{" "}
                  <span className="font-semibold text-brand-charcoal">
                    {niceDate}
                  </span>
                </>
              ) : (
                "before your policy expires"
              )}{" "}
              — by email and WhatsApp. Zero calls, ever. Reply STOP any time to
              opt out.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white border border-brand-light-gray shadow-soft overflow-hidden">
      <div className="px-6 py-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-deepblue/10 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-brand-deepblue" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-deepblue mb-1">
              Renewal reminder
            </div>
            <h3 className="text-base md:text-lg font-bold text-brand-charcoal leading-snug">
              Don&apos;t ghost your renewal.
            </h3>
            <p className="text-xs md:text-sm text-brand-slate mt-1.5 leading-relaxed">
              We&apos;ll send a couple of nudges{" "}
              {niceDate ? (
                <>
                  before your policy expires on{" "}
                  <span className="font-semibold text-brand-charcoal">
                    {niceDate}
                  </span>
                </>
              ) : (
                "in the weeks leading up to your renewal"
              )}{" "}
              — by email and WhatsApp. Zero calls. Reply STOP any time.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-3">
            {errorMsg}
          </div>
        )}

        <button
          type="button"
          onClick={subscribe}
          disabled={state === "saving"}
          className={clsx(
            "w-full py-2.5 rounded-xl font-bold text-sm transition-all inline-flex items-center justify-center gap-2",
            state === "saving"
              ? "bg-brand-light-gray text-brand-slate cursor-not-allowed"
              : "bg-brand-orange hover:brightness-110 text-white shadow-soft"
          )}
        >
          {state === "saving" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            "I'm in"
          )}
        </button>
      </div>
    </div>
  );
}
