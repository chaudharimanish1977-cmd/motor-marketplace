import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { waitUntil } from "@vercel/functions";
import { findById, Tables } from "@/lib/db";
import type { ParsedPolicy } from "@/lib/types";
import { renderReportPdf } from "@/lib/pdf-renderer";
import { storeReportPdf } from "@/lib/blob-store";
import { sendReportEmail } from "@/lib/email-sender";

export const runtime = "nodejs";
export const maxDuration = 60;

const Schema = z.object({
  reportId: z.string().uuid(),
  email: z.string().email(),
  /** Optional driving-profile params so the PDF includes the chips. */
  km: z.string().optional(),
  drv: z.string().optional(),
  oc: z.string().optional(),
  pri: z.string().optional(),
});

/**
 * Render the report PDF, store it in Vercel Blob, and email it via Resend.
 *
 * The HTTP response returns immediately with `{ ok: true }` and the heavy
 * work (PDF render + Blob upload + email send) runs after the response via
 * Vercel's waitUntil. This keeps the client UX snappy — the customer sees
 * "Report sent!" immediately, and the email arrives shortly after.
 */
export async function POST(request: NextRequest) {
  let body;
  try {
    body = Schema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      {
        error: "Invalid request",
        details: err instanceof z.ZodError ? err.issues : String(err),
      },
      { status: 400 }
    );
  }

  const parsedPolicy = await findById<ParsedPolicy>(
    Tables.PARSED_POLICIES,
    body.reportId
  );
  if (!parsedPolicy) {
    return NextResponse.json(
      { error: "Report not found" },
      { status: 404 }
    );
  }

  const baseUrl = resolveBaseUrl(request);
  const vehicleLabel =
    `${parsedPolicy.vehicle.make} ${parsedPolicy.vehicle.model}`.trim() ||
    "your vehicle";

  // Fire-and-forget the render + send pipeline. The response is immediate.
  waitUntil(
    (async () => {
      try {
        console.log(
          `[email-report] Rendering PDF for report ${body.reportId} ...`
        );
        const t0 = Date.now();
        const pdf = await renderReportPdf({
          reportId: body.reportId,
          baseUrl,
          query: {
            km: body.km,
            drv: body.drv,
            oc: body.oc,
            pri: body.pri,
          },
        });
        console.log(
          `[email-report] PDF ${pdf.length} bytes in ${Date.now() - t0}ms`
        );

        const { url } = await storeReportPdf(body.reportId, pdf);
        console.log(`[email-report] Stored at ${url}`);

        await sendReportEmail({
          to: body.email,
          vehicleLabel,
          reportUrl: `${baseUrl}/report/${body.reportId}`,
          pdf,
        });
        console.log(`[email-report] Sent to ${body.email}`);
      } catch (err) {
        console.error("[email-report] FAILED:", err);
      }
    })()
  );

  return NextResponse.json({ ok: true });
}

/**
 * Use the request's own origin so puppeteer can fetch the live deployment.
 * Honours x-forwarded-host (Vercel injects this) and falls back to the
 * configured public site URL.
 */
function resolveBaseUrl(request: NextRequest): string {
  const proto =
    request.headers.get("x-forwarded-proto") ?? "https";
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "rightoffer.in";
  return `${proto}://${host}`;
}
