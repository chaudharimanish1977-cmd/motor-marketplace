"use client";

import { useState } from "react";
import { UploadDropzone } from "@/components/upload-dropzone";

interface Props {
  isDemo: boolean;
}

/**
 * Top-level upload flow. Owns the heading + privacy footer so they can be
 * hidden once the dropzone enters loading state — during parsing the user
 * shouldn't see "Upload your current policy" next to the loader.
 *
 * The Back button now lives inside the upload card itself (rendered by
 * UploadDropzone) so the page header is compact and the visible card is
 * the single thing the eye lands on.
 */
export function UploadFlow({ isDemo }: Props) {
  const [busy, setBusy] = useState(false);

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
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

      <UploadDropzone
        demoMode={isDemo}
        onBusyChange={setBusy}
        backHref={isDemo ? "/investor" : "/"}
      />
    </main>
  );
}
