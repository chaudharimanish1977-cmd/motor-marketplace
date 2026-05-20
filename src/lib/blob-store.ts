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

/**
 * Persist a PDF arriving via the email-forward inbound channel (Postmark).
 * Stored under a separate prefix so it's clear by URL which channel
 * brought the PDF in — useful for debugging and for any future analytics
 * on inbound-channel performance.
 *
 * Once the PDF is classified + accepted as a policy/quote, the parse
 * pipeline (api/inbound/email -> K4) will re-store it under policies/
 * with a stable ID via storePolicyPdf. The inbox/ copy stays as the
 * raw-arrival archive for traceability.
 */
export async function storeInboxPdf(
  inboundId: string,
  pdf: Buffer
): Promise<{ url: string; downloadUrl: string }> {
  const key = `inbox/${inboundId}.pdf`;
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
