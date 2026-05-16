"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Mail,
  Phone,
  Shield,
  Loader2,
  AlertCircle,
  ArrowRight,
  FileDown,
} from "lucide-react";
import clsx from "clsx";

type Step = "form" | "otp";

interface Props {
  /** Visual style of the trigger button. */
  variant?: "compact" | "hero";
  /** Override the trigger label. */
  label?: string;
  /** Report ID the email pipeline should render + send a PDF for. */
  reportId?: string;
}

/**
 * "Get the report" CTA. OTP-gated capture of mobile + email + DPDP consent;
 * on OTP verify we POST to /api/email-report (which fires PDF generation +
 * Resend send in the background) and immediately navigate the user to
 * /thank-you so the UI stays snappy.
 */
export function ReportDownloadGate({
  variant = "compact",
  label = "Get the Full Report",
  reportId,
}: Props = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(true);
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setOpen(false);
    // Brief delay so the closing animation doesn't show the form snapping back
    setTimeout(() => {
      setStep("form");
      setOtp("");
      setError(null);
    }, 200);
  };

  const isMobileValid = /^[6-9]\d{9}$/.test(mobile);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSendOtp = isMobileValid && isEmailValid && consent;

  const handleSendOtp = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, email, dpdpConsent: consent }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed to send OTP");
      }
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        throw new Error(data.error || "Verification failed");
      }

      // Fire-and-forget: trigger the PDF render + email send pipeline. The
      // endpoint itself uses waitUntil() so we don't need to wait here.
      if (reportId) {
        const url = new URL(window.location.href);
        void fetch("/api/email-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportId,
            email,
            km: url.searchParams.get("km") ?? undefined,
            drv: url.searchParams.get("drv") ?? undefined,
            oc: url.searchParams.get("oc") ?? undefined,
            pri: url.searchParams.get("pri") ?? undefined,
          }),
        }).catch(() => {
          // Failures are logged server-side; the user already sees /thank-you.
        });
      }

      const params = new URLSearchParams({ e: email, m: mobile });
      if (reportId) params.set("p", reportId);
      // IMPORTANT: keep `submitting=true` through the navigation so the
      // button stays in its "Verifying…" loading state. Earlier this used
      // `finally { setSubmitting(false) }` which fired BEFORE the route
      // change rendered, briefly flashing the orange "Verify & Send"
      // button back at the user and reading like a failure / no-op.
      router.push(`/thank-you?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSubmitting(false);
    }
  };

  const triggerClass =
    variant === "hero"
      ? "inline-flex items-center gap-2 px-8 py-4 bg-brand-olive hover:brightness-110 text-white font-bold text-lg rounded-2xl shadow-glow transition-all hover:scale-[1.03] print:hidden"
      : "inline-flex items-center gap-2 px-4 py-2.5 bg-brand-olive hover:brightness-110 text-white font-semibold text-sm rounded-2xl shadow-glow transition-all hover:scale-[1.02] print:hidden";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClass}
      >
        <FileDown className={variant === "hero" ? "w-5 h-5" : "w-4 h-4"} />
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-brand-charcoal/40 backdrop-blur-sm animate-in fade-in duration-150 print:hidden overflow-y-auto"
          onClick={reset}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-elevated my-4 sm:my-0 max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={reset}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-brand-offwhite flex items-center justify-center text-brand-slate"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {step === "form" && (
              <FormStep
                mobile={mobile}
                email={email}
                consent={consent}
                canSendOtp={canSendOtp}
                submitting={submitting}
                error={error}
                onMobileChange={setMobile}
                onEmailChange={setEmail}
                onConsentChange={setConsent}
                onSendOtp={handleSendOtp}
              />
            )}

            {step === "otp" && (
              <OtpStep
                mobile={mobile}
                email={email}
                otp={otp}
                submitting={submitting}
                error={error}
                onOtpChange={setOtp}
                onVerify={handleVerifyOtp}
                onResend={() => setStep("form")}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// Sub-components per step
// ============================================================================

function FormStep({
  mobile,
  email,
  consent,
  canSendOtp,
  submitting,
  error,
  onMobileChange,
  onEmailChange,
  onConsentChange,
  onSendOtp,
}: {
  mobile: string;
  email: string;
  consent: boolean;
  canSendOtp: boolean;
  submitting: boolean;
  error: string | null;
  onMobileChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onConsentChange: (v: boolean) => void;
  onSendOtp: () => void;
}) {
  return (
    <div className="p-5 sm:p-6 md:p-8">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-plum flex items-center justify-center mb-3">
        <FileDown className="w-6 h-6 text-white" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-brand-charcoal mb-1">
        Get the Full Report
      </h2>
      <p className="text-sm text-brand-slate mb-5">
        Share your mobile + email, verify with a quick OTP, and we&apos;ll send
        your full review and renewal reminders. No spam.
      </p>

      <div className="space-y-4">
        {/* Mobile */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-brand-slate mb-1.5">
            Mobile Number
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate text-sm font-medium">
              +91
            </span>
            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-slate/60" />
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={mobile}
              onChange={(e) =>
                onMobileChange(e.target.value.replace(/\D/g, ""))
              }
              placeholder="98765 43210"
              className="w-full pl-12 pr-10 py-3 border-2 border-brand-light-gray rounded-xl text-base font-medium tabular-nums text-brand-charcoal placeholder:text-brand-slate/50 focus:outline-none focus:border-brand-navy transition-colors"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-brand-slate mb-1.5">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-slate/60" />
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-3 py-3 border-2 border-brand-light-gray rounded-xl text-base text-brand-charcoal placeholder:text-brand-slate/50 focus:outline-none focus:border-brand-navy transition-colors"
            />
          </div>
        </div>

        {/* DPDP consent */}
        <label className="flex items-start gap-3 p-3 bg-brand-offwhite rounded-xl cursor-pointer hover:bg-brand-navy/10 transition-colors">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => onConsentChange(e.target.checked)}
            className="w-5 h-5 mt-0.5 accent-brand-navy"
          />
          <span className="text-xs text-brand-charcoal leading-relaxed">
            I agree to receive renewal reminders and consent to my policy data
            being processed as per the{" "}
            <span className="font-semibold">DPDP Act 2023</span>. My data
            stays in India and is never shared without my consent.
          </span>
        </label>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onSendOtp}
        disabled={!canSendOtp || submitting}
        className={clsx(
          "mt-6 w-full py-3.5 rounded-2xl font-bold text-base inline-flex items-center justify-center gap-2 transition-all",
          canSendOtp && !submitting
            ? "bg-brand-olive hover:brightness-110 text-white shadow-glow hover:scale-[1.01]"
            : "bg-brand-light-gray text-brand-slate cursor-not-allowed"
        )}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending OTP...
          </>
        ) : (
          <>
            Send OTP
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-brand-slate">
        <Shield className="w-3 h-3" />
        Your contact stays private · India-hosted · DPDP compliant
      </div>
    </div>
  );
}

function OtpStep({
  mobile,
  email,
  otp,
  submitting,
  error,
  onOtpChange,
  onVerify,
  onResend,
}: {
  mobile: string;
  email: string;
  otp: string;
  submitting: boolean;
  error: string | null;
  onOtpChange: (v: string) => void;
  onVerify: () => void;
  onResend: () => void;
}) {
  void mobile;
  const isValid = otp.length === 4 && !submitting;

  return (
    <div className="p-5 sm:p-6 md:p-8">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-plum flex items-center justify-center mb-4">
        <Mail className="w-6 h-6 text-white" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-brand-charcoal mb-1">
        Check your inbox
      </h2>
      <p className="text-sm text-brand-slate mb-2">
        We emailed a 4-digit OTP to{" "}
        <span className="font-semibold text-brand-charcoal break-all">
          {email}
        </span>
        . Valid for 10 minutes.
      </p>
      <p className="text-xs text-brand-slate/80 mb-5 leading-relaxed">
        Gmail users: if you don&apos;t see it, check the{" "}
        <span className="font-semibold">Updates</span> tab or search{" "}
        <span className="font-semibold">&ldquo;RightOffer&rdquo;</span>. Also
        peek in spam.
      </p>

      <input
        type="text"
        inputMode="numeric"
        maxLength={4}
        autoFocus
        value={otp}
        onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, ""))}
        placeholder="• • • •"
        className="w-full text-center py-4 text-3xl font-bold tracking-[0.6em] tabular-nums text-brand-charcoal placeholder:text-brand-light-gray border-2 border-brand-light-gray rounded-2xl focus:outline-none focus:border-brand-navy"
      />

      {error && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onVerify}
        disabled={!isValid}
        className={clsx(
          "mt-5 w-full py-3.5 rounded-2xl font-bold text-base inline-flex items-center justify-center gap-2 transition-all",
          isValid
            ? "bg-brand-olive hover:brightness-110 text-white shadow-glow hover:scale-[1.01]"
            : "bg-brand-light-gray text-brand-slate cursor-not-allowed"
        )}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            Verify &amp; Send
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onResend}
        className="mt-3 w-full py-2 text-xs font-semibold text-brand-slate hover:text-brand-charcoal"
      >
        Wrong details? Go back
      </button>
    </div>
  );
}

