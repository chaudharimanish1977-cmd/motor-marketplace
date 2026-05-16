"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, FileText, X } from "lucide-react";
import clsx from "clsx";

/**
 * Per-card delete control.
 *
 * Single-record group: idle button -> tight inline "Delete this
 * record? [Cancel] [Yes, delete]" cluster. Same blast radius / same
 * UX as the previous version.
 *
 * Multi-record group (the duplicate-parse case): idle button ->
 * expanded selection panel listing every record in the group with
 * a checkbox each. Default selection = ALL records so a customer
 * who just wants "delete this card" still gets one-click behaviour;
 * uncheck specific rows to keep them.
 *
 * Why expose the records at all: until now, "Delete" silently
 * removed every duplicate parse in the group with no UI cue that
 * multiple records were being touched. Customers reasonably asked
 * to see what's there before nuking it.
 */

interface RecordRow {
  id: string;
  uploadedAt: string;
  fileName?: string;
  policyNumber?: string;
  documentType: "policy" | "quote";
}

interface Props {
  vehicleLabel: string;
  records: RecordRow[];
}

export function DeletePolicyButton({ vehicleLabel, records }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(
    () => new Set(records.map((r) => r.id))
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isMulti = records.length > 1;

  const sortedRecords = useMemo(
    () =>
      [...records].sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      ),
    [records]
  );

  function togglePicked(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setPicked(new Set(records.map((r) => r.id)));
  }
  function selectNone() {
    setPicked(new Set());
  }

  function close() {
    setOpen(false);
    setError(null);
    setPicked(new Set(records.map((r) => r.id)));
  }

  function submit() {
    const ids = Array.from(picked);
    if (ids.length === 0 || pending) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/me/policies/delete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(data.error ?? "Couldn't delete — try again.");
          return;
        }
        router.refresh();
      } catch {
        setError("Network error.");
      }
    });
  }

  // ----------------------------------------------------------------
  // Idle button (same look for both single + multi groups)
  // ----------------------------------------------------------------
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${vehicleLabel} record`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-slate hover:text-rose-700 px-3 py-1.5 rounded-xl border border-brand-light-gray hover:border-rose-200 hover:bg-rose-50 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
        {isMulti && (
          <span className="ml-0.5 text-[10px] font-bold tabular-nums text-brand-slate/70">
            ({records.length})
          </span>
        )}
      </button>
    );
  }

  // ----------------------------------------------------------------
  // Single-record group → tight inline confirm
  // ----------------------------------------------------------------
  if (!isMulti) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-2 py-1">
          <span className="text-[11px] font-semibold text-rose-800">
            Delete this record?
          </span>
          <button
            type="button"
            onClick={close}
            disabled={pending}
            className="text-[11px] font-semibold text-brand-slate hover:text-brand-charcoal px-2 py-0.5 rounded-lg hover:bg-white transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 px-2.5 py-1 rounded-lg transition-colors"
          >
            {pending ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Deleting...
              </>
            ) : (
              "Yes, delete"
            )}
          </button>
        </div>
        {error && (
          <span className="text-[10px] text-red-600 leading-relaxed">
            {error}
          </span>
        )}
      </div>
    );
  }

  // ----------------------------------------------------------------
  // Multi-record group → full selection panel
  // ----------------------------------------------------------------
  return (
    <div className="w-full mt-2 rounded-xl border border-rose-200 bg-rose-50/40 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-rose-800">
            Delete records · {vehicleLabel}
          </div>
          <p className="text-[11px] text-brand-slate leading-relaxed mt-0.5">
            {records.length} parses in this group. Pick which to delete —
            all are pre-selected.
          </p>
        </div>
        <button
          type="button"
          onClick={close}
          disabled={pending}
          aria-label="Close"
          className="text-brand-slate hover:text-brand-charcoal transition-colors disabled:opacity-60"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 text-[10px] font-semibold">
        <button
          type="button"
          onClick={selectAll}
          disabled={pending}
          className="text-brand-navy hover:underline disabled:opacity-60"
        >
          Select all
        </button>
        <span className="text-brand-slate/60">·</span>
        <button
          type="button"
          onClick={selectNone}
          disabled={pending}
          className="text-brand-slate hover:text-brand-charcoal disabled:opacity-60"
        >
          Select none
        </button>
      </div>

      <ul className="space-y-1.5 max-h-64 overflow-auto pr-1">
        {sortedRecords.map((r, idx) => {
          const checked = picked.has(r.id);
          return (
            <li key={r.id}>
              <label
                className={clsx(
                  "flex items-start gap-2 px-2.5 py-2 rounded-lg border text-[11px] cursor-pointer transition-colors",
                  checked
                    ? "bg-white border-rose-300"
                    : "bg-white/40 border-brand-light-gray hover:bg-white"
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => togglePicked(r.id)}
                  className="mt-0.5 w-3.5 h-3.5 accent-rose-600"
                  disabled={pending}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-brand-slate/70 shrink-0" />
                    <span className="font-semibold text-brand-charcoal truncate">
                      {r.fileName || "policy.pdf"}
                    </span>
                    {idx === 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Latest
                      </span>
                    )}
                    {r.documentType === "quote" && (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] rounded-full bg-blue-50 text-brand-navy border border-blue-100">
                        Quote
                      </span>
                    )}
                  </div>
                  <div className="text-brand-slate mt-0.5 tabular-nums">
                    Uploaded {formatUploaded(r.uploadedAt)}
                    {r.policyNumber ? ` · ${r.policyNumber}` : ""}
                  </div>
                </div>
              </label>
            </li>
          );
        })}
      </ul>

      {error && (
        <p className="text-[11px] text-red-600 leading-relaxed">{error}</p>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={close}
          disabled={pending}
          className="text-[11px] font-semibold text-brand-slate hover:text-brand-charcoal px-3 py-1.5 rounded-lg border border-brand-light-gray hover:bg-white transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending || picked.size === 0}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-1.5 rounded-lg transition-colors"
        >
          {pending ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Deleting...
            </>
          ) : (
            `Delete ${picked.size} ${picked.size === 1 ? "record" : "records"}`
          )}
        </button>
      </div>
    </div>
  );
}

function formatUploaded(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
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
  const time = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${time}`;
}
