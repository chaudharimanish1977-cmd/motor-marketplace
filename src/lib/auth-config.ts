/**
 * NextAuth.js (Auth.js v4) configuration — social sign-in providers
 * bridged into RightOffer's existing magic-link session model.
 *
 * Why this shape:
 *   · NextAuth handles the OAuth dance with Google + Apple (state, PKCE,
 *     token verification, signed callbacks). That's the heavy lifting
 *     we don't want to maintain.
 *   · But we DON'T want NextAuth to be the source of truth for sessions
 *     across the app — every existing route reads `ro-session` via
 *     `getSession()` from lib/session.ts. So in the `signIn` callback
 *     here we write our cookie too, and the rest of the app keeps
 *     working unchanged.
 *   · Provider profile data (name, providerUserId) is captured into
 *     the existing User table on first sign-in. Stored, not displayed —
 *     name surfacing is parked for a later phase.
 *
 * Apple Sign-In is wired but only loaded when its env vars are present.
 * The user can start with Google today and Apple lights up the day
 * APPLE_CLIENT_ID etc. land in env.
 */

import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { randomUUID } from "crypto";
import { setSession } from "@/lib/session";
import {
  Tables,
  appendRow,
  findOne,
  updateById,
} from "@/lib/db";
import type { User } from "@/lib/types";

/**
 * Extended user shape — backwards-compatible with the existing User
 * interface. Optional fields populated by OAuth sign-in, ignored by
 * the rest of the app (for now).
 */
interface UserWithProvider extends User {
  name?: string;
  authMethod?: "google" | "apple" | "magic-link";
  providerUserId?: string;
  lastSignedInAt?: string;
}

/* ─── Providers ─────────────────────────────────────────────────────── */

const providers = [];

// Google — always present once env vars are set.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Limit to basic scopes — email + profile + openid. We don't
      // need contacts / drive / anything else.
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "select_account",
        },
      },
    })
  );
}

// Apple — only loaded once env vars land. Avoids NextAuth boot errors
// while we wait on the Developer Program enrolment.
if (
  process.env.APPLE_CLIENT_ID &&
  process.env.APPLE_TEAM_ID &&
  process.env.APPLE_KEY_ID &&
  process.env.APPLE_PRIVATE_KEY
) {
  providers.push(
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: {
        appleId: process.env.APPLE_CLIENT_ID,
        teamId: process.env.APPLE_TEAM_ID,
        privateKey: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        keyId: process.env.APPLE_KEY_ID,
      } as unknown as string,
    })
  );
}

/* ─── NextAuth options ──────────────────────────────────────────────── */

export const authOptions: NextAuthOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/me/login",
    error: "/me/login",
  },
  session: {
    // We don't read NextAuth's session anywhere — our ro-session cookie
    // is the source of truth. JWT strategy keeps things simple + avoids
    // adding a NextAuth session table.
    strategy: "jwt",
  },
  callbacks: {
    /**
     * Runs on every OAuth sign-in. We:
     *   1. Upsert the User row in our DB with the provider info + name
     *   2. Write the ro-session cookie so the rest of the app sees the
     *      user as signed in via our existing session model
     *
     * Returning `true` lets NextAuth complete the sign-in; returning
     * `false` aborts it.
     */
    async signIn({ user, account }) {
      const email = user.email?.toLowerCase().trim();
      if (!email) return false;

      const providerName: "google" | "apple" | "magic-link" =
        account?.provider === "apple" ? "apple" : "google";

      // Upsert User by email
      const existing = await findOne<UserWithProvider>(
        Tables.USERS,
        (u) => (u.email ?? "").toLowerCase() === email
      );
      const nowIso = new Date().toISOString();

      if (existing) {
        // Update the provider info + last-signed-in stamp; never
        // overwrite a non-empty name with an empty one. We also
        // refresh `dpdpConsentGivenAt` because each sign-in is an
        // affirmative re-consent under the published Privacy Policy
        // — DPDP-defensible since the consent screen lives on
        // /me/login.
        await updateById<UserWithProvider>(Tables.USERS, existing.id, {
          name: user.name?.trim() || existing.name,
          authMethod: providerName,
          providerUserId:
            account?.providerAccountId ?? existing.providerUserId,
          lastSignedInAt: nowIso,
          dpdpConsentGivenAt: nowIso,
          email,
        });
      } else {
        // First-time visitor — create a User row with the provider
        // info. Mobile stays empty for now (collected later in the
        // policy upload flow if needed). `dpdpConsentGivenAt` is
        // stamped immediately since signing in via Google / Apple
        // through our consent-noticed /me/login surface is an
        // affirmative act of consent.
        const fresh: UserWithProvider = {
          id: randomUUID(),
          email,
          mobile: "",
          name: user.name?.trim() || undefined,
          authMethod: providerName,
          providerUserId: account?.providerAccountId ?? undefined,
          createdAt: nowIso,
          lastSignedInAt: nowIso,
          dpdpConsentGivenAt: nowIso,
        };
        await appendRow<UserWithProvider>(Tables.USERS, fresh);
      }

      // Bridge — write our ro-session cookie so the rest of the app
      // (getSession()) reads this user as signed in.
      await setSession(email);

      return true;
    },
    /**
     * Default redirect — after sign-in, land on /me (the policies
     * portal). NextAuth respects `callbackUrl` query param if present.
     */
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/me`;
    },
  },
};
