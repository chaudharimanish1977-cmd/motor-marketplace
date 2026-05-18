"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

/**
 * DPDP self-service: permanent account + data deletion.
 *
 * Editorial vocab — coral left-rule for the destructive intent, mono
 * kicker, serif body. Two-step UX so accidental clicks can't wipe a
 * customer's data:
 *
 *   1. "Delete my account" surfaces the confirm panel.
 *   2. Panel asks the user to type their email exactly. The Confirm
 *      button stays disabled until the typed string matches
 *      (case-insensitive trim). This is the same pattern GitHub uses
 *      for repo deletion — high-friction by design.
 *
 * On success: server clears the session cookie, we hard-reload to `/`
 * so the header re-evaluates auth.
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
        window.location.href = "/?deleted=1";
      } catch {
        setError("Network error. Try again.");
      }
    });
  }

  // `router` reference is intentional so React doesn't warn about an
  // unused import; client transitions handle the redirect via
  // window.location.href to ensure session cookies clear before the
  // next render.
  void router;

  if (!open) {
    return (
      <div className="pl-4 py-2 border-l-2 border-brand-alert/60">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] font-bold text-brand-alert">
              · Delete my account ·
            </div>
            <p className="mt-1 font-serif italic text-[14px] text-brand-slate leading-relaxed max-w-md">
              Permanently removes every policy, report, bid, and
              reminder we hold for{" "}
              <span className="not-italic font-medium text-brand-charcoal">
                {email}
              </span>
              . This can&rsquo;t be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-brand-charcoal/25 hover:border-brand-alert hover:text-brand-alert text-brand-charcoal font-serif italic font-medium text-[13px] md:text-[14px] min-h-[36px] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onConfirm}
      className="pl-4 py-2 border-l-4 border-brand-alert space-y-4"
    >
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] font-bold text-brand-alert">
          · Permanent deletion ·
        </div>
        <p className="mt-1 font-serif italic text-[14px] text-brand-charcoal leading-relaxed max-w-md">
          All parsed policies, reports, bids, transactions and renewal
          reminders. Permanently. We&rsquo;ll sign you out right after.
        </p>
      </div>

      <label className="block max-w-md">
        <span className="block font-mono text-[10px] uppercase tracking-[0.14em] font-bold text-brand-charcoal mb-2">
          To confirm, type{" "}
          <span className="text-brand-alert">{email}</span> below
        </span>
        <input
          type="text"
          inputMode="email"
          autoComplete="off"
          autoFocus
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={email}
          className="w-full px-3 py-2.5 text-[14px] rounded-md border border-brand-charcoal/25 bg-brand-offwhite/40 focus:outline-none focus:border-brand-alert focus:ring-2 focus:ring-brand-alert/30 transition-colors font-mono tabular-nums"
        />
      </label>

      {error && (
        <p className="font-serif italic text-[13px] text-brand-alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTyped("");
            setError(null);
          }}
          disabled={pending}
          className="font-serif italic text-[13px] text-brand-slate hover:text-brand-charcoal px-3 py-2 transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!matches || pending}
          className="inline-flex items-center gap-1.5 font-serif italic font-medium text-[13px] text-brand-offwhite bg-brand-alert hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-full transition-opacity"
        >
          {pending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Deleting…
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
