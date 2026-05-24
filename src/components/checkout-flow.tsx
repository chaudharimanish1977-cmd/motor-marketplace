"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  CreditCard,
  Smartphone,
  Building,
  ArrowRight,
  ArrowLeft,
  Shield,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import clsx from "clsx";
import type { Bid, ParsedPolicy } from "@/lib/types";
import { formatINR } from "@/lib/format";

interface Props {
  parsedPolicy: ParsedPolicy;
  bid: Bid;
}

type Step =
  | "kyc-aadhaar"
  | "kyc-pan"
  | "kyc-ckyc"
  | "pay-method"
  | "pay-details"
  | "pay-confirm"
  | "issuing"
  | "done";

const STEP_ORDER: Step[] = [
  "kyc-aadhaar",
  "kyc-pan",
  "kyc-ckyc",
  "pay-method",
  "pay-details",
  "pay-confirm",
];

const STEP_LABELS: Record<Step, string> = {
  "kyc-aadhaar": "KYC · Aadhaar",
  "kyc-pan": "KYC · PAN",
  "kyc-ckyc": "KYC · Confirmation",
  "pay-method": "Payment · Method",
  "pay-details": "Payment · Details",
  "pay-confirm": "Payment · Confirm",
  issuing: "Issuing Policy",
  done: "Done",
};

