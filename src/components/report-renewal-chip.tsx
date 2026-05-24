"use client";

/**
 * ReportRenewalChip — inline renewal-reminder ask, sits in the report
 * itself right under the bottom-line verdict.
 *
 * Why here: the emotional peak of the audit is the verdict — "your
 * policy expires in N days and you have X gaps." That's the moment
 * the customer most wants a heads-up before the renewal cliff.
 * Today's /thank-you ask fires only on the OTP-gated path (~50% of
 * verified users) and never on the Google OAuth path or the email-
 * forward magic-link path. This chip catches everyone who reaches
 * the report.
 *
 * States:
 *   - hidden          → policy isn't a "policy" (e.g. a quote), or
 *                       expiry is in the past, or printMode. Don't
 *                       crowd the page when the ask doesn't apply.
 *   - unverified      → soft teaser pointing to the gate below
 *                       ("Verify your email to opt in"). No button —
 *                       the OTP gate elsewhere handles the actual
 *                       capture, and /thank-you carries the full ask.
 *   - subscribed      → confirmation pill ("✓ Reminder on for [date]").
 *                       Manage link to /me.
 *   - paused          → "Resume reminder" button (subscription exists
 *                       but customer earlier paused it).
 *   - ready (default) → one-tap "Yes, remind me" button. POSTs to
 *                       /api/reminders/subscribe with email-only
 *                       channels when mobile isn't in the session.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, BellRing, Loader2 } from "lucide-react";

interface Props {
  parsedPolicyId: string;
  /** ISO date — the policy's odPeriodEnd. */
  policyExpiryDate: string;
  /** True iff document is a policy (not a quote). Quotes don't have
   *  renewals to remind about. */
  isPolicy: boolean;
  /** True iff visitor has a verified session (OTP-upload or magic-link). */
  isVerified: boolean;
  /** Customer's verified email (from session). Required to subscribe. */
  customerEmail: string | null;
  /** Customer's mobile if captured (OTP-flow upload sessions carry it).
   *  Absent → subscription will be email-only. */
  customerMobile?: string;
  /** Existing subscription state for this policy, if any. */
  existingSubscription: {
    id: string;
    status: "active" | "unsubscribed";
    daysBefore: number[];
  } | null;
  /** Skip rendering in PDF/print mode — chip is interactive only. */
  printMode?: boolean;
}

// Default reminder schedule. Matches /api/reminders/subscribe defaults
// so a one-tap subscribe carries the same checkpoints as the editorial
// /thank-you flow.
const DEFAULT_DAYS_BEFORE = [60, 30, 7];

export function ReportRenewalChip({
  parsedPolicyId,
  policyExpiryDate,
  isPolicy,
  isVerified,
  customerEmail,
  customerMobile,
  existingSubscription,
  printMode,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<
    "idle" | "saving" | "done" | "error"
  >(() =>
    existingSubscription?.status === "active" ? "done" : "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // ── Gate: when to render ─────────────────────────────────────────
  if (printMode) return null;
  if (!isPolicy) return null;
  const expiryMs = Date.parse(policyExpiryDate);
  if (!Number.isFinite(expiryMs)) return null;
  if (expiryMs < Date.now()) return null;

  const niceDate = new Date(policyExpiryDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // ── Unverified state ────────────────────────────────────────────
  // Soft teaser only. The gate elsewhere on the report (and
  // /thank-you after verify) handles the actual subscribe.
  if (!isVerified) {
    return (
      <div className="my-6 pl-5 border-l-2 border-brand-plum/40">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-plum font-bold mb-1.5">
          · Renewal cliff ·
        </div>
        <p className="font-serif text-[15px] md:text-[15.5px] text-brand-charcoal leading-[1.5] m-0">
          This policy expires{" "}
          <span className="italic text-brand-plum">{niceDate}</span>. Verify
          your email below to get a heads-up{" "}
          <span className="whitespace-nowrap">60, 30 and 7 days</span> before.
        </p>
      </div>
    );
  }

  // ── Verified: subscribed / paused / ready ─────────────────────
  const isSubscribed =
    status === "done" || existingSubscription?.status === "active";
  const isPaused =
    existingSubscription !== null &&
    existingSubscription.status === "unsubscribed";

  async function subscribe() {
    if (!customerEmail) {
      setErrorMsg("Couldn't read your email from this session.");
      setStatus("error");
      return;
    }
    setStatus("saving");
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/reminders/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parsedPolicyId,
            email: customerEmail,
            mobile: customerMobile || undefined,
            daysBefore: DEFAULT_DAYS_BEFORE,
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setErrorMsg(data.error ?? "Couldn't subscribe — try again.");
          setStatus("error");
          return;
        }
        setStatus("done");
        // Refresh the route so /me-derived state (renewal status line)
        // reflects the new sub on next nav.
        router.refresh();
      } catch {
        setErrorMsg("Network error.");
        setStatus("error");
      }
    });
  }

  // Subscribed state — confirmation pill
  if (isSubscribed) {
    const days =
      existingSubscription?.daysBefore?.length
        ? existingSubscription.daysBefore
            .slice()
            .sort((a, b) => b - a)
            .map((d) => `${d}d`)
            .join(" · ")
        : "60d · 30d · 7d";
    return (
      <div className="my-6 pl-5 border-l-2 border-brand-sage/60">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-1.5">
          · Reminder on ·
        </div>
        <p className="font-serif text-[14.5px] md:text-[15px] text-brand-charcoal leading-[1.5] m-0">
          We&rsquo;ll write to you{" "}
          <span className="italic text-brand-plum">{days}</span> before{" "}
          <span className="whitespace-nowrap">{niceDate}</span>.{" "}
          <Link
            href="/me"
            className="underline decoration-brand-plum/40 underline-offset-2 hover:decoration-brand-plum hover:text-brand-plum"
          >
            Manage in /me ↗
          </Link>
        </p>
      </div>
    );
  }

  // Paused or fresh-ready — primary CTA
  const buttonLabel = isPaused ? "Resume reminder" : "Yes, remind me";

  return (
    <div className="my-6 pl-5 border-l-2 border-brand-plum/40">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-plum font-bold mb-1.5">
        · Renewal cliff ·
      </div>
      <p className="font-serif text-[15px] md:text-[15.5px] text-brand-charcoal leading-[1.5] mb-3">
        Want a heads-up before this expires? We&rsquo;ll email you{" "}
        <span className="italic text-brand-plum">60, 30 and 7 days</span>{" "}
        before{" "}
        <span className="whitespace-nowrap">{niceDate}</span>.
        {customerMobile
          ? " WhatsApp too, when that lands."
          : ""}
      </p>
      <button
        type="button"
        onClick={subscribe}
        disabled={pending || status === "saving"}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-brand-plum bg-brand-plum text-white hover:bg-white hover:text-brand-plum font-serif italic font-medium text-[14px] min-h-[40px] transition-colors disabled:opacity-60"
      >
        {status === "saving" || pending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <BellRing className="w-3.5 h-3.5" />
            {buttonLabel}
          </>
        )}
      </button>
      {errorMsg && (
        <p className="mt-2 font-serif italic text-[12px] text-brand-alert">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
