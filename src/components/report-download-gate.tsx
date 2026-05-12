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
}

/**
 * "Get the report" CTA. OTP-gated capture of mobile + email + DPDP consent;
 * on success we tell the user the report has been emailed to them. (Demo
 * doesn't actually send mail — that wiring lives in /api/register.)
 *
 * Replaces the older browser-print flow because customers asked to receive
 * the report by email rather than navigate a system print dialog.
 */
export function ReportDownloadGate({
  variant = "compact",
  label = "Get the Full Report",
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

  const handleVerifyOtp = () => {
    setError(null);
    if (otp === "9993") {
      const params = new URLSearchParams({ e: email });
      router.push(`/thank-you?${params.toString()}`);
    } else {
      setError("Wrong OTP. Demo OTP is 9993.");
    }
  };

  const triggerClass =
    variant === "hero"
      ? "inline-flex items-center gap-2 px-8 py-4 bg-brand-orange hover:brightness-110 text-white font-bold text-lg rounded-2xl shadow-glow transition-all hover:scale-[1.03] print:hidden"
      : "inline-flex items-center gap-2 px-4 py-2.5 bg-brand-orange hover:brightness-110 text-white font-semibold text-sm rounded-2xl shadow-glow transition-all hover:scale-[1.02] print:hidden";

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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/40 backdrop-blur-sm animate-in fade-in duration-150 print:hidden"
          onClick={reset}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-elevated overflow-hidden"
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
                otp={otp}
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
    <div className="p-6 md:p-8">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-deepblue to-brand-electricblue flex items-center justify-center mb-4">
        <FileDown className="w-6 h-6 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-brand-charcoal mb-1">
        Get the Full Report
      </h2>
      <p className="text-sm text-brand-slate mb-6">
        Share your mobile + email, verify with a quick OTP, and we&apos;ll send
        your full RightOffer policy review along with renewal reminders before
        it expires. No spam.
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
              className="w-full pl-12 pr-10 py-3 border-2 border-brand-light-gray rounded-xl text-base font-medium tabular-nums text-brand-charcoal placeholder:text-brand-slate/50 focus:outline-none focus:border-brand-deepblue transition-colors"
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
              className="w-full pl-10 pr-3 py-3 border-2 border-brand-light-gray rounded-xl text-base text-brand-charcoal placeholder:text-brand-slate/50 focus:outline-none focus:border-brand-deepblue transition-colors"
            />
          </div>
        </div>

        {/* DPDP consent */}
        <label className="flex items-start gap-3 p-3 bg-brand-offwhite rounded-xl cursor-pointer hover:bg-blue-50/40 transition-colors">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => onConsentChange(e.target.checked)}
            className="w-5 h-5 mt-0.5 accent-brand-deepblue"
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
            ? "bg-brand-orange hover:brightness-110 text-white shadow-glow hover:scale-[1.01]"
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
  otp,
  error,
  onOtpChange,
  onVerify,
  onResend,
}: {
  mobile: string;
  otp: string;
  error: string | null;
  onOtpChange: (v: string) => void;
  onVerify: () => void;
  onResend: () => void;
}) {
  const isValid = otp.length === 4;
  const maskedMobile = `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;

  return (
    <div className="p-6 md:p-8">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-deepblue to-brand-electricblue flex items-center justify-center mb-4">
        <Phone className="w-6 h-6 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-brand-charcoal mb-1">
        Verify your mobile
      </h2>
      <p className="text-sm text-brand-slate mb-1">
        Enter the 4-digit OTP sent to{" "}
        <span className="font-semibold text-brand-charcoal">
          {maskedMobile}
        </span>
      </p>
      <p className="text-[11px] text-brand-orange font-semibold mb-5">
        Demo mode: use OTP <span className="font-mono">9993</span>
      </p>

      <input
        type="text"
        inputMode="numeric"
        maxLength={4}
        autoFocus
        value={otp}
        onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, ""))}
        placeholder="• • • •"
        className="w-full text-center py-4 text-3xl font-bold tracking-[0.6em] tabular-nums text-brand-charcoal placeholder:text-brand-light-gray border-2 border-brand-light-gray rounded-2xl focus:outline-none focus:border-brand-deepblue"
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
            ? "bg-brand-orange hover:brightness-110 text-white shadow-glow hover:scale-[1.01]"
            : "bg-brand-light-gray text-brand-slate cursor-not-allowed"
        )}
      >
        Verify & Send
        <ArrowRight className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onResend}
        className="mt-3 w-full py-2 text-xs font-semibold text-brand-slate hover:text-brand-charcoal"
      >
        Wrong number? Edit details
      </button>
    </div>
  );
}

