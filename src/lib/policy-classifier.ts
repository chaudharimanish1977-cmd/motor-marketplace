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

export interface ClassificationResult {
  category: PolicyCategory;
  confidence: "high" | "medium" | "low";
  vehicleClass?: string;
  reasoning: string;
}

const SYSTEM_PROMPT = `You classify Indian insurance policy documents.

Analyse the document text and respond with JSON only — no markdown, no commentary, no code fences:

{
  "category": "private-car" | "two-wheeler" | "commercial-vehicle" | "non-motor" | "not-a-policy" | "unknown",
  "confidence": "high" | "medium" | "low",
  "vehicleClass": "<short label if motor — e.g. 'Hatchback', 'Sedan', 'SUV', 'Scooter', 'Goods Carrier'>",
  "reasoning": "<one short sentence>"
}

Definitions:
- private-car: Private passenger car (sedan, hatchback, SUV, MPV, station wagon) for personal use. Must NOT be commercial/taxi/cab.
- two-wheeler: Motorcycle, scooter, moped, or any 2-wheeled motor vehicle.
- commercial-vehicle: Goods carrier (truck, tempo), taxi/cab, autorickshaw, bus, or any vehicle used for hire/reward/goods carriage.
- non-motor: Health, life, property, travel, marine, fire, or any non-vehicle insurance.
- not-a-policy: PDF is not an insurance document at all (could be a receipt, invoice, ID card, marketing PDF, etc.).
- unknown: Genuinely cannot determine from the text.

Watch for these signals:
- "Private Car" / "Pvt Car" / "Passenger Car" in policy type → private-car
- "Two Wheeler" / "Scooter" / "Motorcycle" in policy type → two-wheeler
- "Commercial Vehicle" / "GCV" / "PCV" / "Taxi" / "Cab" / "Auto Rickshaw" / "Goods Carrying" / "Passenger Carrying" in policy type → commercial-vehicle
- "Health" / "Mediclaim" / "Hospital" / "Critical Illness" / "Life" / "Term" / "Property" / "Home" → non-motor
- No insurer name, no policy number, no premium → likely not-a-policy

Be decisive. Default to "unknown" only when truly ambiguous.`;

export async function classifyPolicy(
  text: string
): Promise<ClassificationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // If we can't classify, fall through optimistically (don't block users
    // on infra problems). The downstream extractor will catch garbage too.
    return {
      category: "unknown",
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
      confidence: parsed.confidence ?? "low",
      vehicleClass: parsed.vehicleClass,
      reasoning: parsed.reasoning ?? "",
    };
  } catch (err) {
    console.error("[classifyPolicy] Failed:", err);
    return {
      category: "unknown",
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
