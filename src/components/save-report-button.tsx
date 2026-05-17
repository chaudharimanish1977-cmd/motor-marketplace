"use client";

/**
 * SaveReportButton — the customer-facing "Save my report" affordance
 * shipped in Phase 7d.1 + 7d.2 (with the iOS multi-download fix).
 *
 * One click triggers two downloads — but SEQUENTIALLY with a real
 * delay between them, not in parallel. iOS Safari treats two
 * `<a download>` clicks fired in quick succession as a potential
 * abuse pattern and silently blocks the second one. Empirically:
 *   - parallel: PNG arrives (small, fast), PDF blocked (large, slow)
 *   - sequential w/ 1500ms delay: both arrive reliably
 *
 * Order matters too — PDF first (it's the actual report; the card
 * is the bonus social-proof artifact). If the second download were
 * ever to fail on a particular device, the customer still has the
 * primary asset.
 *
 * UI states walk the customer through what's happening:
 *   Idle:                "Save my report (PDF + summary card)"
 *   Step 1 of 2:         "Saving the PDF…"
 *   Step 2 of 2:         "Saving the summary card…"
 *   Done:                "Saved — check your Downloads"
 *
 * Print mode hides the button entirely so the PDF the customer
 * ends up saving doesn't contain an interactive "Save" beat that's
 * now useless.
 */

import { useState } from "react";
import { Download, Loader2, Check } from "lucide-react";

interface Props {
  reportId: string;
  /** Pass-through driving-profile params so the PDF/card include the
   *  chips and audit personalization the customer saw on-screen. */
  query?: Record<string, string | undefined>;
}

type SaveState = "idle" | "pdf" | "card" | "done";

export function SaveReportButton({ reportId, query }: Props) {
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSave() {
    if (state !== "idle" && state !== "done") return;
    setError(null);

    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query ?? {})) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    const pdfUrl = `/api/report-pdf/${reportId}${qs ? `?${qs}` : ""}`;
    const cardUrl = `/api/report-card/${reportId}`;

    try {
      // ── Step 1: PDF (priority — the actual report) ──────────────
      setState("pdf");
      const pdfRes = await fetch(pdfUrl);
      if (!pdfRes.ok) {
        setError(await readError(pdfRes, "Couldn't render the PDF."));
        setState("idle");
        return;
      }
      await downloadBlob(
        pdfRes,
        suggestedFilename(pdfRes, `rightoffer-report-${reportId}.pdf`)
      );

      // ── Pause so iOS Safari doesn't conflate the two downloads ──
      // 1500ms is the empirical sweet spot — short enough to feel
      // continuous, long enough for the iOS download handler to
      // settle the first file before the next .click() fires.
      await delay(1500);

      // ── Step 2: WhatsApp summary card (PNG) ─────────────────────
      setState("card");
      const cardRes = await fetch(cardUrl);
      if (!cardRes.ok) {
        // PDF already landed — surface a softer error so the customer
        // knows their main artifact is safe.
        setError(
          await readError(
            cardRes,
            "The PDF saved. We couldn't render the summary card — try again or email hello@rightoffer.in."
          )
        );
        setState("idle");
        return;
      }
      await downloadBlob(cardRes, `rightoffer-summary-${reportId}.png`);

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
        disabled={state === "pdf" || state === "card"}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-brand-charcoal/25 hover:border-brand-plum hover:text-brand-plum text-brand-charcoal font-serif italic font-medium text-[15px] md:text-[16px] min-h-[44px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {state === "pdf" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving the PDF…
          </>
        ) : state === "card" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving the summary card…
          </>
        ) : state === "done" ? (
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
        · A4 PDF first · then a square PNG for WhatsApp ·
      </div>
      {error && (
        <p className="mt-2 font-serif italic text-[13px] text-brand-alert">
          {error}
        </p>
      )}
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => window.setTimeout(r, ms));
}

async function readError(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return body.error ?? fallback;
}

/** Pull a Content-Disposition `filename="…"` out of the response, falling
 *  back to a sensible default. */
function suggestedFilename(res: Response, fallback: string): string {
  const cd = res.headers.get("content-disposition") ?? "";
  const m = cd.match(/filename="([^"]+)"/);
  return m?.[1] ?? fallback;
}

/** Stream a fetch response into a browser-triggered download. The
 *  in-memory blob → anchor click → revoke pattern works everywhere
 *  modern (Safari iOS 13+, Chrome Android, all desktop), but iOS
 *  Safari deduplicates multiple clicks fired in quick succession —
 *  see caller for the delay between sequential calls. */
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
