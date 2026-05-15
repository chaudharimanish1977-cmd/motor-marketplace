"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Loader2 } from "lucide-react";

/**
 * Per-subscription pause / resume button. Optimistically flips the
 * pill on click; on failure we revert and surface a quiet error. The
 * server is the source of truth — after the fetch settles we call
 * router.refresh() so the rest of the card stays consistent.
 */
export function ReminderToggle({
  subscriptionId,
  initialStatus,
}: {
  subscriptionId: string;
  initialStatus: "active" | "unsubscribed";
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onToggle() {
    if (pending) return;
    const next = status === "active" ? "unsubscribed" : "active";
    const previous = status;
    setStatus(next);
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/me/reminders/${subscriptionId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        if (!res.ok) {
          setStatus(previous);
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(data.error ?? "Couldn't update — try again.");
          return;
        }
        router.refresh();
      } catch {
        setStatus(previous);
        setError("Network error.");
      }
    });
  }

  const label =
    status === "active" ? "Pause reminders" : "Resume reminders";
  const Icon = status === "active" ? BellOff : Bell;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-charcoal px-3 py-1.5 rounded-xl border border-brand-light-gray hover:bg-brand-offwhite disabled:opacity-60 transition-colors"
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Icon className="w-3.5 h-3.5" />
        )}
        {label}
      </button>
      {error && <span className="text-[10px] text-red-600">{error}</span>}
    </div>
  );
}
