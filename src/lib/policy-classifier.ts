/**
 * Pre-flight document classifier for /api/parse.
 *
 * Before running the expensive full-extraction call on every upload, we run
 * a cheap fast classification (Claude Haiku) on the first ~2000 chars of the
 * PDF text to decide whether the document is the kind we can actually
 * service — a private-car motor insurance policy.
 *
 * Non-private-car documents (two-wheelers, commercial vehicles, health
 * policies, random PDFs) are rejected up-front with a category we can map
 * to a friendly GenZ error in the API response.
 *
 * Cost: ~₹0.30 per call (Haiku is ~50x cheaper than Sonnet).
 * Latency: ~1-2 seconds.
 */

import Anthropic from "@anthropic-ai/sdk";
import { extractJSON } from "@/lib/anthropic";

const CLASSIFIER_MODEL = "claude-haiku-4-5-20251001";

export type PolicyCategory =
  | "private-car"
  | "two-wheeler"
  | "commercial-vehicle"
  | "non-motor"
  | "not-a-policy"
  | "unknown";

export type DocumentType = "policy" | "quote";

export interface ClassificationResult {
  category: PolicyCategory;
  /**
   * Distinguishes a bound policy from a not-yet-bound quote / renewal
   * notice. Orthogonal to `category` (both policies and quotes can be
   * "private-car"). Defaults to "policy" if the classifier can't tell.
   */
  documentType: DocumentType;
  confidence: "high" | "medium" | "low";
  vehicleClass?: string;
  reasoning: string;
}

const SYSTEM_PROMPT = `You classify Indian insurance policy documents on TWO axes.

Analyse the document text and respond with JSON only — no markdown, no commentary, no code fences:

{
  "category": "private-car" | "two-wheeler" | "commercial-vehicle" | "non-motor" | "not-a-policy" | "unknown",
  "documentType": "policy" | "quote",
  "confidence": "high" | "medium" | "low",
  "vehicleClass": "<short label if motor — e.g. 'Hatchback', 'Sedan', 'SUV', 'Scooter', 'Goods Carrier'>",
  "reasoning": "<one short sentence covering BOTH axes>"
}

Axis 1 — category (what kind of insurance):
- private-car: Private passenger car (sedan, hatchback, SUV, MPV, station wagon) for personal use. Must NOT be commercial/taxi/cab.
- two-wheeler: Motorcycle, scooter, moped, or any 2-wheeled motor vehicle.
- commercial-vehicle: Goods carrier (truck, tempo), taxi/cab, autorickshaw, bus, or any vehicle used for hire/reward/goods carriage.
- non-motor: Health, life, property, travel, marine, fire, or any non-vehicle insurance.
- not-a-policy: PDF is not an insurance document at all (receipt, invoice, ID card, marketing PDF, etc.).
- unknown: Genuinely cannot determine.

Axis 2 — documentType (is it a bound policy, or just a quote/notice):
- policy: A bound, in-force or expired insurance policy. The customer has paid and the contract is live (or was live). Signals:
    "Certificate of Insurance" / "Policy Schedule" / "Policy Document"
    A real policy number (e.g. "Policy No: 25001234..." — not "Quote No" / "Proposal No")
    "Period of Insurance" / "Policy Period" with definite past or current dates
    Insurer signature block / regulatory cert (IRDAI registration etc.)
    "Stamp Duty Paid" / "Premium Received"
- quote: A pre-purchase quotation, renewal notice, or proposal — coverage NOT yet bound. Signals:
    "Renewal Notice" / "Renewal Quotation" / "Quotation" / "Quote" / "Proposal" in the header
    "Quote No" / "Proposal No" instead of policy number
    "Proposed Premium" / "Premium Payable" / "Pay to renew" / "Renew Now"
    Validity dates ("Quote valid till") rather than an active coverage period
    Absence of "Premium Received" / "Stamp Duty Paid"

Default to "policy" if signals are ambiguous (most uploads ARE policies; false-quote misclassification hurts more than false-policy).

Be decisive on category. Default to "unknown" only when category is truly ambiguous.`;

export async function classifyPolicy(
  text: string
): Promise<ClassificationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // If we can't classify, fall through optimistically (don't block users
    // on infra problems). The downstream extractor will catch garbage too.
    return {
      category: "unknown",
      documentType: "policy",
      confidence: "low",
      reasoning: "Classifier unavailable",
    };
  }

  const client = new Anthropic({ apiKey });
  // Send the first ~2000 chars — that's enough to see insurer name, policy
  // type, and vehicle details. Saves cost vs sending the whole document.
  const snippet = text.slice(0, 2000);

  try {
    const response = await client.messages.create({
      model: CLASSIFIER_MODEL,
      max_tokens: 400,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Document text (first 2000 characters):\n\n---\n${snippet}\n---`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Classifier returned no text");
    }
    const parsed = extractJSON<ClassificationResult>(textBlock.text);
    return {
      category: parsed.category ?? "unknown",
      // Default to "policy" if the model didn't emit the field. Safer
      // default — most uploads are policies, and a false-quote tag would
      // remove the doc from the Active section incorrectly.
      documentType: parsed.documentType === "quote" ? "quote" : "policy",
      confidence: parsed.confidence ?? "low",
      vehicleClass: parsed.vehicleClass,
      reasoning: parsed.reasoning ?? "",
    };
  } catch (err) {
    console.error("[classifyPolicy] Failed:", err);
    return {
      category: "unknown",
      documentType: "policy",
      confidence: "low",
      reasoning:
        err instanceof Error ? err.message : "Classifier call failed",
    };
  }
}

/**
 * Map a non-private-car classification to a friendly error response.
 * Returns null if the category IS private-car (proceed with parse).
 */
export function rejectionMessage(
  category: PolicyCategory
): { headline: string; body: string } | null {
  switch (category) {
    case "private-car":
      return null;
    case "two-wheeler":
      return {
        headline: "Connection snapped 🛵",
        body: "This looks like a two-wheeler policy. We only do private cars right now. Bring back a four-wheeler and we'll vibe.",
      };
    case "commercial-vehicle":
      return {
        headline: "Connection snapped 🚚",
        body: "That's a commercial vehicle policy. We only do private cars at the moment. Got a car policy? Drop it in.",
      };
    case "non-motor":
      return {
        headline: "Wrong universe 🌌",
        body: "This is a non-motor policy (health / life / property — different beast). We only do motor private car for now. Cars only, please.",
      };
    case "not-a-policy":
      return {
        headline: "We can't read this 🫠",
        body: "Doesn't look like an insurance policy at all — could be a receipt, ID, or random doc. Pull the original PDF from your insurer's app or email and try again.",
      };
    case "unknown":
    default:
      return {
        headline: "Couldn't tell what this is 🤔",
        body: "We couldn't figure out if this is a private car policy. If it is, the original insurer-issued PDF works best (not a screenshot or scan). If it isn't, we only do private car right now.",
      };
  }
}
