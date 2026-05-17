"use client";

/**
 * SaveReportButton — the customer-facing "Save my report" affordance
 * shipped in Phase 7d.1 + 7d.2.
 *
 * One click triggers two downloads in parallel:
 *   1. /api/report-pdf/[id]  → full audit as A4 PDF (multi-page)
 *   2. /api/report-card/[id] → 1080×1080 PNG summary card for sharing
 *      on WhatsApp / forwarding to family
 *
 * Both files land in the customer's Downloads folder. The button stays
 * editorial — serif italic CTA, no SaaS spinner badge, no loud icons.
 * Print mode hides the button entirely so the PDF the customer ends up
 * saving doesn't contain an interactive "Save" beat that's now useless.
 */

import { useState } from "react";
import { Download, Loader2, Check } from "lucide-react";

interface Props {
  reportId: string;
  /** Pass-through driving-profile params so the PDF/card include the
   *  chips and audit personalization the customer saw on-screen. */
  query?: Record<string, string | undefined>;
}

export function SaveReportButton({ reportId, query }: Props) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave() {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      // Fire both downloads in parallel. We *await* both so the
      // button's "Saving…" state covers the longer of the two
      // (typically the PDF — ~6-12s on Vercel cold start).
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query ?? {})) {
        if (v) params.set(k, v);
      }
      const qs = params.toString();
      const pdfUrl = `/api/report-pdf/${reportId}${qs ? `?${qs}` : ""}`;
      const cardUrl = `/api/report-card/${reportId}`;

      const [pdfRes, cardRes] = await Promise.all([
        fetch(pdfUrl),
        fetch(cardUrl),
      ]);

      if (!pdfRes.ok || !cardRes.ok) {
        const failing = !pdfRes.ok ? pdfRes : cardRes;
        const body = (await failing.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(
          body.error ??
            "Couldn't save the report. Try again or email hello@rightoffer.in."
        );
        return;
      }

      await Promise.all([
        downloadBlob(pdfRes, suggestedFilename(pdfRes, `rightoffer-report-${reportId}.pdf`)),
        downloadBlob(cardRes, `rightoffer-summary-${reportId}.png`),
      ]);
      setDone(true);
      window.setTimeout(() => setDone(false), 4000);
    } catch (err) {
      console.error("[save-report] failed", err);
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 print:hidden">
      <button
        type="button"
        onClick={onSave}
        disabled={busy}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-brand-charcoal/25 hover:border-brand-plum hover:text-brand-plum text-brand-charcoal font-serif italic font-medium text-[15px] md:text-[16px] min-h-[44px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving your report…
          </>
        ) : done ? (
          <>
            <Check className="w-4 h-4" />
            Saved — check your Downloads
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Save my report (PDF + summary card)
          </>
        )}
      </button>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
        · A4 PDF for keeping · Square PNG for WhatsApp ·
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

/** Stream a fetch response into a browser-triggered download. Same
 *  in-memory blob → anchor pattern the DataConsentCard uses. */
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
