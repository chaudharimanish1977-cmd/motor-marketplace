"use client";

/**
 * SaveReportButton — the customer-facing "Download my report"
 * affordance (Phase 7d.1).
 *
 * Single download: the full A4 PDF report. The earlier dual-download
 * (PDF + 1080×1080 summary card) was dropped post-launch — the card
 * added clutter without earning its keep. The WhatsApp share message
 * already carries the share link, so there's no need for a separate
 * social-proof image.
 *
 * Mobile reliability: a single download eliminates the iOS Safari
 * multi-download race entirely. No delay, no sequencing, no second
 * file to lose.
 *
 * Print mode hides the button so the saved PDF itself doesn't carry
 * an interactive "Download" beat that's now useless.
 */

import { useState } from "react";
import { Download, Loader2, Check } from "lucide-react";

interface Props {
  reportId: string;
  /** Pass-through driving-profile params so the PDF mirrors the
   *  chips + audit personalization the customer saw on-screen. */
  query?: Record<string, string | undefined>;
}

type SaveState = "idle" | "saving" | "done";

export function SaveReportButton({ reportId, query }: Props) {
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSave() {
    if (state === "saving") return;
    setError(null);
    setState("saving");

    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query ?? {})) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    const pdfUrl = `/api/report-pdf/${reportId}${qs ? `?${qs}` : ""}`;

    try {
      const res = await fetch(pdfUrl);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(body.error ?? "Couldn't render the PDF. Try again.");
        setState("idle");
        return;
      }
      await downloadBlob(
        res,
        suggestedFilename(res, `rightoffer-report-${reportId}.pdf`)
      );
      setState("done");
      window.setTimeout(() => setState("idle"), 5000);
    } catch (err) {
      console.error("[save-report] failed", err);
      setError("Network error. Try again.");
      setState("idle");
    }
  }

  return (
    <div className="mt-6 print:hidden">
      <button
        type="button"
        onClick={onSave}
        disabled={state === "saving"}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-brand-charcoal/25 hover:border-brand-plum hover:text-brand-plum text-brand-charcoal font-serif italic font-medium text-[15px] md:text-[16px] min-h-[44px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {state === "saving" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Preparing your PDF…
          </>
        ) : state === "done" ? (
          <>
            <Check className="w-4 h-4" />
            Saved — check your Downloads
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Download my report (PDF)
          </>
        )}
      </button>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
        · A4 PDF · The full audit · Open anywhere ·
      </div>
      {error && (
        <p className="mt-2 font-serif italic text-[13px] text-brand-alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Pull a Content-Disposition `filename="…"` out of the response, falling
 *  back to a sensible default. */
function suggestedFilename(res: Response, fallback: string): string {
  const cd = res.headers.get("content-disposition") ?? "";
  const m = cd.match(/filename="([^"]+)"/);
  return m?.[1] ?? fallback;
}

/** Stream a fetch response into a browser-triggered download. */
async function downloadBlob(res: Response, filename: string): Promise<void> {
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
