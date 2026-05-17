import { NextRequest, NextResponse } from "next/server";
import { findById, Tables } from "@/lib/db";
import type { ParsedPolicy } from "@/lib/types";
import { renderReportPdf } from "@/lib/pdf-renderer";
import { getSession } from "@/lib/session";
import { getUploadSession } from "@/lib/upload-session";

/**
 * GET /api/report-pdf/[id]  — on-demand PDF render for the
 * "Save my report" button on /report/[id] (Phase 7d.1).
 *
 * Uses the existing pdf-renderer (puppeteer + @sparticuz/chromium) which
 * loads /report/[id]?print=1 in a headless browser and prints to A4. The
 * PDF mirrors the on-screen report exactly — no parallel template to
 * maintain. Same render path the email pipeline uses.
 *
 * Gate model: requires either a full magic-link / OAuth session OR an
 * upload-session that owns this doc. Anonymous URL visitors can't
 * bypass the report gate by hitting this route directly.
 *
 * Returns the PDF as an inline `application/pdf` download with a
 * Content-Disposition: attachment header so browsers save it rather
 * than render it. The filename includes the vehicle for findability
 * in the customer's downloads folder.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing report id" }, { status: 400 });
  }

  const parsedPolicy = await findById<ParsedPolicy>(
    Tables.PARSED_POLICIES,
    id
  );
  if (!parsedPolicy) {
    return NextResponse.json(
      { error: "Report not found" },
      { status: 404 }
    );
  }

  // Auth gate — any verified session (full magic-link / OAuth OR
  // upload-session that owns this doc) can save the PDF. We deliberately
  // mirror /report/[id]'s gating exactly rather than tightening here:
  // if you can VIEW the report on-screen, you can save the same content
  // as a PDF. Tightening to a strict email match locks out the common
  // legitimate path (open report on phone via the magic-link email
  // where the device has the session cookie but the parsed policy's
  // owner.email field is empty or differently-cased).
  const [fullSessionEmail, uploadSession] = await Promise.all([
    getSession(),
    getUploadSession(),
  ]);
  const fullSessionOk = !!fullSessionEmail;
  const uploadSessionOk =
    !!uploadSession && uploadSession.docs.includes(id);
  if (!fullSessionOk && !uploadSessionOk) {
    return NextResponse.json(
      {
        error:
          "Not signed in. Open the report from the email we sent you, or sign in via /me/login.",
      },
      { status: 401 }
    );
  }

  // Pass through the driving-profile chip query params so the PDF
  // matches what the customer saw on-screen (the audit personalisation
  // is signal-dependent — same surface, same chips).
  const sp = request.nextUrl.searchParams;
  const query: Record<string, string | undefined> = {
    km: sp.get("km") ?? undefined,
    drv: sp.get("drv") ?? undefined,
    oc: sp.get("oc") ?? undefined,
    pri: sp.get("pri") ?? undefined,
    pc: sp.get("pc") ?? undefined,
  };

  const baseUrl = resolveBaseUrl(request);
  let pdf: Buffer;
  try {
    pdf = await renderReportPdf({ reportId: id, baseUrl, query });
  } catch (err) {
    console.error("[report-pdf] render failed", err);
    return NextResponse.json(
      {
        error:
          "Couldn't generate the PDF. Try again in a moment, or email us at hello@rightoffer.in.",
      },
      { status: 500 }
    );
  }

  const vehicleLabel = `${parsedPolicy.vehicle.make}-${parsedPolicy.vehicle.model}`
    .replace(/[^a-z0-9-]/gi, "_")
    .toLowerCase();
  const filename = `rightoffer-${vehicleLabel || "report"}-${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}

/**
 * Use the request's own origin so puppeteer can fetch the live deployment.
 * Honours x-forwarded-host (Vercel injects this) and falls back to the
 * configured public site URL.
 */
function resolveBaseUrl(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "rightoffer.in";
  return `${proto}://${host}`;
}
