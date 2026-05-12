"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Shield } from "lucide-react";
import { UploadDropzone } from "@/components/upload-dropzone";

interface Props {
  isDemo: boolean;
}

/**
 * Top-level upload flow. Owns the visual context (heading, privacy callout,
 * back link) so it can hide them once the dropzone enters loading state —
 * during parsing the user shouldn't see the "Upload your current policy"
 * prompt next to the loader; that's redundant noise.
 */
export function UploadFlow({ isDemo }: Props) {
  const [busy, setBusy] = useState(false);

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Back link is always shown — escape hatch */}
      <Link
        href={isDemo ? "/investor" : "/"}
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-navy mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Heading + subtitle — hidden once parsing begins */}
      {!busy && (
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-ink leading-tight">
            Upload your current policy
          </h1>
          <p className="text-slate-600">
            We&apos;ll read it in{" "}
            <span className="font-semibold text-brand-deepblue">
              under 2 minutes
            </span>{" "}
            — and tell you what&apos;s strong, what&apos;s missing, and what
            to look for at renewal.
          </p>
        </div>
      )}

      <UploadDropzone demoMode={isDemo} onBusyChange={setBusy} />

      {/* Privacy footer — only meaningful when the user is still picking a file */}
      {!busy && (
        <div className="mt-6 flex items-center gap-2 text-xs text-brand-slate">
          <Shield className="w-4 h-4 text-brand-slate" />
          <span>
            Private. Used only to generate your review and renewal reminders.
          </span>
        </div>
      )}
    </main>
  );
}
