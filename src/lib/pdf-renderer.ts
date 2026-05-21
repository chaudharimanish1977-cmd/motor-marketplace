/**
 * Server-side PDF renderer for the policy review report.
 *
 * Uses @sparticuz/chromium (a stripped-down Chromium binary built for AWS
 * Lambda / Vercel functions) + puppeteer-core to load the live report page
 * and print it to PDF. The PDF mirrors the on-screen report exactly because
 * it's the same HTML/CSS — no parallel template to maintain.
 *
 * The render targets `report/[id]?print=1` so ReportDisplay can hide
 * interactive chrome (Simplify toggle, download CTA, watermark) for a clean
 * print layout. Customer-only report-protected CSS uses media:screen rules,
 * so we explicitly emulate "screen" media so the content stays visible.
 */

import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

interface RenderOptions {
  reportId: string;
  baseUrl: string;
  /** Pass-through query params (e.g. driving-profile chips, demo mode) */
  query?: Record<string, string | undefined>;
}

export async function renderReportPdf({
  reportId,
  baseUrl,
  query,
}: RenderOptions): Promise<Buffer> {
  const params = new URLSearchParams({ print: "1" });
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v) params.set(k, v);
  }
  const url = `${baseUrl.replace(/\/$/, "")}/report/${reportId}?${params}`;
  return renderUrlToPdf(url, 45_000);
}

interface RenderReportsOptions {
  /** Explicit doc-ID list, joined into the `?docs=` query param. */
  docIds: string[];
  baseUrl: string;
}

/**
 * Render the MULTI-doc /reports page to PDF. Used by the email-forward
 * reply when 2+ docs are forwarded — one master PDF carries the
 * comparator table + per-feature insights + annexures, replacing the
 * per-doc N-attachment pattern.
 *
 * Doc list is passed via `?docs=id,id,id` since the headless browser
 * has no session cookie to discover docs through.
 *
 * Longer timeout than single-doc render — /reports has more content
 * (annexures expand all per-doc reports inline).
 */
export async function renderReportsPdf({
  docIds,
  baseUrl,
}: RenderReportsOptions): Promise<Buffer> {
  const params = new URLSearchParams({
    print: "1",
    docs: docIds.join(","),
  });
  const url = `${baseUrl.replace(/\/$/, "")}/reports?${params}`;
  return renderUrlToPdf(url, 90_000);
}

async function renderUrlToPdf(
  url: string,
  navigationTimeoutMs: number
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 1800, deviceScaleFactor: 1 },
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    // Treat the report-protected CSS @print rules as inactive — we still
    // want the full content to render to PDF; the rules only exist to make
    // a user's manual Ctrl+P attempt produce a "get the report by email"
    // splash instead of leaking the report.
    await page.emulateMediaType("screen");
    await page.goto(url, { waitUntil: "networkidle0", timeout: navigationTimeoutMs });

    // Render-time safety: wait a tick so client components (CoverageScore
    // animation, etc.) settle before the snapshot.
    await new Promise((r) => setTimeout(r, 500));

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "10mm", bottom: "12mm", left: "10mm" },
      preferCSSPageSize: false,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
