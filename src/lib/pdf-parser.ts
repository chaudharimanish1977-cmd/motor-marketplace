/**
 * Thin wrapper around pdf-parse.
 *
 * NOTE: pdf-parse's index file tries to load a test PDF at module-load time which
 * can fail in serverless / build environments. Importing the actual implementation
 * directly avoids that side-effect.
 */

// @ts-expect-error - pdf-parse doesn't ship types for the inner module path
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export interface PdfTextResult {
  text: string;
  numPages: number;
  info: Record<string, unknown>;
}

export async function extractPdfText(buffer: Buffer): Promise<PdfTextResult> {
  const data = await pdfParse(buffer);
  return {
    text: data.text,
    numPages: data.numpages,
    info: data.info ?? {},
  };
}
