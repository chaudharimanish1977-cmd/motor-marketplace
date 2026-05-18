"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Loader2 } from "lucide-react";

/**
 * Per-subscription pause / resume toggle. Editorial outlined-plum pill,
 * same shape as the View report + Delete sibling buttons inside the
 * policy card action row. Optimistic flip on click; on failure we
 * revert and surface a quiet inline error.
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
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-brand-charcoal/25 hover:border-brand-plum hover:text-brand-plum text-brand-charcoal font-serif italic font-medium text-[13px] md:text-[14px] min-h-[36px] transition-colors disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Icon className="w-3.5 h-3.5" />
        )}
        {label}
      </button>
      {error && (
        <span className="font-serif italic text-[11px] text-brand-alert">
          {error}
        </span>
      )}
    </div>
  );
}
