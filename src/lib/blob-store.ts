/**
 * Vercel Blob helpers.
 *
 * Two flavours of PDF live here:
 *   - `reports/<id>.pdf`   — generated review PDFs we email/WhatsApp out
 *   - `policies/<id>.pdf`  — the original policy PDFs uploaded by customers
 *
 * Both go into the same Public Blob store with `addRandomSuffix: true` so
 * URLs are effectively unguessable. Long-term we'll route customer PDF
 * downloads through an auth'd proxy; for now URL-as-secret is acceptable MVP.
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
    addRandomSuffix: true,
  });
  return {
    url: res.url,
    downloadUrl: res.downloadUrl,
  };
}

/**
 * Persist the ORIGINAL policy PDF the customer uploaded. Stored separately
 * from generated reports so it's clear which is source vs derived.
 */
export async function storePolicyPdf(
  policyId: string,
  pdf: Buffer
): Promise<{ url: string; downloadUrl: string }> {
  const key = `policies/${policyId}.pdf`;
  const res = await put(key, pdf, {
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: true,
  });
  return {
    url: res.url,
    downloadUrl: res.downloadUrl,
  };
}
