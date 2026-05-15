"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

/**
 * DPDP self-service: permanent account + data deletion.
 *
 * Two-step UX so accidental clicks can't wipe a customer's data:
 *   1. "Delete my account" button surfaces the confirm panel.
 *   2. Panel asks the user to type their email exactly. The
 *      Confirm button stays disabled until the typed string matches
 *      (case-insensitive trim). This is the same pattern GitHub uses
 *      for repo deletion — high-friction by design.
 *
 * On success: server clears the session cookie, we client-side push
 * the user to `/` and force a refresh so the header re-evaluates auth.
 */
export function DeleteAccountCard({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const matches = typed.trim().toLowerCase() === email.toLowerCase();

  function onConfirm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!matches || pending) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/me/delete", { method: "POST" });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(data.error ?? "Couldn't delete — try again.");
          return;
        }
        // Hard reload to clear any client-cached server-component data
        // tied to the now-deleted session.
        window.location.href = "/?deleted=1";
      } catch {
        setError("Network error. Try again.");
      }
    });
  }

  if (!open) {
    return (
      <div className="bg-white rounded-2xl border border-rose-100 shadow-soft p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
            <Trash2 className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-brand-charcoal text-sm">
              Delete my account
            </div>
            <p className="text-xs text-brand-slate mt-1 leading-relaxed">
              Permanently removes every policy, report, bid, and reminder we
              hold for{" "}
              <span className="font-medium text-brand-charcoal">{email}</span>.
              This can&rsquo;t be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 text-xs font-semibold text-rose-700 hover:text-rose-900 px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onConfirm}
      className="bg-white rounded-2xl border border-rose-200 shadow-soft p-5 md:p-6 space-y-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-brand-charcoal">
            This deletes everything tied to your email
          </div>
          <p className="text-xs text-brand-slate mt-1 leading-relaxed">
            All parsed policies, reports, bids, transactions, and renewal
            reminders. Permanently. We&rsquo;ll sign you out right after.
          </p>
        </div>
      </div>

      <label className="block">
        <span className="block text-[11px] font-semibold text-brand-charcoal mb-1.5">
          To confirm, type{" "}
          <span className="font-mono">{email}</span> below
        </span>
        <input
          type="text"
          inputMode="email"
          autoComplete="off"
          autoFocus
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={email}
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-brand-light-gray bg-white focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-colors font-mono"
        />
      </label>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTyped("");
            setError(null);
          }}
          disabled={pending}
          className="text-xs font-semibold text-brand-slate hover:text-brand-charcoal px-3 py-2 rounded-xl border border-brand-light-gray hover:bg-brand-offwhite transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!matches || pending}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl transition-colors"
        >
          {pending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="w-3.5 h-3.5" />
              Delete permanently
            </>
          )}
        </button>
      </div>
    </form>
  );
}
