/**
 * Locale resolver — reads the visitor's chosen locale from a cookie.
 *
 * The language switcher writes to this cookie via a server action
 * (see src/app/actions/set-locale.ts). Server Components read it via
 * `getCurrentLocale()` and pass the resolved locale to the translation
 * layer. The cookie is the single source of truth — no URL prefixes,
 * no client-side state, no flash-of-wrong-language during navigation.
 *
 * Default behaviour:
 *   · No cookie → English.
 *   · Invalid cookie value → English (we don't crash; we degrade).
 *
 * The cookie name is "ro-lang" (one-year max-age) so it survives
 * across browser restarts but is scoped to this property.
 */

import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./locales";

export const LOCALE_COOKIE = "ro-lang";

/**
 * Resolve the visitor's current locale from the cookie. Falls back to
 * the default locale (English) when the cookie is missing or invalid.
 *
 * Server Components / Route Handlers / Server Actions can call this
 * freely — it just reads cookies(), no I/O.
 */
export async function getCurrentLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(value)) return value;
  return DEFAULT_LOCALE;
}
