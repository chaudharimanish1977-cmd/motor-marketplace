"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, FileText, Loader2, Check } from "lucide-react";

/**
 * /me → Data & Consent surface (DPDP §11 data portability + §6 consent).
 *
 * Three things this card does for the signed-in customer:
 *   1. Surfaces *when* they last gave consent (transparency)
 *   2. Lets them download every piece of personal data we hold on them
 *      as a single JSON file via /api/me/export
 *   3. Links out to the Privacy Policy + grievance contact
 *
 * Permanent deletion lives in a separate DeleteAccountCard sibling —
 * intentionally split so the destructive control has its own visual
 * weight and isn't accidentally fired while the customer is just
 * trying to grab their data.
 *
 * The "export" button calls /api/me/export which returns the JSON
 * payload with a Content-Disposition: attachment header. We read the
 * response as a Blob and trigger a download via an in-memory anchor
 * so the file is saved with the server-suggested filename — works on
 * every browser including Safari (which used to ignore the header
 * on direct GETs in some configurations).
 */
export function DataConsentCard({
  email,
  consentGivenAt,
}: {
  email: string;
  consentGivenAt?: string | null;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const consentLabel = consentGivenAt
    ? new Date(consentGivenAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  async function onExport() {
    if (downloading) return;
    setError(null);
    setDownloading(true);
    try {
      const res = await fetch("/api/me/export", { method: "GET" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(body.error ?? "Couldn't generate the export. Try again.");
        return;
      }

      // Pull the filename out of the Content-Disposition header — the
      // server is the source of truth for the export name (includes
      // sanitised email + date).
      const disposition = res.headers.get("content-disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename =
        match?.[1] ??
        `rightoffer-data-export-${new Date().toISOString().slice(0, 10)}.json`;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDownloaded(true);
      // Reset the "Downloaded ✓" beat after a moment so the button is
      // ready for a second export if needed.
      window.setTimeout(() => setDownloaded(false), 4000);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="pl-4 py-2 border-l-2 border-brand-sage/60">
      {/* Header */}
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] font-bold text-brand-sage">
        · Data &amp; Consent ·
      </div>
      <p className="mt-1 font-serif italic text-[14px] text-brand-slate leading-relaxed max-w-md">
        Everything we hold on{" "}
        <span className="not-italic font-medium text-brand-charcoal">
          {email}
        </span>
        {" — "}exportable in one click. Your DPDP rights, in plain sight.
      </p>

      {/* Consent timestamp */}
      {consentLabel && (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-brand-slate">
          · Consent given on{" "}
          <span className="font-bold text-brand-charcoal">
            {consentLabel}
          </span>{" "}
          ·{" "}
          <Link
            href="/privacy"
            className="text-brand-plum hover:underline normal-case tracking-normal"
          >
            <span className="font-serif italic">what you consented to</span>
          </Link>
        </p>
      )}

      {/* Export action */}
      <div className="mt-5 flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="font-serif font-semibold text-[14px] md:text-[15px] text-brand-charcoal">
            Download my data
          </div>
          <p className="mt-0.5 font-serif italic text-[12.5px] text-brand-slate leading-relaxed max-w-md">
            Account record, every uploaded policy, every audit, every
            renewal reminder, every quote comparison — as a single JSON
            file.
          </p>
        </div>
        <button
          type="button"
          onClick={onExport}
          disabled={downloading}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-brand-charcoal/25 hover:border-brand-plum hover:text-brand-plum text-brand-charcoal font-serif italic font-medium text-[13px] md:text-[14px] min-h-[36px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {downloading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Preparing…
            </>
          ) : downloaded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Downloaded
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </>
          )}
        </button>
      </div>
      {error && (
        <p className="mt-2 font-serif italic text-[12.5px] text-brand-alert">
          {error}
        </p>
      )}

      {/* Policy link + grievance */}
      <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/privacy"
          className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] font-bold text-brand-plum hover:underline"
        >
          <FileText className="w-3 h-3" />
          Read the privacy policy
        </Link>
        <a
          href="mailto:grievance@rightoffer.in?subject=Data%20request"
          className="font-serif italic text-[12px] text-brand-slate hover:text-brand-charcoal"
        >
          grievance@rightoffer.in
        </a>
      </div>
    </div>
  );
}
