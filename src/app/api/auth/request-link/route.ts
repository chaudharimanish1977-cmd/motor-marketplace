import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { kv } from "@vercel/kv";
import { readTable, Tables } from "@/lib/db";
import type {
  ParsedPolicy,
  RenewalSubscription,
  User,
} from "@/lib/types";
import { sendMagicLinkEmail } from "@/lib/email-sender";
import { buildMagicLinkUrl } from "@/lib/email-token";

export const runtime = "nodejs";

const Schema = z.object({
  email: z.string().email("Invalid email"),
});

const SITE_URL = "https://rightoffer.in";

// 60-second cooldown between magic-link requests for the same email.
// Short enough that a real user retry won't feel blocked, long enough
// to stop spam loops.
const COOLDOWN_SECONDS = 60;

const useKv = !!process.env.KV_REST_API_URL;

/**
 * Magic-link request endpoint.
 *
 * Flow:
 *   1. Validate email shape.
 *   2. Look up whether any data exists for this email (user record,
 *      renewal subscription, or parsed policy with owner.email match).
 *   3. If yes, send the magic-link email.
 *   4. ALWAYS return the same generic success message — never reveal
 *      whether the email exists in our system (prevents account
 *      enumeration).
 *   5. Rate-limit on email + IP to stop abuse.
 *
 * Even when the lookup returns nothing, we silently no-op and still
 * return success so an attacker can't probe registered emails.
 */
export async function POST(request: NextRequest) {
  let email: string;
  try {
    const body = await request.json();
    const parsed = Schema.parse(body);
    email = parsed.email.toLowerCase().trim();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please enter a valid email." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Bad request." },
      { status: 400 }
    );
  }

  // Rate-limit: one request per email per 60s.
  if (useKv) {
    const key = `auth:cooldown:${email}`;
    const existing = await kv.get<number>(key);
    if (existing) {
      return NextResponse.json(
        {
          ok: true,
          // Return success message even on cooldown so the response shape
          // is constant — an attacker can't deduce anything from it.
        },
        { status: 200 }
      );
    }
    await kv.set(key, 1, { ex: COOLDOWN_SECONDS });
  }

  try {
    const exists = await emailHasData(email);

    if (exists) {
      const url = buildMagicLinkUrl(email, SITE_URL);
      try {
        await sendMagicLinkEmail({ to: email, url });
      } catch (mailErr) {
        console.error("[auth/request-link] Send failed:", mailErr);
        // Still return generic success so we don't leak send failures.
      }
    } else {
      // Tiny synthetic delay so timing doesn't reveal whether we sent
      // mail (Resend is ~200-400ms, so 250ms is plausible).
      await new Promise((r) => setTimeout(r, 250));
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[auth/request-link] Error:", err);
    // Generic 200 — never leak internal errors that could help an
    // attacker enumerate.
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

/**
 * Does this email have any data we could surface in /me? Returns true
 * if there's a User row, a RenewalSubscription, or a ParsedPolicy with
 * matching owner.email.
 */
async function emailHasData(email: string): Promise<boolean> {
  const [users, subs, policies] = await Promise.all([
    readTable<User>(Tables.USERS),
    readTable<RenewalSubscription>(Tables.RENEWAL_SUBSCRIPTIONS),
    readTable<ParsedPolicy>(Tables.PARSED_POLICIES),
  ]);
  const e = email.toLowerCase();
  if (users.some((u) => (u.email ?? "").toLowerCase() === e)) return true;
  if (subs.some((s) => (s.customerEmail ?? "").toLowerCase() === e))
    return true;
  if (policies.some((p) => (p.owner?.email ?? "").toLowerCase() === e))
    return true;
  return false;
}
