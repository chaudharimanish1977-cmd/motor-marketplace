/**
 * Reusable PDF render + email pipeline.
 *
 * Two call sites use this today:
 *   1. /api/email-report — the legacy "Get the Full Report" CTA on
 *      the old report-download gate. Customer-initiated.
 *   2. /report/[id]/page.tsx — the post-gate auto-delivery. After a
 *      customer verifies (via OTP or OAuth) and lands on a report
 *      page, the server checks `report.emailsSent` and, if their
 *      email isn't there, fires this pipeline via waitUntil and
 *      pushes their email to the list.
 *
 * The pipeline:
 *   1. Renders the report PDF via puppeteer (~15-25s)
 *   2. Stores it in Vercel Blob (so we can link to it later if needed)
 *   3. Sends it as an email attachment via Resend
 *
 * Errors are logged + swallowed — callers run this via `waitUntil` so
 * the response is already on the wire by the time the pipeline runs.
 * A failed delivery here doesn't break the customer's experience.
 */

import { findById, findOne, Tables } from "@/lib/db";
import { renderReportPdf } from "@/lib/pdf-renderer";
import { storeReportPdf } from "@/lib/blob-store";
import { sendReportEmail } from "@/lib/email-sender";
import { friendlyFirstName } from "@/lib/format";
import type { ParsedPolicy, User } from "@/lib/types";

interface PipelineArgs {
  reportId: string;
  email: string;
  baseUrl: string;
  /** Pass-through query params (driving profile) so the PDF embeds
   *  the same chips + audit personalisation the customer saw on
   *  screen. */
  query?: Record<string, string | undefined>;
}

export async function sendReportPdfEmail(
  args: PipelineArgs
): Promise<void> {
  const { reportId, email, baseUrl, query } = args;
  try {
    const parsedPolicy = await findById<ParsedPolicy>(
      Tables.PARSED_POLICIES,
      reportId
    );
    if (!parsedPolicy) {
      console.error(`[pdf-pipeline] Report not found: ${reportId}`);
      return;
    }
    const vehicleLabel =
      `${parsedPolicy.vehicle.make} ${parsedPolicy.vehicle.model}`.trim() ||
      "your vehicle";

    // Look up the customer's display name from the User row so the
    // editorial email can address them by first name. Falls back to
    // the policy's owner.name if we don't have a User record yet
    // (rare — happens on fresh OAuth before any upload), then to
    // a generic greeting if both are missing.
    const lowered = email.toLowerCase();
    const userRow = await findOne<User>(
      Tables.USERS,
      (u) => (u.email ?? "").toLowerCase() === lowered
    );
    const firstName =
      friendlyFirstName(userRow?.name) ||
      friendlyFirstName(parsedPolicy.owner?.name) ||
      undefined;

    console.log(
      `[pdf-pipeline] Rendering PDF for report ${reportId} → ${email}`
    );
    const t0 = Date.now();
    const pdf = await renderReportPdf({ reportId, baseUrl, query });
    console.log(
      `[pdf-pipeline] PDF ${pdf.length} bytes in ${Date.now() - t0}ms`
    );

    const { url } = await storeReportPdf(reportId, pdf);
    console.log(`[pdf-pipeline] Stored at ${url}`);

    await sendReportEmail({
      to: email,
      vehicleLabel,
      reportUrl: `${baseUrl}/report/${reportId}`,
      pdf,
      firstName,
    });
    console.log(`[pdf-pipeline] Sent to ${email}`);
  } catch (err) {
    console.error("[pdf-pipeline] FAILED:", err);
  }
}
