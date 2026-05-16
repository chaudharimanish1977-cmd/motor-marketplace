"use client";

import { useState, useEffect, type FormEvent } from "react";
import {
  Mail,
  MessageCircle,
  ShieldOff,
  Loader2,
  CheckCircle2,
} from "lucide-react";

/**
 * Email capture form shown alongside the parse loader on /upload.
 *
 * Mandatory in the customer flow — without an email we can't deliver
 * the report PDF, can't send the magic link for return access, and
 * the data is orphaned. Trust friction is handled by the "no sales
 * calls" reassurance — repeated everywhere this form appears.
 *
 * Behaviour:
 *   - If the customer submits BEFORE parse finishes, the form goes
 *     into a "queued" state and waits for parse — the parent triggers
 *     the actual claim API call once it knows the doc ID. (Parent
 *     uses the `onClaim` callback which the parent decides when to
 *     fire.)
 *   - If parse is already done when the customer submits, the parent
 *     calls onClaim immediately.
 *   - The form hides itself on success.
 *
 * The form does NOT call /api/upload-session/claim directly — the
 * parent (upload-dropzone) owns that, because the parent knows the
 * just-parsed doc IDs that need to go into the claim request.
 */

export interface EmailCapturePayload {
  email: string;
  whatsapp?: string;
}

interface Props {
  /** Called when the customer submits the form. Parent kicks off the
   *  /api/upload-session/claim call (which it can defer until the
   *  current parse finishes). Should resolve when the claim is done. */
  onClaim: (payload: EmailCapturePayload) => Promise<void>;
  /** External signal from the parent that the claim succeeded — used
   *  to flip the form to a brief "Saved" state then fade. */
  claimed: boolean;
}

export function EmailCaptureForm({ onClaim, claimed }: Props) {
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When the parent flips `claimed` to true, this form hides itself.
  if (claimed) {
    return (
      <div className="rounded-2xl bg-emerald-50/60 border border-emerald-200 p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="text-sm">
          <div className="font-semibold text-brand-charcoal">
            Saved &mdash; we&rsquo;ll email your report
          </div>
          <div className="text-xs text-brand-slate mt-0.5">
            Check your inbox for the report + a sign-in link to access
            your portal.
          </div>
        </div>
      </div>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
      setError("Please enter a valid email.");
      return;
    }
    const cleanWa = whatsapp.replace(/\D/g, "").slice(-10);
    if (cleanWa && !/^[6-9]\d{9}$/.test(cleanWa)) {
      setError("WhatsApp number should be a 10-digit Indian mobile (or leave blank).");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onClaim({
        email: cleanEmail,
        whatsapp: cleanWa || undefined,
      });
      // Parent flips `claimed` — we don't reset submitting here so
      // the success banner can take over.
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't save right now. Try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl bg-white border border-brand-light-gray shadow-soft p-5 space-y-3"
    >
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy">
          While we read your policy
        </div>
        <div className="text-base font-bold text-brand-charcoal mt-1 leading-tight">
          Where should we send your report?
        </div>
      </div>

      <label className="block">
        <span className="block text-[11px] font-semibold text-brand-charcoal mb-1">
          Email
          <span className="text-rose-600 ml-0.5">*</span>
        </span>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-slate/70" />
          <input
            type="email"
            required
            autoFocus
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={submitting}
            className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-brand-light-gray bg-white focus:outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/15 transition-colors disabled:opacity-60"
          />
        </div>
      </label>

      <label className="block">
        <span className="block text-[11px] font-semibold text-brand-charcoal mb-1">
          WhatsApp number{" "}
          <span className="font-normal text-brand-slate">(optional)</span>
        </span>
        <div className="relative">
          <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-slate/70" />
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="9XXXXXXXXX"
            disabled={submitting}
            className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-brand-light-gray bg-white focus:outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/15 transition-colors disabled:opacity-60"
          />
        </div>
        <p className="text-[10px] text-brand-slate/80 mt-1 leading-relaxed">
          Renewal nudges on WhatsApp &mdash; coming as soon as our setup is
          approved. For now your report goes to your email.
        </p>
      </label>

      <div className="rounded-xl bg-emerald-50/40 border border-emerald-100 p-2.5 flex items-start gap-2">
        <ShieldOff className="w-3.5 h-3.5 text-emerald-700 mt-0.5 shrink-0" />
        <div className="text-[11px] text-emerald-900 leading-snug">
          <strong className="font-semibold">No sales calls. Ever.</strong>{" "}
          We only message about your renewals.
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-red-600 leading-snug">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || !email}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-brand-navy hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save my report"
        )}
      </button>
    </form>
  );
}
