"use server";

/**
 * Server action invoked by the LanguageSwitcher when the visitor picks
 * a language. Writes the cookie that getCurrentLocale() will read on
 * the next request, then triggers a revalidation so server-rendered
 * pages re-fetch with the new locale.
 */

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE } from "@/lib/locale";
import { isLocale } from "@/lib/locales";

export async function setLocaleAction(localeRaw: string) {
  if (!isLocale(localeRaw)) {
    // Silently ignore unknown locales — the switcher only ever sends
    // valid ones, so this is purely defensive.
    return;
  }
  const store = await cookies();
  store.set(LOCALE_COOKIE, localeRaw, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // one year
    sameSite: "lax",
    // We don't mark httpOnly so client code can read it for UI hints
    // (e.g. dropdown highlights the active language without a round-trip).
  });
  // Re-render every Server Component on the current and adjacent
  // routes so the new locale takes effect immediately.
  revalidatePath("/", "layout");
}
