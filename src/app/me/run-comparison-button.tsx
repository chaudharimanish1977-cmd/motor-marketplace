"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";

/**
 * Triggers a Right Offer comparison run from the /me portal. Primary
 * CTA inside the editorial Comparison Launcher section — filled plum,
 * serif italic, same gravity as the renewal CTA in the report's
 * Bottom Line.
 */
export function RunComparisonButton({
  quoteIds,
  policyId,
}: {
  quoteIds: string[];
  policyId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onRun() {
    if (pending) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/comparisons/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ quoteIds, policyId }),
        });
        if (!res.ok) {
          console.error("[run-comparison] failed:", await res.text());
          return;
        }
        const data = (await res.json()) as { id: string };
        router.push(`/comparison/${data.id}`);
      } catch (err) {
        console.error("[run-comparison] error:", err);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onRun}
      disabled={pending || quoteIds.length === 0}
      className="inline-flex items-center justify-center gap-1.5 bg-brand-plum text-brand-offwhite px-7 py-3.5 rounded-full font-serif italic font-medium text-[15px] md:text-[16px] min-h-[48px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Running comparison…
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          Run Right Offer comparison{" "}
          <span aria-hidden>→</span>
        </>
      )}
    </button>
  );
}
