/**
 * Translation runtime — calls Google Cloud Translation API v2 (REST)
 * with in-memory caching so we don't re-translate identical strings
 * across requests within a single warm Vercel function instance.
 *
 * This file is server-only because it uses node:crypto. Client
 * components should import locale types/constants from `./locales`
 * instead (we re-export them here for ergonomic server use).
 *
 * Design notes:
 *
 *   · We send batches (one fetch per locale, all strings together) so
 *     Google bills per character once, not once per string.
 *
 *   · Cache lives in a module-level Map keyed by sha1(text) + locale.
 *     Cold starts re-translate, but Translation API is cheap (~$20/M
 *     chars, with 500k free/mo for the first year) and our hot text
 *     is ~1-2k chars total, so even worst case (every cold start
 *     re-translates everything) keeps us well inside free tier.
 *
 *   · When GOOGLE_TRANSLATE_API_KEY is unset, all calls fall back to
 *     the source English text. This lets local dev work without the
 *     key, and a misconfigured production deploy degrades gracefully
 *     instead of erroring.
 *
 *   · `format: "text"` (not "html") because we want plain prose
 *     translated cleanly. Italic / accent styling is applied around
 *     translated phrases on the page side, not inside Translation.
 */

// This module is server-only — uses node:crypto. Client components
// should import locale constants/types from `./locales` instead.
import crypto from "node:crypto";
import type { Locale } from "./locales";

// Re-export so server-side callers get one tidy import.
export type { Locale, LocaleOption } from "./locales";
export {
  LOCALE_OPTIONS,
  DEFAULT_LOCALE,
  isLocale,
  getLocaleOption,
} from "./locales";

/* ─── Cache ───────────────────────────────────────────────────────────── */

const memoryCache = new Map<string, string>();

function cacheKey(text: string, locale: Locale): string {
  const hash = crypto.createHash("sha1").update(text).digest("hex").slice(0, 12);
  return `${locale}:${hash}`;
}

/* ─── Google Translate REST call ──────────────────────────────────────── */

interface GoogleTranslateResponse {
  data?: {
    translations?: { translatedText: string }[];
  };
  error?: { message?: string };
}

async function callGoogle(
  texts: string[],
  locale: Locale
): Promise<string[]> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    // Local dev without a key, or env not set in prod. Soft-fail to
    // English — better than throwing on a marketing surface.
    return texts;
  }
  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: texts,
        target: locale,
        source: "en",
        format: "text",
      }),
      // Keep the request fast — if Translation API is slow, English
      // fallback is better than blocking the page render.
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      console.error(
        `[translate] Google API ${res.status}: ${await res.text().catch(() => "")}`
      );
      return texts;
    }
    const data = (await res.json()) as GoogleTranslateResponse;
    const translations = data.data?.translations ?? [];
    if (translations.length !== texts.length) {
      console.error(
        `[translate] Mismatched response length: got ${translations.length}, expected ${texts.length}`
      );
      return texts;
    }
    return translations.map((t, i) => t.translatedText ?? texts[i]);
  } catch (err) {
    console.error("[translate] Network or timeout error:", err);
    return texts;
  }
}

/* ─── Public API ──────────────────────────────────────────────────────── */

/**
 * Translate a single string. English passes through unchanged. Other
 * locales hit the cache first; on miss, the call is batched as a
 * one-element request.
 */
export async function translate(
  text: string,
  locale: Locale
): Promise<string> {
  if (locale === "en" || !text.trim()) return text;
  const key = cacheKey(text, locale);
  const cached = memoryCache.get(key);
  if (cached !== undefined) return cached;
  const [translated] = await callGoogle([text], locale);
  memoryCache.set(key, translated);
  return translated;
}

/**
 * Translate a record of strings in one batched API call. Returns the
 * same record shape with translated values. Cache-aware: only the
 * uncached keys are sent to Google; cached entries return immediately.
 */
export async function translateMany<T extends Record<string, string>>(
  texts: T,
  locale: Locale
): Promise<T> {
  if (locale === "en") return texts;

  const out = {} as Record<string, string>;
  const missingKeys: string[] = [];
  const missingTexts: string[] = [];

  for (const [k, v] of Object.entries(texts)) {
    if (!v.trim()) {
      out[k] = v;
      continue;
    }
    const ck = cacheKey(v, locale);
    const cached = memoryCache.get(ck);
    if (cached !== undefined) {
      out[k] = cached;
    } else {
      missingKeys.push(k);
      missingTexts.push(v);
    }
  }

  if (missingTexts.length > 0) {
    const translated = await callGoogle(missingTexts, locale);
    for (let i = 0; i < missingKeys.length; i++) {
      const key = missingKeys[i];
      const value = translated[i];
      out[key] = value;
      memoryCache.set(cacheKey(missingTexts[i], locale), value);
    }
  }

  return out as T;
}
