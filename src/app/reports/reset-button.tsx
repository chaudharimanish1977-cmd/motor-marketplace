"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Loader2 } from "lucide-react";

/**
 * "Start a new comparison" — clears the anonymous + upload session
 * cookies and redirects to /upload for a fresh stack. Useful when a
 * customer has been testing and wants to wipe accumulated docs.
 */
export function ResetButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onReset() {
    if (pending) return;
    if (
      !window.confirm(
        "Clear your current comparison and start a fresh upload? Your previous reports remain accessible from your portal if you've verified your email."
      )
    ) {
      return;
    }
    startTransition(async () => {
      await fetch("/api/upload-session/reset", { method: "POST" });
      router.push("/upload");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onReset}
      disabled={pending}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-slate hover:text-brand-charcoal px-3 py-1.5 rounded-xl border border-brand-light-gray hover:bg-white transition-colors disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <RotateCcw className="w-3.5 h-3.5" />
      )}
      Start a new comparison
    </button>
  );
}
