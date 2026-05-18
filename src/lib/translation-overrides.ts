/**
 * Manual translation overrides — the human-written corrections that
 * sit IN FRONT of Google Cloud Translation.
 *
 * ## Why this file exists
 *
 * Machine translation does ~80% of the job well, but on editorial
 * copy (the editorial voice — italic accents, plain-English idioms,
 * "we help you decide", "trusted by 1,000+ Indian car owners") it
 * often produces stilted, awkward, or just-plain-wrong renderings.
 * Bad translation in an insurance product is worse than no translation.
 *
 * The lookup order in src/lib/translate.ts is:
 *
 *    1. Override (this file)  ← human-curated, ships in the bundle
 *    2. In-memory cache       ← per-instance memo of Google results
 *    3. Google Translate API  ← machine fallback for everything else
 *
 * Anything you put here ships immediately on the next deploy and is
 * preferred over whatever Google would return.
 *
 * ## How to add or fix a translation
 *
 *   1. Visit rightoffer.in in the target language
 *   2. Find the awkward line — note the EXACT English source string
 *      (capitalisation, punctuation, and trailing period all matter:
 *      they have to match `translateMany`'s input verbatim)
 *   3. Open this file, find the locale block, add:
 *
 *        "Original English string": "आपका सही अनुवाद",
 *
 *   4. Commit, push to main, wait for Vercel to deploy.
 *   5. Hard-refresh (Ctrl+Shift+R) the language on rightoffer.in to
 *      bust any browser cache.
 *
 * The keys MUST match the English source EXACTLY. If the source string
 * later changes (e.g. we rewrite the headline), the old override stops
 * matching and Google takes over again — no orphan keys to clean up.
 *
 * ## Tone guidance per language
 *
 *   · Hindi: respectful "आप" form, conversational not formal, mix
 *     Devanagari with comfortable English loanwords where natural
 *     ("insurance", "policy", "premium" are widely used in
 *     transliterated Hindi).
 *   · Tamil, Telugu, Kannada, Marathi, Bengali: same principle — keep
 *     it conversational, native-script-first, English loanwords for
 *     industry terms where natural.
 */

import type { Locale } from "./locales";

type OverrideMap = Record<string, string>;

/**
 * Per-locale overrides. Keys are the source English strings; values
 * are the preferred translation in that language.
 *
 * English entries should always be empty — `translate()` short-circuits
 * for `en` and never consults this file.
 *
 * Add overrides incrementally — you don't need to fill every entry,
 * just the ones that read badly in the wild.
 */
export const TRANSLATION_OVERRIDES: Record<Locale, OverrideMap> = {
  en: {},
  hi: {
    // Headline — user-curated.
    "Understand your": "समझें अपने",

    // The second half ("insurance before it costs you.") is awaiting
    // a clean rewrite — Google's verbatim output included an awkward
    // phrase ("करवाने से पहले ही बीमा करवा लें") that the user wants
    // removed. Surgical override pending: needs the exact rest of
    // Google's current Hindi rendering pasted in so we can keep what
    // works and drop only the awkward phrase.
    // "insurance before it costs you.": "<pending>",

    // Below — examples to uncomment + edit as you spot bad
    // translations on rightoffer.in:
    //
    // "Most people sell insurance.":
    //   "ज़्यादातर लोग इंश्योरेंस बेचते हैं।",
    // "We help you decide.":
    //   "हम आपको सही चुनाव में मदद करते हैं।",
    // "I want to pay less":
    //   "मैं कम प्रीमियम चाहता हूँ",
    // "I want to worry less":
    //   "मैं निश्चिंत रहना चाहता हूँ",
    // "Get my free 2-minute review":
    //   "मेरी मुफ़्त 2-मिनट की समीक्षा प्राप्त करें",
    // "Trusted by 1,000+ Indian car owners":
    //   "1,000 से ज़्यादा भारतीय कार मालिकों का भरोसा",
    // "or see a sample review":
    //   "या एक नमूना समीक्षा देखें",
    // "Sign in": "लॉग इन",
    // "My policies": "मेरी पॉलिसी",
  },
  ta: {},
  te: {},
  mr: {},
  bn: {},
  kn: {},
};

/**
 * Look up an override for a given source string + locale. Returns
 * `undefined` if no override exists — caller should fall back to the
 * in-memory cache + Google API path.
 */
export function getOverride(
  text: string,
  locale: Locale
): string | undefined {
  if (locale === "en") return undefined;
  return TRANSLATION_OVERRIDES[locale]?.[text];
}
