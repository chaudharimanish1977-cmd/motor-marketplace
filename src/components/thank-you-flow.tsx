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
  Heart,
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

export function ThankYouFlow({ email }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (rating === null) return;
    // In production this'd POST to /api/feedback. For the prototype we just
    // record it client-side so the user gets visible acknowledgement.
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      <Confetti />

      <div className="max-w-xl w-full">
        {/* Mail-sent confirmation */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 shadow-soft p-7 md:p-9 text-center">
          <div className="inline-flex w-16 h-16 rounded-full bg-brand-success items-center justify-center shadow-elevated mb-4">
            <CheckCircle2 className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-charcoal mb-2">
            Your report is on its way!
          </h1>
          <p className="text-sm md:text-base text-brand-slate leading-relaxed">
            We&apos;ve emailed your full RightOffer policy review to
          </p>
          <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-brand-light-gray font-mono text-sm font-semibold text-brand-charcoal break-all">
            <Mail className="w-4 h-4 text-brand-deepblue shrink-0" />
            <span>{email || "your inbox"}</span>
          </div>
          <p className="text-xs text-brand-slate mt-4">
            Check your inbox in the next minute. If you don&apos;t see it, peek
            in promotions / spam.
          </p>
        </div>

        {/* Thank you note */}
        <div className="mt-6 rounded-3xl bg-white border border-brand-light-gray shadow-soft p-6 md:p-7 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-orange bg-orange-50 rounded-full mb-3">
            <Heart className="w-3 h-3" />
            Thank you
          </div>
          <h2 className="text-lg md:text-xl font-bold text-brand-charcoal mb-1.5">
            Thanks for trusting RightOffer
          </h2>
          <p className="text-sm text-brand-slate leading-relaxed">
            We built this so car owners never have to discover a coverage gap at
            claim time. Glad to have helped today.
          </p>
        </div>

        {/* Feedback widget */}
        <div className="mt-6 rounded-3xl bg-white border border-brand-light-gray shadow-soft p-6 md:p-7">
          {!submitted ? (
            <>
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-deepblue mb-2">
                Quick feedback
              </div>
              <h3 className="text-base md:text-lg font-bold text-brand-charcoal mb-1">
                How was your experience?
              </h3>
              <p className="text-xs text-brand-slate mb-5">
                Takes 5 seconds. Helps us make the next person&apos;s review
                even better.
              </p>

              {/* Star rating */}
              <div className="flex items-center justify-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((n) => {
                  const active = rating !== null && rating >= n;
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-label={`Rate ${n} out of 5`}
                      onClick={() => setRating(n)}
                      className="p-1 transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={clsx(
                          "w-9 h-9 md:w-10 md:h-10 transition-colors",
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
              <div className="text-center text-sm font-semibold text-brand-charcoal min-h-[20px] mb-4">
                {rating !== null ? RATING_LABEL[rating] : "Tap a star"}
              </div>

              {/* Optional comment when rating <= 3 */}
              {rating !== null && rating <= 3 && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-brand-slate mb-1.5">
                    What could have been better? (optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="Tell us anything — we read every message."
                    className="w-full px-3 py-2.5 border-2 border-brand-light-gray rounded-xl text-sm text-brand-charcoal placeholder:text-brand-slate/50 focus:outline-none focus:border-brand-deepblue transition-colors resize-none"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={rating === null}
                className={clsx(
                  "w-full py-3 rounded-2xl font-bold text-sm transition-all",
                  rating !== null
                    ? "bg-brand-deepblue hover:brightness-110 text-white shadow-soft"
                    : "bg-brand-light-gray text-brand-slate cursor-not-allowed"
                )}
              >
                Submit feedback
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex w-12 h-12 rounded-full bg-brand-success items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="font-bold text-brand-charcoal mb-1">
                Got it — thank you!
              </div>
              <p className="text-xs text-brand-slate">
                Your feedback helps us improve every review.
              </p>
            </div>
          )}
        </div>

        {/* Footer links */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-brand-deepblue font-semibold hover:underline"
          >
            <Home className="w-4 h-4" />
            Back to RightOffer home
          </Link>
        </div>
      </div>
    </main>
  );
}
