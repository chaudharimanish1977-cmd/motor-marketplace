import { NextRequest, NextResponse } from "next/server";
import { extractPdfText } from "@/lib/pdf-parser";
import { extractPolicyFromText } from "@/lib/policy-extractor";
import { appendRow, updateById, Tables } from "@/lib/db";
import { storePolicyPdf } from "@/lib/blob-store";
import type { ParsedPolicy } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60; // Claude calls can take 30+ seconds total

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

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 10 MB)" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { text, numPages } = await extractPdfText(buffer);

    if (!text || text.length < 200) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from this PDF. It may be a scanned image — try uploading a digitally-issued policy PDF instead.",
        },
        { status: 400 }
      );
    }

    // Structured extraction only — report generation is deferred to the
    // /report/[id] page render. Doing both here exceeded Vercel's 60s function
    // timeout when running from a Mumbai region against Anthropic in US-East
    // (cross-continent latency on two sequential Claude calls).
    console.log(
      `[parse] PDF parsed: ${numPages} pages, ${text.length} chars. Calling Claude for extraction...`
    );
    const extractStart = Date.now();
    const parsed = await extractPolicyFromText(text);
    console.log(
      `[parse] Extraction completed in ${Date.now() - extractStart}ms. Confidence: ${parsed.parseConfidence}`
    );
    const savedPolicy = await appendRow<ParsedPolicy>(
      Tables.PARSED_POLICIES,
      parsed
    );

    // Persist the original uploaded PDF to Blob, then back-fill the URL on
    // the parsed policy record. Failures here don't fail the parse — the
    // customer still gets a working report, we just lose the source archive.
    try {
      const blob = await storePolicyPdf(savedPolicy.id, buffer);
      await updateById<ParsedPolicy>(
        Tables.PARSED_POLICIES,
        savedPolicy.id,
        {
          uploadedPdfUrl: blob.url,
          uploadedPdfFileName: file.name,
        }
      );
      savedPolicy.uploadedPdfUrl = blob.url;
      savedPolicy.uploadedPdfFileName = file.name;
      console.log(`[parse] Uploaded policy PDF to ${blob.url}`);
    } catch (uploadErr) {
      console.error(
        `[parse] Policy PDF upload failed (parse still saved):`,
        uploadErr
      );
    }

    return NextResponse.json({ id: savedPolicy.id, parsed: savedPolicy });
  } catch (err) {
    console.error("[parse] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Unknown error during parsing",
      },
      { status: 500 }
    );
  }
}
