"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

/**
 * "Refresh now" button on /admin/dashboard. POSTs to /api/admin/dashboard/refresh
 * (founder-gated), then router.refresh()s so the page re-renders with
 * the new snapshot. Shows a spinner while the compute runs (can be
 * 1-3 seconds on a full KV read).
 */
export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/dashboard/refresh", {
          method: "POST",
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
            message?: string;
          };
          setError(data.message ?? data.error ?? "Refresh failed");
          return;
        }
        router.refresh();
      } catch {
        setError("Network error");
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-2 border-brand-plum text-brand-plum hover:bg-brand-plum hover:text-white font-mono text-[11px] font-bold uppercase tracking-[0.1em] disabled:opacity-60 transition-colors"
      >
        {pending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Refreshing
          </>
        ) : (
          <>
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh now
          </>
        )}
      </button>
      {error && (
        <span className="font-mono text-[10.5px] text-brand-alert">
          {error}
        </span>
      )}
    </div>
  );
}
