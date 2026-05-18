"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * MeOnboardingPanel — first-visit editorial welcome on /me.
 *
 * Renders ONLY when the customer's User row has no `meOnboardedAt`
 * timestamp. On dismiss, fires POST /api/me/onboarding/done which
 * sets the timestamp; the panel never shows again for that user
 * across any device.
 *
 * Editorial design: plum left-rule, mono kicker, serif body, three
 * expectation bullets (renewal reminders, insights, default quiet),
 * a "send test reminder" affordance when the customer has at least
 * one active subscription, plus a primary "Got it" dismiss button.
 *
 * No modal, no card frame — fits the rest of the editorial /me
 * vocabulary (sage left-rule for fleet summary, plum left-rule for
 * primary nudges).
 */

interface Props {
  /** Customer's preferred first name from the User row, if known.
   *  Falls back to "there" if missing. */
  firstName?: string;
  /** Number of distinct vehicles the customer has uploaded so far.
   *  Drives the "we've saved N policies for you" line. */
  vehicleCount: number;
  /** ID of an active reminder subscription, used to wire the "Preview
   *  what the reminder looks like" affordance. When undefined, the
   *  preview link is hidden (customer doesn't have a subscription
   *  yet — maybe a fresh OAuth signin before any upload). */
  testSubscriptionId?: string;
}

export function MeOnboardingPanel({
  firstName,
  vehicleCount,
  testSubscriptionId,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [previewStatus, setPreviewStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const greeting = firstName?.trim() || "there";
  const policiesPhrase =
    vehicleCount === 0
      ? "Once you upload a policy"
      : vehicleCount === 1
        ? "We've saved 1 review for you"
        : `We've saved ${vehicleCount} reviews for you`;

  function onDismiss() {
    if (pending) return;
    setDismissed(true);
    startTransition(async () => {
      try {
        await fetch("/api/me/onboarding/done", { method: "POST" });
      } catch (err) {
        console.error("[onboarding] dismiss failed", err);
      } finally {
        router.refresh();
      }
    });
  }

  async function onPreview() {
    if (!testSubscriptionId || previewStatus === "sending") return;
    setPreviewStatus("sending");
    setPreviewError(null);
    try {
      const res = await fetch(
        `/api/me/reminders/${testSubscriptionId}/test`,
        { method: "POST" }
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setPreviewError(data.error ?? "Couldn't send the preview.");
        setPreviewStatus("error");
        return;
      }
      setPreviewStatus("sent");
    } catch {
      setPreviewError("Network error.");
      setPreviewStatus("error");
    }
  }

  // After dismiss → fade the panel; router.refresh will then re-render
  // the server component without this panel.
  if (dismissed) return null;

  return (
    <section className="mb-8 pl-5 border-l-2 border-brand-plum">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-plum font-bold">
        · Welcome ·
      </div>
      <h2 className="mt-2 font-serif font-medium text-[26px] md:text-[32px] leading-[1.1] tracking-[-0.015em] text-brand-charcoal m-0">
        Hi {greeting} — this is{" "}
        <span className="italic text-brand-plum">your portal.</span>
      </h2>
      <p className="mt-3 font-serif text-[15px] md:text-[16px] leading-[1.6] text-brand-charcoal max-w-xl">
        {policiesPhrase}. Here&rsquo;s what to expect from us going
        forward:
      </p>

      <ul className="mt-5 space-y-3 max-w-xl">
        <li className="flex gap-3">
          <span
            aria-hidden
            className="shrink-0 font-mono text-[10px] font-bold text-brand-plum pt-1.5"
          >
            01
          </span>
          <div>
            <div className="font-serif font-semibold text-[14.5px] md:text-[15px] text-brand-charcoal leading-snug">
              Renewal reminders
            </div>
            <p className="mt-0.5 font-serif italic text-[13.5px] md:text-[14px] text-brand-slate leading-relaxed">
              Email 45 days before each policy expires. We&rsquo;ll
              come knocking with a fresh review when the time
              matters.
              {testSubscriptionId && previewStatus !== "sent" && (
                <>
                  {" "}
                  <button
                    type="button"
                    onClick={onPreview}
                    disabled={previewStatus === "sending"}
                    className="not-italic font-mono text-[10.5px] uppercase tracking-[0.14em] font-bold text-brand-plum hover:underline disabled:opacity-60"
                  >
                    {previewStatus === "sending" ? (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Sending…
                      </span>
                    ) : (
                      "Preview the email →"
                    )}
                  </button>
                </>
              )}
              {previewStatus === "sent" && (
                <span className="not-italic font-mono text-[10.5px] uppercase tracking-[0.14em] font-bold text-brand-success">
                  {" "}
                  · Sent — check your inbox ·
                </span>
              )}
              {previewError && (
                <span className="not-italic font-mono text-[10.5px] uppercase tracking-[0.14em] font-bold text-brand-alert">
                  {" "}
                  · {previewError} ·
                </span>
              )}
            </p>
          </div>
        </li>

        <li className="flex gap-3">
          <span
            aria-hidden
            className="shrink-0 font-mono text-[10px] font-bold text-brand-plum pt-1.5"
          >
            02
          </span>
          <div>
            <div className="font-serif font-semibold text-[14.5px] md:text-[15px] text-brand-charcoal leading-snug">
              Insights for your car
            </div>
            <p className="mt-0.5 font-serif italic text-[13.5px] md:text-[14px] text-brand-slate leading-relaxed">
              Monthly updates when the market or season shifts in
              ways that affect <em>your</em> policy. Not a generic
              newsletter.
            </p>
          </div>
        </li>

        <li className="flex gap-3">
          <span
            aria-hidden
            className="shrink-0 font-mono text-[10px] font-bold text-brand-plum pt-1.5"
          >
            03
          </span>
          <div>
            <div className="font-serif font-semibold text-[14.5px] md:text-[15px] text-brand-charcoal leading-snug">
              Default quiet
            </div>
            <p className="mt-0.5 font-serif italic text-[13.5px] md:text-[14px] text-brand-slate leading-relaxed">
              No sales calls. No marketing. Reply to any email and a
              human at RightOffer writes back.
            </p>
          </div>
        </li>
      </ul>

      <div className="mt-6">
        <button
          type="button"
          onClick={onDismiss}
          disabled={pending}
          className="inline-flex items-center justify-center gap-1.5 bg-brand-plum text-brand-offwhite px-6 py-3 rounded-full font-serif italic font-medium text-[15px] min-h-[44px] hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Got it…
            </>
          ) : (
            <>
              Got it, let me look around <span aria-hidden>→</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
