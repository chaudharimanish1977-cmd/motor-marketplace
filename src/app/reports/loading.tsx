import { Loader2 } from "lucide-react";
import { BrandBlobs } from "@/components/brand-blobs";

/**
 * Loading skeleton for /reports. Next.js automatically renders this
 * while the server component (page.tsx) is doing its work — including
 * any lazy LLM report generation. Without this, slow loads can lead to
 * a "connection closed" client-side error if Vercel's streaming
 * response is interrupted.
 *
 * Keep this lightweight — no LLM calls, no DB reads.
 */
export default function Loading() {
  return (
    <>
      <BrandBlobs />
      <main className="relative z-10 min-h-screen px-4 py-12 flex items-center justify-center">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-brand-navy">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-charcoal tracking-tight">
              Preparing your reports
            </h2>
            <p className="mt-1.5 text-sm text-brand-slate leading-relaxed max-w-sm mx-auto">
              We&rsquo;re putting together the Right Offer review for each
              document you uploaded. This usually takes under a minute.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
