"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, ShieldCheck, FileText, Loader2, Check } from "lucide-react";

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
    <div className="bg-white rounded-2xl border border-brand-light-gray shadow-soft p-5 md:p-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-brand-sage/10 text-brand-sage border border-brand-sage/20 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-brand-charcoal text-sm">
            Data &amp; Consent
          </div>
          <p className="text-xs text-brand-slate mt-1 leading-relaxed">
            Everything we hold on{" "}
            <span className="font-medium text-brand-charcoal">{email}</span>
            {" — "}exportable in one click. Your DPDP rights, in plain sight.
          </p>
        </div>
      </div>

      {/* Consent timestamp */}
      {consentLabel && (
        <div className="mt-4 rounded-xl bg-brand-offwhite border border-brand-light-gray px-3.5 py-2.5 flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-brand-sage shrink-0" />
          <div className="text-[11.5px] text-brand-slate leading-relaxed">
            Consent given on{" "}
            <span className="font-semibold text-brand-charcoal">
              {consentLabel}
            </span>
            {" — "}
            <Link
              href="/privacy"
              className="italic text-brand-plum hover:underline"
            >
              what you consented to
            </Link>
          </div>
        </div>
      )}

      {/* Export action */}
      <div className="mt-4 pt-4 border-t border-brand-light-gray">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-brand-charcoal">
              Download my data
            </div>
            <p className="text-[11.5px] text-brand-slate mt-0.5 leading-relaxed">
              Account record, every uploaded policy, every audit, every
              renewal reminder, every quote comparison — as a single
              JSON file.
            </p>
          </div>
          <button
            type="button"
            onClick={onExport}
            disabled={downloading}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy px-3 py-1.5 rounded-xl border border-brand-navy/30 hover:bg-brand-navy/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
          <p className="mt-2 text-[11.5px] text-rose-600">{error}</p>
        )}
      </div>

      {/* Policy link + grievance */}
      <div className="mt-4 pt-4 border-t border-brand-light-gray flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/privacy"
          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-brand-plum hover:underline"
        >
          <FileText className="w-3.5 h-3.5" />
          Read the privacy policy
        </Link>
        <a
          href="mailto:grievance@rightoffer.in?subject=Data%20request"
          className="text-[11.5px] italic text-brand-slate hover:text-brand-charcoal"
        >
          grievance@rightoffer.in
        </a>
      </div>
    </div>
  );
}
