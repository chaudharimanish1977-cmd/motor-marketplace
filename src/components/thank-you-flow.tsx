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
}

/**
 * Single-card thank-you. Combines what was previously three stacked cards
 * (mail-sent confirmation, thank-you note, feedback) into one tightly-laid
 * panel so the user sees feedback above the fold and conversion is higher.
 */
export function ThankYouFlow({ email }: Props) {
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

      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-orange-50/40 border border-emerald-200 shadow-elevated overflow-hidden">
          {/* TOP — mail-sent confirmation + thank-you copy combined */}
          <div className="px-6 pt-7 pb-5 text-center border-b border-brand-light-gray/70">
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

          {/* BOTTOM — feedback (or post-submit acknowledgement) */}
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

                {/* Star rating row */}
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

                {/* Rating label */}
                <div className="text-center text-xs font-semibold text-brand-charcoal min-h-[18px] mb-3">
                  {rating !== null ? RATING_LABEL[rating] : "Tap a star"}
                </div>

                {/* Comment for low ratings only — keeps the happy-path one-tap */}
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
        <div className="mt-5 text-center">
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
