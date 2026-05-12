/**
 * Vercel Blob helpers for storing generated PDFs.
 *
 * Why store, instead of email-only? Because the same PDF will be re-sent
 * over WhatsApp once that integration ships, and the Cloud API expects a
 * publicly fetchable URL. Storing once in Blob means email + WhatsApp + any
 * future channel all share the same artifact.
 *
 * Keyed by reportId so the same report is reused across resends. Public
 * access (anyone with the URL can fetch); URLs include a random suffix so
 * they aren't guessable.
 */

import { put } from "@vercel/blob";

export async function storeReportPdf(
  reportId: string,
  pdf: Buffer
): Promise<{ url: string; downloadUrl: string }> {
  const key = `reports/${reportId}.pdf`;
  const res = await put(key, pdf, {
    access: "public",
    contentType: "application/pdf",
    // Random suffix avoids 409s on resends; trade-off is a small bit of
    // storage bloat per regenerate. Cleanup script can dedupe later.
    addRandomSuffix: true,
  });
  return {
    url: res.url,
    // Vercel Blob provides a separate URL that triggers a Content-Disposition
    // attachment, which forces a download instead of an in-browser preview.
    downloadUrl: res.downloadUrl,
  };
}
