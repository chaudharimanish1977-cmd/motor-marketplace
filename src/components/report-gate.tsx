"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  MessageCircle,
  ShieldOff,
  Loader2,
  Lock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

/**
 * The Right Offer gate (Model A) — appears on the report page right
 * after the "what's missing" section. Hard wall: behind the gate live
 * the Right Offer Recommendation, the Comparator, the Verdict, and
 * the PDF.
 *
 * Two-step UX:
 *   1. Form (email mandatory, WhatsApp optional) → POST /api/report-gate/request-otp
 *   2. OTP entry → POST /api/report-gate/verify-otp → server stamps docs,
 *      sets upload session, sends magic link → router.refresh() so the
 *      page re-renders without the gate.
 *
 * Brand reassurance is baked in: "No sales calls" pill, the gate itself
 * frames the unlock as their choice ("type the code → see the rest"),
 * never punitive.
 */

type Step = "form" | "otp";

interface Props {
  /** Optional report ID for analytics / future server hints. */
  reportId?: string;
}

export function ReportGate({ reportId: _reportId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  async function onSubmitForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
      setError("Please enter a valid email.");
      return;
    }
    const cleanWa = whatsapp.replace(/\D/g, "").slice(-10);
    if (cleanWa && !/^[6-9]\d{9}$/.test(cleanWa)) {
      setError(
        "WhatsApp should be a 10-digit Indian mobile (or leave blank)."
      );
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/report-gate/request-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          whatsapp: cleanWa || undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? "Couldn't send the code. Try again.");
        return;
      }
      setStep("otp");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmitOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const cleanOtp = otp.replace(/\D/g, "").slice(0, 4);
    if (!/^\d{4}$/.test(cleanOtp)) {
      setError("Enter the 4-digit code we emailed you.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/report-gate/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: cleanOtp,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        verified?: boolean;
        error?: string;
      };
      if (!res.ok || !data.verified) {
        setError(data.error ?? "Couldn't verify the code.");
        return;
      }
      // Refresh so the page re-renders without the gate. The session
      // cookie set on the server response will be present from now on.
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    if (resending) return;
    setResending(true);
    setError(null);
    try {
      const res = await fetch("/api/report-gate/request-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        setError("Couldn't resend right now. Try again in a minute.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="my-10 rounded-3xl border-2 border-brand-navy/30 bg-gradient-to-br from-blue-50/60 to-white shadow-elevated overflow-hidden">
      <div className="px-6 md:px-8 py-7">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 shrink-0 rounded-2xl bg-brand-navy text-white flex items-center justify-center shadow-soft">
            <Lock className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy">
              Unlock the rest of your review
            </div>
            <h3 className="mt-1 text-xl md:text-2xl font-bold text-brand-charcoal leading-tight">
              See exactly what to fix &mdash; and the Right Offer for your
              car
            </h3>
            <p className="mt-2 text-sm text-brand-slate leading-relaxed">
              The rest of the report includes our specific recommendation
              for your car, your quote comparison, and the downloadable
              PDF. We just need to verify your email so we can keep it
              safe and email you the report.
            </p>
          </div>
        </div>

        {step === "form" ? (
          <form onSubmit={onSubmitForm} className="mt-6 space-y-3">
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
                <span className="font-normal text-brand-slate">
                  (optional)
                </span>
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
                Renewal nudges on WhatsApp &mdash; coming as soon as our
                setup is approved.
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
              <p className="text-[12px] text-red-600 leading-snug flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !email}
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-brand-olive hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-glow transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending code...
                </>
              ) : (
                "Send me the code"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={onSubmitOtp} className="mt-6 space-y-3">
            <div className="text-sm text-brand-slate leading-relaxed flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>
                We sent a 4-digit code to{" "}
                <span className="font-semibold text-brand-charcoal">
                  {email}
                </span>
                . Type it below to unlock the rest of your report.
              </span>
            </div>

            <label className="block">
              <span className="block text-[11px] font-semibold text-brand-charcoal mb-1">
                Enter the 4-digit code
              </span>
              <input
                type="text"
                required
                autoFocus
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="1234"
                disabled={submitting}
                className="w-full px-4 py-3 text-2xl font-bold text-center tracking-[0.4em] tabular-nums rounded-xl border border-brand-light-gray bg-white focus:outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/15 transition-colors disabled:opacity-60"
              />
            </label>

            {error && (
              <p className="text-[12px] text-red-600 leading-snug flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || otp.length !== 4}
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-brand-olive hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-glow transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Unlock the rest of my report"
              )}
            </button>

            <div className="flex items-center justify-between text-[11px] text-brand-slate pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setOtp("");
                  setError(null);
                }}
                className="font-semibold text-brand-slate hover:text-brand-charcoal"
              >
                Use a different email
              </button>
              <button
                type="button"
                onClick={onResend}
                disabled={resending}
                className="font-semibold text-brand-navy hover:underline disabled:opacity-60"
              >
                {resending ? "Sending..." : "Resend code"}
              </button>
            </div>

            <p className="text-[10px] text-brand-slate/70 leading-relaxed pt-1">
              Can&rsquo;t find the email? Check Promotions / Spam. The
              sender is <span className="font-mono">hello@rightoffer.in</span>{" "}
              &mdash; add it to your contacts so future renewal reminders
              land in your inbox.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
