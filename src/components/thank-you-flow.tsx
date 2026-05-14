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
  BellOff,
  Loader2,
} from "lucide-react";
import { Confetti } from "@/components/confetti";

// GenZ / Zomato-leaning rating copy. Index 0 = no rating yet.
const RATING_COPY: Record<number, string> = {
  0: "Tap a star, bestie ⭐",
  1: "Bruh. We dropped the ball 😬",
  2: "Mid. Roast us — what flopped?",
  3: "Solid C+ vibes — we'll level up 📈",
  4: "Lowkey love this 💛 thanks fr",
  5: "POV: you just made our entire week 💅",
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
                    How was the vibe?
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
                        className="p-0.5 transition-transform hover:scale-125 hover:-rotate-6 active:scale-90"
                      >
                        {/* Key trick: re-mount on rating change so the
                            star-pop entrance animation re-fires every tap.
                            Idle wiggle plays only on the first star pre-tap
                            to nudge the user toward interacting. */}
                        <Star
                          key={`s-${n}-${rating ?? "idle"}`}
                          className={clsx(
                            "w-9 h-9 transition-colors",
                            active
                              ? "fill-brand-orange text-brand-orange animate-star-pop"
                              : "text-brand-light-gray",
                            rating === null && n === 1 && "animate-star-idle"
                          )}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="text-center text-xs font-semibold text-brand-charcoal min-h-[20px] mb-3">
                  {RATING_COPY[rating ?? 0]}
                </div>

                {rating !== null && rating <= 3 && (
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder="Spill the tea — what flopped? (optional)"
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
// "Zero calls" badge — quirky inline animated phone with a pulsing X overlay.
// Phone is brand deep-blue (the thing being negated); X + label are orange.
// ============================================================================

function NoCallBadge() {
  return (
    <span className="inline-flex items-center gap-1 align-middle whitespace-nowrap">
      <span className="relative inline-block w-4 h-4">
        {/* Phone outline — wiggles like it's vibrating */}
        <span className="absolute inset-0 animate-phone-jiggle">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full text-brand-deepblue"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </span>
        {/* Big X overlay — pulses on top, brand orange */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          className="absolute inset-0 w-full h-full text-brand-orange animate-x-pulse"
        >
          <path d="M4 4 L20 20 M20 4 L4 20" />
        </svg>
      </span>
      <span className="font-bold text-brand-orange">Zero calls.</span>
    </span>
  );
}

// ============================================================================
// Renewal opt-in — captures both email + WhatsApp in one tap.
// Flow: I'm in / I'm out → if I'm in, show time-of-day picker pre-populated
// with RightOffer's default plan, then Lock in my plan.
// ============================================================================

// RightOffer's reminder plan: nudge at 90d, 30d, 7d, 1d before renewal.
// Checkpoints are now fixed; only the time-of-day is user-configurable.
const DEFAULT_DAYS_BEFORE = [90, 30, 7, 1];
const DEFAULT_HOUR = 9;

type TimeMode = "pre-office" | "lunch" | "post-office" | "custom";

const TIME_BUCKETS: {
  id: Exclude<TimeMode, "custom">;
  label: string;
  range: string;
  hour: number;
}[] = [
  { id: "pre-office", label: "Pre-office hours", range: "8 AM – 10 AM", hour: 9 },
  { id: "lunch", label: "Lunch hours", range: "1 PM – 3 PM", hour: 14 },
  { id: "post-office", label: "Post-office hours", range: "6 PM – 8 PM", hour: 19 },
];

// One-hour slots, 8 AM through 7 PM IST.
const CUSTOM_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

const formatHour = (h: number) => {
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
};

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
  // "asking"     → showing I'm in / I'm out
  // "scheduling" → user picked I'm in, customising checkpoints + time
  // "declined"   → user picked I'm out
  const [flow, setFlow] = useState<"asking" | "scheduling" | "declined">(
    "asking"
  );
  const daysBefore = DEFAULT_DAYS_BEFORE;
  const [timeMode, setTimeMode] = useState<TimeMode>("pre-office");
  const [customHour, setCustomHour] = useState<number>(DEFAULT_HOUR);

  const niceDate = policyExpiryDate
    ? new Date(policyExpiryDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const effectiveHour =
    timeMode === "custom"
      ? customHour
      : TIME_BUCKETS.find((b) => b.id === timeMode)!.hour;

  const sortedDaysAsc = [...daysBefore].sort((a, b) => b - a);
  const daysSummary = sortedDaysAsc.map((d) => `${d}d`).join(" · ");
  const timeSummary =
    timeMode === "custom"
      ? `${formatHour(customHour)} IST`
      : (() => {
          const b = TIME_BUCKETS.find((x) => x.id === timeMode)!;
          return `${b.label} (${b.range})`;
        })();

  const subscribe = async () => {
    if (daysBefore.length === 0) {
      setErrorMsg("Pick at least one reminder checkpoint.");
      return;
    }
    setErrorMsg(null);
    setState("saving");
    try {
      const res = await fetch("/api/reminders/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parsedPolicyId,
          email,
          mobile,
          daysBefore,
          reminderHourIst: effectiveHour,
        }),
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
              We&apos;ll nudge you at{" "}
              <span className="font-semibold text-brand-charcoal">
                {daysSummary}
              </span>{" "}
              before{" "}
              <span className="font-semibold text-brand-charcoal">
                {niceDate ?? "your renewal"}
              </span>
              , around{" "}
              <span className="font-semibold text-brand-charcoal">
                {timeSummary}
              </span>{" "}
              — by email and WhatsApp.{" "}
              <NoCallBadge />
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (flow === "declined") {
    return (
      <div className="rounded-3xl bg-white border border-brand-light-gray shadow-soft overflow-hidden">
        <div className="px-6 py-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-light-gray flex items-center justify-center shrink-0">
            <BellOff className="w-5 h-5 text-brand-slate" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-brand-charcoal text-sm md:text-base">
              No worries — we won&apos;t bug you
            </div>
            <p className="text-xs md:text-sm text-brand-slate mt-1 leading-relaxed">
              We won&apos;t send you any renewal nudges.{" "}
              <button
                type="button"
                onClick={() => setFlow("asking")}
                className="font-semibold text-brand-deepblue hover:underline"
              >
                Changed your mind?
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const saving = state === "saving";

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
              Don&apos;t worry about missing your renewal.
            </h3>
            <p className="text-xs md:text-sm text-brand-slate mt-1.5 leading-relaxed">
              We&apos;ll send nudges{" "}
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
              — by email and WhatsApp.{" "}
              <NoCallBadge />
            </p>
          </div>
        </div>

        {/* Schedule picker — only revealed once user opts in */}
        {flow === "scheduling" && (
          <div className="border border-brand-light-gray rounded-2xl p-4 mb-3 space-y-3 bg-brand-offwhite/40">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-deepblue">
              Customize reminder schedule
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-slate mb-2">
                What time of day?
              </div>
              <div className="space-y-1.5">
                {TIME_BUCKETS.map((b) => {
                  const active = timeMode === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setTimeMode(b.id)}
                      className={clsx(
                        "w-full text-left px-3 py-2 rounded-lg border text-xs font-semibold transition-all flex items-center justify-between gap-3",
                        active
                          ? "bg-brand-deepblue text-white border-brand-deepblue"
                          : "bg-white text-brand-charcoal border-brand-light-gray hover:border-brand-electricblue"
                      )}
                    >
                      <span>{b.label}</span>
                      <span
                        className={clsx(
                          "text-[11px] font-medium tabular-nums",
                          active ? "text-white/80" : "text-brand-slate"
                        )}
                      >
                        {b.range}
                      </span>
                    </button>
                  );
                })}

                <div
                  className={clsx(
                    "w-full px-3 py-2 rounded-lg border text-xs font-semibold transition-all flex items-center justify-between gap-3",
                    timeMode === "custom"
                      ? "bg-brand-deepblue text-white border-brand-deepblue"
                      : "bg-white text-brand-charcoal border-brand-light-gray hover:border-brand-electricblue"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setTimeMode("custom")}
                    className="text-left flex-1 cursor-pointer"
                  >
                    Choose your time slot
                  </button>
                  {timeMode === "custom" && (
                    <select
                      value={customHour}
                      onChange={(e) => setCustomHour(Number(e.target.value))}
                      className="text-[11px] font-semibold tabular-nums bg-white text-brand-charcoal rounded-md px-2 py-0.5 border border-white/30 focus:outline-none"
                    >
                      {CUSTOM_HOURS.map((h) => (
                        <option key={h} value={h}>
                          {formatHour(h)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-3">
            {errorMsg}
          </div>
        )}

        {/* Buttons — flow-dependent */}
        {flow === "asking" ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFlow("scheduling")}
              className="py-2.5 rounded-xl font-bold text-sm bg-brand-orange hover:brightness-110 text-white shadow-soft transition-all"
            >
              I&apos;m in
            </button>
            <button
              type="button"
              onClick={() => setFlow("declined")}
              className="py-2.5 rounded-xl font-bold text-sm bg-brand-light-gray text-brand-slate hover:bg-brand-light-gray/70 transition-all"
            >
              I&apos;m out
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => subscribe()}
              disabled={saving}
              className={clsx(
                "w-full py-2.5 rounded-xl font-bold text-sm transition-all inline-flex items-center justify-center gap-2",
                saving
                  ? "bg-brand-light-gray text-brand-slate cursor-not-allowed"
                  : "bg-brand-orange hover:brightness-110 text-white shadow-soft"
              )}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Lock in my plan"
              )}
            </button>

            <button
              type="button"
              onClick={() => setFlow("declined")}
              disabled={saving}
              className="w-full py-1.5 text-xs font-semibold text-brand-slate hover:text-brand-charcoal transition-colors"
            >
              Actually, I&apos;m out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
