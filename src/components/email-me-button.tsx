"use client";

import { useState } from "react";
import clsx from "clsx";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";

/**
 * Soft email-capture CTA without OTP friction. Customer enters email,
 * we send a copy of the report there. Looser than the full DPDP-consent
 * + OTP flow — captures email for renewal-cadence flywheel even when the
 * customer isn't ready for the full download.
 */
export function EmailMeButton({ reportId }: { reportId?: string }) {
  void reportId;
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const submit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      // For the demo this is fire-and-forget; in production we'd
      // POST to /api/email-report with the email + reportId.
      await new Promise((r) => setTimeout(r, 800));
      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setTimeout(() => {
          setSent(false);
          setEmail("");
        }, 300);
      }, 1800);
    } catch {
      // No-op for demo
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-white/90 hover:text-white border border-white/30 hover:border-white/50 px-3 py-1.5 rounded-full transition-colors print:hidden"
      >
        <Mail className="w-3.5 h-3.5" />
        Email me this report
      </button>

      {open && !sent && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-elevated border border-brand-light-gray p-3 z-30">
          <div className="text-xs font-semibold text-brand-charcoal mb-2">
            Send a copy of your report
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-brand-light-gray text-brand-charcoal placeholder:text-brand-slate/50 focus:outline-none focus:border-brand-charcoal"
              autoFocus
            />
            <button
              type="button"
              onClick={submit}
              disabled={!isValid || submitting}
              className={clsx(
                "px-3 py-2 text-xs font-bold rounded-lg",
                isValid && !submitting
                  ? "bg-brand-charcoal hover:brightness-110 text-white"
                  : "bg-brand-light-gray text-brand-slate cursor-not-allowed"
              )}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Send"
              )}
            </button>
          </div>
          <div className="text-[10px] text-brand-slate mt-1.5">
            No spam · No OTP · Quick share
          </div>
        </div>
      )}

      {sent && (
        <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-brand-success text-white text-xs font-semibold rounded-lg shadow-elevated flex items-center gap-1.5 z-30">
          <CheckCircle2 className="w-4 h-4" />
          Sent to {email}
        </div>
      )}
    </div>
  );
}
