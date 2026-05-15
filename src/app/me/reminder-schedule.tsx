"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  Edit3,
  Loader2,
  X,
} from "lucide-react";
import clsx from "clsx";

/**
 * Per-subscription reminder schedule. Two modes:
 *
 *   - Summary (default): one-line list of upcoming fire dates with a
 *     small ✓ on checkpoints that already fired. "Edit" toggles into
 *     editor mode.
 *
 *   - Editor: a row of checkbox-buttons for [60, 45, 30, 15, 7, 3, 1]
 *     days before expiry, each showing its computed fire date. Save
 *     posts the new array to the cascading PATCH route; cancel
 *     restores the original picks. Save is disabled until the user
 *     ticks at least one checkpoint.
 *
 * The component is dumb about the rest of the subscription — it just
 * needs the policy expiry date, the current schedule, and the list of
 * already-fired checkpoints. The PATCH endpoint handles cascading
 * across all sibling subs in the same policy group.
 */

// Picks we offer in the editor. Anchored on common renewal milestones
// (2-month / 1-month / 1-week / final-week). Editing happens via
// presets — power users wanting [42, 14] aren't the V1 audience.
const CHECKPOINT_OPTIONS = [60, 45, 30, 15, 7, 3, 1] as const;

interface Props {
  subscriptionId: string;
  policyExpiryDate: string;
  daysBefore: number[];
  nudgesFired: number[];
  paused: boolean;
}

export function ReminderSchedule({
  subscriptionId,
  policyExpiryDate,
  daysBefore,
  nudgesFired,
  paused,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [picked, setPicked] = useState<Set<number>>(
    () => new Set(daysBefore)
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const expiryMs = useMemo(
    () => new Date(policyExpiryDate).getTime(),
    [policyExpiryDate]
  );

  // ---------- Summary mode ----------
  if (!editing) {
    const visiblePicks = [...daysBefore].sort((a, b) => b - a);
    return (
      <div className={clsx("space-y-1.5", paused && "opacity-60")}>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-slate">
          <Calendar className="w-3 h-3" />
          Schedule
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-brand-deepblue hover:underline"
          >
            <Edit3 className="w-3 h-3" />
            Edit
          </button>
        </div>
        <ul className="text-[11px] text-brand-charcoal/90 space-y-0.5">
          {visiblePicks.map((d) => {
            const dateLabel = formatFireDate(expiryMs, d);
            const fired = nudgesFired.includes(d);
            return (
              <li
                key={d}
                className="flex items-center gap-1.5 leading-snug"
              >
                <span className="tabular-nums w-[5.5rem] shrink-0">
                  {dateLabel}
                </span>
                <span className="text-brand-slate/80">
                  · {d}d before
                </span>
                {fired && (
                  <span className="ml-1 inline-flex items-center gap-0.5 text-emerald-700 text-[10px] font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    Sent
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  // ---------- Editor mode ----------
  function toggle(d: number) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  function onSave() {
    if (pending || picked.size === 0) return;
    setError(null);
    const daysBeforeArr = Array.from(picked).sort((a, b) => b - a);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/me/reminders/${subscriptionId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ daysBefore: daysBeforeArr }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(data.error ?? "Couldn't save — try again.");
          return;
        }
        setEditing(false);
        router.refresh();
      } catch {
        setError("Network error.");
      }
    });
  }

  function onCancel() {
    setPicked(new Set(daysBefore));
    setEditing(false);
    setError(null);
  }

  return (
    <div className="rounded-xl border border-brand-light-gray bg-brand-offwhite/40 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-slate">
          Reminder schedule
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="text-brand-slate hover:text-brand-charcoal transition-colors disabled:opacity-60"
          aria-label="Close editor"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="text-[11px] text-brand-slate leading-relaxed">
        Tick the days before expiry on which we should email you. You
        can change this any time.
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {CHECKPOINT_OPTIONS.map((d) => {
          const checked = picked.has(d);
          const fired = nudgesFired.includes(d);
          return (
            <label
              key={d}
              className={clsx(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[12px] cursor-pointer transition-colors",
                checked
                  ? "bg-blue-50 border-brand-deepblue/30 text-brand-charcoal"
                  : "bg-white border-brand-light-gray text-brand-slate hover:bg-brand-offwhite"
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(d)}
                className="w-3.5 h-3.5 accent-brand-deepblue"
              />
              <span className="font-semibold tabular-nums w-12 shrink-0">
                {d}d
              </span>
              <span className="text-brand-slate/80 tabular-nums">
                {formatFireDate(expiryMs, d)}
              </span>
              {fired && (
                <span className="ml-auto inline-flex items-center gap-0.5 text-emerald-700 text-[10px] font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  Already sent
                </span>
              )}
            </label>
          );
        })}
      </div>

      {error && <p className="text-[11px] text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="text-[11px] font-semibold text-brand-slate hover:text-brand-charcoal px-3 py-1.5 rounded-lg border border-brand-light-gray hover:bg-white transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={pending || picked.size === 0}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-brand-deepblue hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-1.5 rounded-lg transition-colors"
        >
          {pending ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </>
          ) : (
            "Save schedule"
          )}
        </button>
      </div>
    </div>
  );
}

function formatFireDate(expiryMs: number, daysBefore: number): string {
  const fireMs = expiryMs - daysBefore * 24 * 60 * 60 * 1000;
  const d = new Date(fireMs);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
