import { NextRequest, NextResponse } from "next/server";
import { extractPdfText } from "@/lib/pdf-parser";
import { extractPreview } from "@/lib/parse-preview";

export const runtime = "nodejs";
export const maxDuration = 15;

/**
 * Fast preview endpoint — extracts basic vehicle info (make/model/plate/RTO/year)
 * via regex on the PDF text. Used to personalise the parsing-wait animation
 * while the slower full LLM-based /api/parse runs sequentially.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { text, numPages } = await extractPdfText(buffer);

    if (!text || text.length < 200) {
      return NextResponse.json(
        { preview: null, numPages },
        { status: 200 }
      );
    }

    const preview = extractPreview(text);
    return NextResponse.json({ preview, numPages });
  } catch (err) {
    console.error("[parse-preview] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Unknown error during preview",
      },
      { status: 500 }
    );
  }
}
