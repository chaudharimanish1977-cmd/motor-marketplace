"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";

/**
 * Triggers a Right Offer comparison run from the /me portal. The
 * customer hits this when they've collected quotes (and optionally
 * have a current policy uploaded) and want the comparator verdict.
 *
 * Sends the canonical (latest-parse) ID per group so we avoid
 * double-comparing duplicate uploads of the same document.
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
      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-navy hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-soft transition-all"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Running comparison...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          Run Right Offer comparison
        </>
      )}
    </button>
  );
}