export function CheckoutFlow({ parsedPolicy, bid }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("kyc-aadhaar");
  const [aadhaar, setAadhaar] = useState("");
  const [pan, setPan] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "upi" | "card" | "netbanking"
  >("upi");
  const [upiId, setUpiId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const stepIdx =
    step === "issuing" || step === "done"
      ? STEP_ORDER.length
      : STEP_ORDER.indexOf(step);
  const totalSteps = STEP_ORDER.length;

  const next = () => {
    setError(null);
    const idx = STEP_ORDER.indexOf(step);
    if (idx === -1 || idx >= STEP_ORDER.length - 1) return;
    setStep(STEP_ORDER[idx + 1]);
  };
  const back = () => {
    setError(null);
    const idx = STEP_ORDER.indexOf(step);
    if (idx <= 0) return;
    setStep(STEP_ORDER[idx - 1]);
  };

  const submit = async () => {
    setStep("issuing");
    try {
      // Mockup "processing" delay (~3s) so the policy-issuance feels real
      await new Promise((r) => setTimeout(r, 3000));
      const res = await fetch(`/api/checkout/${bid.id}/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aadhaarLast4: aadhaar.slice(-4) || "0000",
          panMasked: pan ? pan.slice(0, 5) + "XXXXX" : "ABCDE12345X",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Issuance failed");
      }
      const data = await res.json();
      setStep("done");
      // Brief celebration pause then redirect
      setTimeout(() => {
        router.push(`/policy/${data.transactionId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStep("pay-confirm");
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <ProgressBar
        stepIdx={stepIdx}
        totalSteps={totalSteps}
        label={STEP_LABELS[step]}
      />

      {/* Order summary always visible */}
      <OrderSummary parsedPolicy={parsedPolicy} bid={bid} />

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-brand-light-gray dark:border-slate-700 shadow-sm p-6 md:p-8 min-h-[300px]">
        <DemoModeBadge />

        {step === "kyc-aadhaar" && (
          <KycAadhaarStep
            value={aadhaar}
            onChange={setAadhaar}
            onNext={next}
          />
        )}
        {step === "kyc-pan" && (
          <KycPanStep
            value={pan}
            onChange={setPan}
            onNext={next}
            onBack={back}
          />
        )}
        {step === "kyc-ckyc" && (
          <KycCkycStep onNext={next} onBack={back} />
        )}
        {step === "pay-method" && (
          <PayMethodStep
            method={paymentMethod}
            onChange={setPaymentMethod}
            onNext={next}
            onBack={back}
          />
        )}
        {step === "pay-details" && (
          <PayDetailsStep
            method={paymentMethod}
            upiId={upiId}
            onUpiChange={setUpiId}
            onNext={next}
            onBack={back}
          />
        )}
        {step === "pay-confirm" && (
          <PayConfirmStep
            bid={bid}
            method={paymentMethod}
            onSubmit={submit}
            onBack={back}
            error={error}
          />
        )}
        {step === "issuing" && <IssuingStep bid={bid} />}
        {step === "done" && <DoneStep />}
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function ProgressBar({
  stepIdx,
  totalSteps,
  label,
}: {
  stepIdx: number;
  totalSteps: number;
  label: string;
}) {
  const pct = Math.min(100, ((stepIdx + 1) / (totalSteps + 1)) * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-brand-charcoal">{label}</span>
        <span className="text-brand-slate">
          Step {Math.min(stepIdx + 1, totalSteps)} of {totalSteps}
        </span>
      </div>
      <div className="h-1.5 bg-brand-light-gray rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-charcoal via-brand-plum to-brand-sage transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function OrderSummary({
  parsedPolicy,
  bid,
}: {
  parsedPolicy: ParsedPolicy;
  bid: Bid;
}) {
  return (
    <div className="bg-gradient-to-br from-brand-charcoal to-brand-plum text-white rounded-2xl p-5 flex items-center justify-between shadow-elevated">
      <div className="min-w-0 flex-1">
        <div className="text-[10px] text-white/70 uppercase tracking-[0.12em]">
          Buying from
        </div>
        <div className="font-bold text-lg">{bid.insurerName}</div>
        <div className="text-sm text-white/85 truncate">
          {parsedPolicy.vehicle.make} {parsedPolicy.vehicle.model}{" "}
          {parsedPolicy.vehicle.variant} ({parsedPolicy.vehicle.yearOfManufacture})
        </div>
      </div>
      <div className="text-right shrink-0 ml-4">
        <div className="text-[10px] text-white/70 uppercase tracking-[0.12em]">Total</div>
        <div className="text-2xl font-bold tabular-nums">{formatINR(bid.grandTotal)}</div>
      </div>
    </div>
  );
}

function DemoModeBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-4 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 rounded-full">
      <Sparkles className="w-3 h-3" />
      Demo Mode · No real verification or charge
    </div>
  );
}

function KycAadhaarStep({
  value,
  onChange,
  onNext,
}: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  const valid = value.replace(/\s/g, "").length === 12;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-brand-charcoal">
          Verify your Aadhaar
        </h2>
        <p className="text-brand-slate mt-1">
          Required by IRDAI for policy issuance. We&apos;ll send an OTP via
          DigiLocker (skipped in demo).
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-brand-charcoal mb-2">
          Aadhaar Number
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value.replace(/\D/g, "").slice(0, 12).replace(/(\d{4})/g, "$1 ").trim()
            )
          }
          placeholder="1234 5678 9012"
          className="w-full px-4 py-3 border-2 border-brand-light-gray dark:border-slate-600 rounded-lg text-lg font-mono tracking-wider focus:outline-none focus:border-brand-charcoal"
        />
        <p className="text-xs text-brand-slate mt-2">
          12 digits · Encrypted at rest · Used only for policy issuance
        </p>
      </div>

      <button
        onClick={onNext}
        disabled={!valid}
        className={clsx(
          "w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all",
          valid
            ? "bg-brand-charcoal hover:brightness-110 text-white"
            : "bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500"
        )}
      >
        Continue <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function KycPanStep({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  const valid = panRegex.test(value);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-brand-charcoal">
          PAN verification
        </h2>
        <p className="text-brand-slate mt-1">
          Mandatory for premiums above ₹50,000. We&apos;ll verify the name
          matches your Aadhaar.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-brand-charcoal mb-2">
          PAN Number
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) =>
            onChange(e.target.value.toUpperCase().slice(0, 10))
          }
          placeholder="ABCDE1234F"
          className="w-full px-4 py-3 border-2 border-brand-light-gray dark:border-slate-600 rounded-lg text-lg font-mono tracking-wider focus:outline-none focus:border-brand-charcoal"
        />
        <p className="text-xs text-brand-slate mt-2">
          Format: 5 letters + 4 digits + 1 letter
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-lg font-semibold border-2 border-brand-light-gray dark:border-slate-600 text-brand-charcoal hover:bg-brand-offwhite flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!valid}
          className={clsx(
            "flex-[2] py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all",
            valid
              ? "bg-brand-charcoal hover:brightness-110 text-white"
              : "bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500"
          )}
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function KycCkycStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [verifying, setVerifying] = useState(false);
  const handleConfirm = async () => {
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 1400));
    onNext();
  };
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-brand-charcoal">
          KYC confirmation
        </h2>
        <p className="text-brand-slate mt-1">
          Your details are pulled from the Central KYC Registry (CKYC) using
          your PAN.
        </p>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-emerald-900">
              CKYC Found · Auto-filled
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mt-3">
              <div>
                <div className="text-xs text-brand-slate">Name</div>
                <div className="font-medium">As per Aadhaar/PAN</div>
              </div>
              <div>
                <div className="text-xs text-brand-slate">Address</div>
                <div className="font-medium">As per Aadhaar</div>
              </div>
              <div>
                <div className="text-xs text-brand-slate">DOB</div>
                <div className="font-medium">Verified</div>
              </div>
              <div>
                <div className="text-xs text-brand-slate">PEP Status</div>
                <div className="font-medium">Not flagged</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          defaultChecked
          className="w-5 h-5 mt-0.5 accent-brand-charcoal"
        />
        <span className="text-sm text-brand-charcoal">
          I confirm that the above details are correct and consent to share
          them with the chosen insurer for policy issuance, in line with IRDAI
          and DPDP Act 2023.
        </span>
      </label>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-lg font-semibold border-2 border-brand-light-gray dark:border-slate-600 text-brand-charcoal hover:bg-brand-offwhite flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={verifying}
          className="flex-[2] py-3 rounded-lg font-semibold bg-brand-charcoal hover:brightness-110 text-white flex items-center justify-center gap-2"
        >
          {verifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
            </>
          ) : (
            <>
              Confirm KYC <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function PayMethodStep({
  method,
  onChange,
  onNext,
  onBack,
}: {
  method: "upi" | "card" | "netbanking";
  onChange: (m: "upi" | "card" | "netbanking") => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const options = [
    { id: "upi" as const, label: "UPI", icon: Smartphone, sub: "GPay · PhonePe · Paytm" },
    { id: "card" as const, label: "Card", icon: CreditCard, sub: "Credit / Debit Card" },
    { id: "netbanking" as const, label: "Netbanking", icon: Building, sub: "All major banks" },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-brand-charcoal">Choose payment method</h2>
        <p className="text-brand-slate mt-1">
          All transactions secured by Razorpay. PCI-DSS compliant.
        </p>
      </div>

      <div className="space-y-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const selected = method === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={clsx(
                "w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all text-left",
                selected
                  ? "border-brand-plum bg-brand-plum/10"
                  : "border-brand-light-gray bg-white hover:border-slate-300"
              )}
            >
              <div
                className={clsx(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  selected ? "bg-brand-plum" : "bg-slate-100"
                )}
              >
                <Icon
                  className={clsx(
                    "w-5 h-5",
                    selected ? "text-white" : "text-brand-slate"
                  )}
                />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-brand-charcoal">{opt.label}</div>
                <div className="text-xs text-brand-slate">{opt.sub}</div>
              </div>
              <div
                className={clsx(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  selected ? "border-brand-charcoal bg-brand-charcoal" : "border-slate-300"
                )}
              >
                {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-lg font-semibold border-2 border-brand-light-gray dark:border-slate-600 text-brand-charcoal hover:bg-brand-offwhite flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          className="flex-[2] py-3 rounded-lg font-semibold bg-brand-charcoal hover:brightness-110 text-white flex items-center justify-center gap-2"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function PayDetailsStep({
  method,
  upiId,
  onUpiChange,
  onNext,
  onBack,
}: {
  method: "upi" | "card" | "netbanking";
  upiId: string;
  onUpiChange: (s: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const valid =
    method === "upi"
      ? /^.+@.+/.test(upiId)
      : true; // Card/netbanking accept anything in demo
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-brand-charcoal">
          {method === "upi" && "Enter UPI ID"}
          {method === "card" && "Card Details"}
          {method === "netbanking" && "Select Bank"}
        </h2>
        <p className="text-brand-slate mt-1">Demo mode — any input accepted.</p>
      </div>

      {method === "upi" && (
        <div>
          <label className="block text-sm font-semibold text-brand-charcoal mb-2">
            UPI ID
          </label>
          <input
            type="text"
            value={upiId}
            onChange={(e) => onUpiChange(e.target.value)}
            placeholder="name@okicici"
            className="w-full px-4 py-3 border-2 border-brand-light-gray dark:border-slate-600 rounded-lg focus:outline-none focus:border-brand-charcoal"
          />
        </div>
      )}

      {method === "card" && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-brand-charcoal mb-2">
              Card Number
            </label>
            <input
              type="text"
              placeholder="4242 4242 4242 4242"
              className="w-full px-4 py-3 border-2 border-brand-light-gray dark:border-slate-600 rounded-lg font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="MM/YY"
              className="px-4 py-3 border-2 border-brand-light-gray dark:border-slate-600 rounded-lg font-mono"
            />
            <input
              type="text"
              placeholder="CVV"
              className="px-4 py-3 border-2 border-brand-light-gray dark:border-slate-600 rounded-lg font-mono"
            />
          </div>
        </div>
      )}

      {method === "netbanking" && (
        <select className="w-full px-4 py-3 border-2 border-brand-light-gray dark:border-slate-600 rounded-lg">
          <option>HDFC Bank</option>
          <option>ICICI Bank</option>
          <option>State Bank of India</option>
          <option>Axis Bank</option>
          <option>Kotak Mahindra</option>
        </select>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-lg font-semibold border-2 border-brand-light-gray dark:border-slate-600 text-brand-charcoal hover:bg-brand-offwhite flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!valid}
          className={clsx(
            "flex-[2] py-3 rounded-lg font-semibold flex items-center justify-center gap-2",
            valid
              ? "bg-brand-charcoal hover:brightness-110 text-white"
              : "bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500"
          )}
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function PayConfirmStep({
  bid,
  method,
  onSubmit,
  onBack,
  error,
}: {
  bid: Bid;
  method: string;
  onSubmit: () => void;
  onBack: () => void;
  error: string | null;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-brand-charcoal">Confirm payment</h2>
        <p className="text-brand-slate mt-1">
          Final review before issuing your policy.
        </p>
      </div>

      <div className="bg-brand-offwhite rounded-xl p-5 space-y-3 border border-brand-light-gray dark:border-slate-700">
        <Row label="Insurer" value={bid.insurerName} />
        <Row label="Method" value={method.toUpperCase()} />
        <Row label="Subtotal" value={formatINR(bid.totalPackage)} />
        <Row label="GST (18%)" value={formatINR(bid.cgst + bid.sgst)} />
        <div className="border-t border-slate-300 pt-3">
          <Row label="Total" value={formatINR(bid.grandTotal)} bold />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-lg font-semibold border-2 border-brand-light-gray dark:border-slate-600 text-brand-charcoal hover:bg-brand-offwhite flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onSubmit}
          className="flex-[2] py-3 rounded-2xl font-bold bg-brand-plum hover:brightness-110 text-white flex items-center justify-center gap-2 shadow-glow"
        >
          Pay {formatINR(bid.grandTotal)} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function IssuingStep({ bid }: { bid: Bid }) {
  const messages = [
    "Processing your payment...",
    "Sharing details with " + bid.insurerName + "...",
    "Generating your policy document...",
    "Almost there...",
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setIdx((i) => Math.min(i + 1, messages.length - 1)),
      900
    );
    return () => clearInterval(t);
  }, [messages.length]);
  return (
    <div className="text-center space-y-6 py-8">
      <div className="relative inline-block">
        <Loader2 className="w-16 h-16 text-brand-charcoal animate-spin" />
        <Shield className="w-6 h-6 text-brand-plum absolute top-5 left-5" />
      </div>
      <div>
        <p className="text-lg font-semibold text-brand-charcoal">
          {messages[idx]}
        </p>
        <p className="text-sm text-brand-slate mt-2">
          Policy will be issued in &lt; 5 minutes (demo: instant)
        </p>
      </div>
    </div>
  );
}

function DoneStep() {
  return (
    <div className="text-center space-y-5 py-8">
      <div className="inline-flex w-20 h-20 rounded-full bg-brand-success items-center justify-center shadow-elevated">
        <CheckCircle2 className="w-12 h-12 text-white" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-brand-success">
          Policy Issued!
        </h2>
        <p className="text-brand-slate mt-2">
          Loading your policy document...
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span
        className={clsx(
          "text-sm",
          bold ? "font-bold text-brand-charcoal" : "text-brand-slate"
        )}
      >
        {label}
      </span>
      <span
        className={clsx(
          bold ? "text-xl font-bold text-brand-charcoal" : "font-semibold"
        )}
      >
        {value}
      </span>
    </div>
  );
}
