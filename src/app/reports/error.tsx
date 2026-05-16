"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { BrandBlobs } from "@/components/brand-blobs";

/**
 * Error boundary for /reports. Catches any render-time crash and
 * surfaces the message so we can diagnose instead of seeing the
 * generic "Application error: a client-side exception has occurred"
 * screen.
 *
 * Renders the error name + message + a "Try again" button that calls
 * Next.js's reset() to re-attempt rendering.
 */
export default function ReportsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[reports] Error boundary caught:", error);
  }, [error]);

  return (
    <>
      <BrandBlobs />
      <main className="relative z-10 min-h-screen px-4 py-12 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white border border-rose-200 rounded-2xl shadow-soft p-6 md:p-8">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-brand-charcoal tracking-tight">
                Something went wrong loading your reports
              </h2>
              <p className="text-xs text-brand-slate mt-1">
                We&rsquo;re showing the technical detail below so you
                can share it with us if it keeps happening.
              </p>
            </div>
          </div>

          {/* Error detail — visible so the user can copy/paste back to us */}
          <pre className="mt-4 p-3 rounded-xl bg-rose-50/40 border border-rose-100 text-[11px] text-brand-charcoal whitespace-pre-wrap break-words font-mono">
            {error.name}: {error.message}
            {error.digest ? `\n\nDigest: ${error.digest}` : ""}
            {error.stack ? `\n\n${error.stack.split("\n").slice(0, 6).join("\n")}` : ""}
          </pre>

          <div className="mt-5 flex items-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-navy hover:brightness-110 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try again
            </button>
            <a
              href="/upload"
              className="text-xs font-semibold text-brand-slate hover:text-brand-charcoal px-3 py-2"
            >
              Back to upload
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
