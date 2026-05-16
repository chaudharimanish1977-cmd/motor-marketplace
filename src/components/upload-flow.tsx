"use client";

import { useState } from "react";
import { RefreshCw, Car, MapPin, ShieldOff } from "lucide-react";
import { UploadDropzone } from "@/components/upload-dropzone";
import type { RenewalContext } from "@/app/upload/page";

interface Props {
  isDemo: boolean;
  renewalContext?: RenewalContext | null;
  /** Home-page chip raw value (`pay_less` / `worry_less` / null). The flow
   *  translates it into a pre-filled MidLoadQuestions priority answer and
   *  hands it to the dropzone. */
  priorityChip?: string | null;
}

/**
 * Top-level upload flow. Owns the heading + privacy footer so they can be
 * hidden once the dropzone enters loading state — during parsing the user
 * shouldn't see "Upload your current policy" next to the loader.
 *
 * When `renewalContext` is present (returning customer from /me), the
 * heading is replaced by a personalised "Renewing your <vehicle>" banner.
 * Otherwise the page renders the standard first-time copy.
 */
export function UploadFlow({
  isDemo,
  renewalContext,
  priorityChip,
}: Props) {
  const [busy, setBusy] = useState(false);

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Heading area — swapped for renewal banner when applicable.
          Hidden once parsing begins so the loader stands alone. */}
      {!busy && renewalContext && (
        <RenewalBanner context={renewalContext} />
      )}
      {!busy && !renewalContext && (
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-ink leading-tight">
            Upload your current policy
          </h1>
          <p className="text-slate-600">
            We&apos;ll read it in{" "}
            <span className="font-semibold text-brand-navy">
              under 2 minutes
            </span>{" "}
            — and tell you what&apos;s strong, what&apos;s missing, and what
            to look for at renewal.
          </p>
          <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800">
            <ShieldOff className="w-3 h-3" />
            <span>
              <strong className="font-semibold">No sales calls. Ever.</strong>{" "}
              We only message about your renewals.
            </span>
          </div>
        </div>
      )}

      <UploadDropzone
        demoMode={isDemo}
        onBusyChange={setBusy}
        backHref={renewalContext ? "/me" : isDemo ? "/investor" : "/"}
        priorityChip={priorityChip ?? null}
      />
    </main>
  );
}

function RenewalBanner({ context }: { context: RenewalContext }) {
  const subline = [
    context.registrationNumber,
    context.rtoCity,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mb-6 rounded-2xl border border-brand-navy/30 bg-gradient-to-br from-brand-navy/10 to-white p-5 md:p-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-brand-navy to-brand-plum text-white flex items-center justify-center shadow-soft">
          <RefreshCw className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy">
            Renewal review
          </div>
          <div className="font-bold text-brand-charcoal text-lg leading-tight mt-1 flex items-center gap-2 flex-wrap">
            <Car className="w-4 h-4 text-brand-navy" />
            Renewing your {context.vehicleLabel}
          </div>
          {subline && (
            <div className="text-xs text-brand-slate mt-1 flex items-center gap-1.5">
              {context.rtoCity && (
                <MapPin className="w-3 h-3 text-brand-slate/70" />
              )}
              {subline}
            </div>
          )}
          <p className="text-sm text-brand-slate mt-3 leading-relaxed">
            Drop this year&rsquo;s renewal quote (or your latest policy) and
            we&rsquo;ll review what&rsquo;s changed, what&rsquo;s missing, and
            where the better offers are.
          </p>
        </div>
      </div>
    </div>
  );
}
