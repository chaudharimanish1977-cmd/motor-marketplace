/**
 * QuoteStack — the running "you've dropped N quotes" tally inside
 * ShellQuotesOpen.
 *
 * Phase 3 ships:
 *   - Empty state: encourage drop ("Have quotes you've collected? Drop them.")
 *   - 1..3 dropped: itemised list + "Drop another" + "Run the review" CTAs
 *   - Cap is 3 quotes per the V1 lock (1 policy + 3 customer quotes).
 *
 * "Run the review" POSTs to /api/comparisons/create and routes to the
 * created comparison report. This mirrors RunComparisonButton on /me
 * but in our editorial-pill style.
 */
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ParsedPolicy } from "@/lib/types";

interface QuoteStackProps {
  /** Customer-uploaded quotes (ParsedPolicy rows with documentType="quote"). */
  quotes: ParsedPolicy[];
  /** Parent policy ID — passed through to the drop URL so the quote is
   *  attached to the renewal context after upload, and POSTed to the
   *  comparator so the verdict can anchor on it. */
  anchorPolicyId: string;
  /** Max quotes — V1 caps at 3. */
  maxQuotes?: number;
}

export function QuoteStack({
  quotes,
  anchorPolicyId,
  maxQuotes = 3,
}: QuoteStackProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const count = quotes.length;
  const remaining = Math.max(0, maxQuotes - count);
  const atCap = remaining === 0;

  // Drop CTA — quotes pass through the upload flow tagged with the
  // anchor policy so the comparator can stitch them together later.
  const dropHref = `/upload?fresh=1&renewal=${anchorPolicyId}&quote=1`;

  const runReview = () => {
    if (pending || count === 0) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/comparisons/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            policyId: anchorPolicyId,
            quoteIds: quotes.map((q) => q.id),
          }),
        });
        if (!res.ok) {
          console.error("[quote-stack] review failed:", await res.text());
          return;
        }
        const data = (await res.json()) as { id: string };
        router.push(`/comparison/${data.id}`);
      } catch (err) {
        console.error("[quote-stack] error:", err);
      }
    });
  };

  return (
    <section className="mt-9 rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-5 md:px-7 py-6">
      {/* Kicker + count */}
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-plum font-bold">
          · Your quote stack ·
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
          {count}/{maxQuotes}
        </div>
      </div>

      {count === 0 ? (
        <>
          <h3 className="mt-2 font-serif font-medium text-xl tracking-[-0.015em] text-brand-charcoal">
            Already collected{" "}
            <span className="italic text-brand-plum">quotes elsewhere?</span>
          </h3>
          <p className="mt-2 font-serif italic text-sm text-brand-slate max-w-md">
            Drop up to {maxQuotes} renewal quotes — we&apos;ll stack them
            against ours and tell you which one&apos;s actually the right
            offer.
          </p>
          <div className="mt-4">
            <Link
              href={dropHref}
              className="inline-flex items-center gap-1 border border-brand-plum/40 text-brand-plum px-5 py-2.5 rounded-full font-serif italic font-medium text-[14px] hover:bg-brand-plum/5 transition-colors"
            >
              Drop a quote <span aria-hidden>→</span>
            </Link>
          </div>
        </>
      ) : (
        <>
          <h3 className="mt-2 font-serif font-medium text-xl tracking-[-0.015em] text-brand-charcoal">
            {count === 1
              ? "One quote in the stack."
              : `${count} quotes in the stack.`}
          </h3>

          {/* Stacked quote rows */}
          <ul className="mt-3 space-y-1.5">
            {quotes.map((q) => (
              <li
                key={q.id}
                className="flex items-baseline justify-between gap-3 rounded-xl bg-brand-offwhite border border-brand-charcoal/10 px-3.5 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-serif font-semibold text-[15px] text-brand-charcoal truncate">
                    {q.insurerName || "Unknown insurer"}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-brand-slate">
                    IDV ₹
                    {new Intl.NumberFormat("en-IN").format(q.idv ?? 0)}
                    {q.premium?.grandTotal
                      ? ` · ₹${new Intl.NumberFormat("en-IN").format(
                          q.premium.grandTotal
                        )} total`
                      : ""}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={runReview}
              disabled={pending}
              className="flex-1 inline-flex items-center justify-center gap-1 bg-brand-plum text-brand-offwhite px-5 py-2.5 rounded-full font-serif italic font-medium text-[14px] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
            >
              {pending ? "Stitching the review…" : "Run the review"}{" "}
              {!pending && <span aria-hidden>→</span>}
            </button>
            {!atCap && (
              <Link
                href={dropHref}
                className="flex-1 inline-flex items-center justify-center gap-1 border border-brand-plum/40 text-brand-plum px-5 py-2.5 rounded-full font-serif italic font-medium text-[14px] hover:bg-brand-plum/5 transition-colors"
              >
                Drop another quote
              </Link>
            )}
          </div>

          {atCap && (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-slate">
              · Stack full · three is enough for a clean comparison ·
            </p>
          )}
        </>
      )}
    </section>
  );
}
