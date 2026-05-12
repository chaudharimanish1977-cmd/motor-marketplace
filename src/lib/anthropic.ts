/**
 * Anthropic Claude client + helper functions for Motor Marketplace.
 *
 * For the prototype we call the Anthropic API directly (US-routed). On any production
 * deploy this MUST move to AWS Bedrock Mumbai or equivalent India-region inference
 * endpoint to satisfy DPDP + IRDAI data localisation. This client is a thin wrapper
 * so the swap is a single-file change.
 *
 * Note: client is lazy-initialised so the module loads cleanly even when
 * ANTHROPIC_API_KEY is missing at build time (Next.js's "Collecting page data"
 * subprocess doesn't always propagate env vars). The actual key check happens
 * the first time we make a Claude call.
 */

import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local — see .env.example."
    );
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

// Model selection — Sonnet is the right tier for parsing + report generation
// (Haiku is too weak for nuanced gap analysis; Opus is overkill for the cost).
export const MODEL = "claude-sonnet-4-5";

export interface CallClaudeOptions {
  system: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Single-shot Claude call. Returns the assistant's text response.
 */
export async function callClaude({
  system,
  userMessage,
  maxTokens = 8192,
  temperature = 0.3,
}: CallClaudeOptions): Promise<string> {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    temperature,
    system,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }
  return textBlock.text;
}

/**
 * Extract a JSON object from a Claude response. Handles common patterns:
 *  - Response wrapped in ```json ... ``` code fence
 *  - Response wrapped in ``` ... ``` code fence (no language)
 *  - Bare JSON object
 *  - Prose containing a JSON object somewhere in the middle
 */
export function extractJSON<T = unknown>(text: string): T {
  // Try a JSON code fence first
  const codeMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeMatch) {
    try {
      return JSON.parse(codeMatch[1].trim()) as T;
    } catch {
      // Fall through
    }
  }

  // Try parsing the whole response
  try {
    return JSON.parse(text.trim()) as T;
  } catch {
    // Fall through
  }

  // Find the first/last balanced { ... } block
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1)) as T;
    } catch {
      // Fall through
    }
  }

  throw new Error(
    `Failed to extract JSON from Claude response. First 300 chars: ${text.slice(0, 300)}...`
  );
}
