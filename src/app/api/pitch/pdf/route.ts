import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Renders /pitch?print=1 (the all-slides stacked view) to a 16:9 multi-page
 * PDF using headless Chromium. Each slide gets its own page courtesy of the
 * `print:break-after-page` CSS already on the slide containers.
 *
 * GET /api/pitch/pdf  →  application/pdf download
 *
 * Standard widescreen (13.333" × 7.5"), backgrounds preserved, no margins —
 * matches the on-screen view exactly. Cold start ~10s, hot ~3-5s.
 */
export async function GET(request: NextRequest) {
  const baseUrl = resolveBaseUrl(request);
  const url = `${baseUrl.replace(/\/$/, "")}/pitch?print=1`;

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 2 },
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    // Use screen media so the deck's CSS @media print rules don't kick in
    // (those are tuned to hide the report-protected content elsewhere — we
    // want the deck to render fully).
    await page.emulateMediaType("screen");
    await page.goto(url, { waitUntil: "networkidle0", timeout: 45_000 });

    // Wait for any animations / web fonts to settle before snapshot
    await page.evaluateHandle("document.fonts.ready");
    await new Promise((r) => setTimeout(r, 800));

    const pdf = await page.pdf({
      width: "13.333in",
      height: "7.5in",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: false,
    });

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="rightoffer-pitch-deck.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[pitch/pdf] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  } finally {
    await browser.close();
  }
}

function resolveBaseUrl(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "rightoffer.in";
  return `${proto}://${host}`;
}
