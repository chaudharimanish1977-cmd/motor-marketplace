"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, FileText, X } from "lucide-react";
import clsx from "clsx";

/**
 * Per-card delete control. Editorial vocab — outlined brand-alert
 * (coral) for the destructive intent, hairline rules for the confirm
 * panels, mono kicker + serif body in the multi-record selector.
 *
 * Single-record group → tight inline confirm.
 * Multi-record group → expanded selection panel (default = all rows
 * pre-selected so a customer who just wants "delete this card" still
 * gets one-click behaviour; uncheck specific rows to keep them).
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

  // -------- Idle button (same look for both single + multi groups) --------
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${vehicleLabel} record`}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-brand-charcoal/25 hover:border-brand-alert hover:text-brand-alert text-brand-charcoal font-serif italic font-medium text-[13px] md:text-[14px] min-h-[36px] transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
        {isMulti && (
          <span className="ml-0.5 font-mono text-[11px] tabular-nums text-brand-slate">
            ({records.length})
          </span>
        )}
      </button>
    );
  }

  // -------- Single-record group → tight inline confirm --------
  if (!isMulti) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="inline-flex items-center gap-2 pl-3 pr-1 py-1 border-l-2 border-brand-alert">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] font-bold text-brand-alert">
            · Delete this record? ·
          </span>
          <button
            type="button"
            onClick={close}
            disabled={pending}
            className="font-serif italic text-[12px] text-brand-slate hover:text-brand-charcoal px-2 py-1 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="inline-flex items-center gap-1 font-serif italic font-medium text-[12px] text-brand-offwhite bg-brand-alert hover:opacity-90 disabled:opacity-60 px-3 py-1.5 rounded-full transition-opacity"
          >
            {pending ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Deleting…
              </>
            ) : (
              "Yes, delete"
            )}
          </button>
        </div>
        {error && (
          <span className="font-serif italic text-[11px] text-brand-alert leading-relaxed">
            {error}
          </span>
        )}
      </div>
    );
  }

  // -------- Multi-record group → full selection panel --------
  return (
    <div className="w-full mt-3 pl-4 border-l-2 border-brand-alert">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] font-bold text-brand-alert">
            · Delete records · {vehicleLabel} ·
          </div>
          <p className="mt-1 font-serif italic text-[13px] text-brand-slate leading-relaxed">
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

      <div className="mt-2 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] font-bold">
        <button
          type="button"
          onClick={selectAll}
          disabled={pending}
          className="text-brand-plum hover:underline disabled:opacity-60"
        >
          Select all
        </button>
        <span className="text-brand-charcoal/20">·</span>
        <button
          type="button"
          onClick={selectNone}
          disabled={pending}
          className="text-brand-slate hover:text-brand-charcoal disabled:opacity-60"
        >
          Select none
        </button>
      </div>

      <ul className="mt-3 space-y-2 max-h-64 overflow-auto pr-1">
        {sortedRecords.map((r, idx) => {
          const checked = picked.has(r.id);
          return (
            <li key={r.id}>
              <label
                className={clsx(
                  "flex items-start gap-2 py-2 cursor-pointer border-b border-brand-charcoal/10 last:border-b-0 transition-colors",
                  pending && "opacity-60 cursor-not-allowed"
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => togglePicked(r.id)}
                  className="mt-0.5 w-3.5 h-3.5 accent-brand-alert"
                  disabled={pending}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <FileText className="w-3 h-3 text-brand-slate shrink-0" />
                    <span className="font-serif font-semibold text-[13px] text-brand-charcoal truncate">
                      {r.fileName || "policy.pdf"}
                    </span>
                    {idx === 0 && (
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] font-bold text-brand-success">
                        · Latest ·
                      </span>
                    )}
                    {r.documentType === "quote" && (
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] font-bold text-brand-plum">
                        · Quote ·
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-[10.5px] text-brand-slate tabular-nums">
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
        <p className="mt-2 font-serif italic text-[12px] text-brand-alert leading-relaxed">
          {error}
        </p>
      )}

      <div className="mt-3 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={close}
          disabled={pending}
          className="font-serif italic text-[13px] text-brand-slate hover:text-brand-charcoal px-3 py-2 transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending || picked.size === 0}
          className="inline-flex items-center gap-1.5 font-serif italic font-medium text-[13px] text-brand-offwhite bg-brand-alert hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-full transition-opacity"
        >
          {pending ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Deleting…
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
