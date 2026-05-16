/**
 * Locale constants + types — split out from translate.ts so client
 * components can import the option list / Locale type without dragging
 * in the server-only translation runtime (which uses node:crypto).
 *
 * Translate.ts re-exports everything here for ergonomic server use.
 */

const LOCALES = ["en", "hi", "ta", "te", "mr", "bn", "kn"] as const;
export type Locale = (typeof LOCALES)[number];

export interface LocaleOption {
  /** ISO code used by Google Translate + our cookie. */
  code: Locale;
  /** The language name in its own script — the dropdown shows this. */
  native: string;
  /** The language name in English — used as a hover/tooltip alt. */
  english: string;
}

export const LOCALE_OPTIONS: LocaleOption[] = [
  { code: "en", native: "English", english: "English" },
  { code: "hi", native: "हिंदी", english: "Hindi" },
  { code: "ta", native: "தமிழ்", english: "Tamil" },
  { code: "te", native: "తెలుగు", english: "Telugu" },
  { code: "mr", native: "मराठी", english: "Marathi" },
  { code: "bn", native: "বাংলা", english: "Bengali" },
  { code: "kn", native: "ಕನ್ನಡ", english: "Kannada" },
];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (LOCALES as readonly string[]).includes(value)
  );
}

export function getLocaleOption(code: Locale): LocaleOption {
  return LOCALE_OPTIONS.find((o) => o.code === code) ?? LOCALE_OPTIONS[0];
}
