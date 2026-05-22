/**
 * Anthropic Claude client + helper functions for RightOffer.
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
 *
 * Retries on 429 (rate limit) and 529 (overloaded) with exponential
 * backoff capped at 3 attempts total. Every retry is logged so we can
 * spot the trend if inbound forward concurrency starts colliding with
 * our tier limit. The Anthropic SDK already handles some transient
 * errors internally; the explicit handling here is for the burst
 * pattern from parallelised multi-doc forwards (3 docs × ~2 LLM calls
 * each in one wall-clock window).
 */
const RETRY_STATUSES = new Set([429, 529]);
const MAX_ATTEMPTS = 3;

export async function callClaude({
  system,
  userMessage,
  maxTokens = 8192,
  temperature = 0.3,
}: CallClaudeOptions): Promise<string> {
  const client = getClient();
  let attempt = 0;
  let lastErr: unknown;
  while (attempt < MAX_ATTEMPTS) {
    try {
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
      if (attempt > 0) {
        console.log(
          `[anthropic] call succeeded after ${attempt + 1} attempts (retry recovered from rate limit / overload)`
        );
      }
      return textBlock.text;
    } catch (err) {
      lastErr = err;
      const status = extractStatusCode(err);
      if (status && RETRY_STATUSES.has(status) && attempt < MAX_ATTEMPTS - 1) {
        // Exponential backoff: 0.5s, 1.5s. Caps the worst-case added
        // latency at ~2s per call, which keeps the parallel fan-out
        // still inside the 2-min promise even when the first try hits
        // a rate limit.
        const delayMs = 500 * Math.pow(3, attempt);
        console.warn(
          `[anthropic] received ${status} on attempt ${attempt + 1}/${MAX_ATTEMPTS}; backing off ${delayMs}ms before retry`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        attempt += 1;
        continue;
      }
      // Non-retryable or out of retries — log and rethrow.
      if (status) {
        console.error(
          `[anthropic] call failed with status ${status} (no retry); rethrowing`,
          err
        );
      }
      throw err;
    }
  }
  // Shouldn't reach here, but TypeScript needs a terminal throw.
  throw lastErr ?? new Error("callClaude exhausted retries");
}

/** Best-effort HTTP status extraction from an SDK error. The Anthropic
 *  SDK errors expose `.status` directly; fetch-style errors expose
 *  `.response.status`. Returns undefined if neither shape matches — in
 *  which case we treat the error as non-retryable. */
function extractStatusCode(err: unknown): number | undefined {
  if (err && typeof err === "object") {
    const e = err as { status?: unknown; response?: { status?: unknown } };
    if (typeof e.status === "number") return e.status;
    if (e.response && typeof e.response.status === "number") {
      return e.response.status;
    }
  }
  return undefined;
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
