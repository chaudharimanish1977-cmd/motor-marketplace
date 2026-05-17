/**
 * NextAuth.js dynamic route handler.
 *
 * Mounts at /api/auth/* — all OAuth flows (signin, callback, session,
 * csrf, signout) are handled here. The provider configs + signIn
 * bridge live in `@/lib/auth-config`.
 *
 * The route name `[...nextauth]` is mandatory — NextAuth expects this
 * exact catch-all pattern. The redirect URIs registered in Google
 * Cloud Console + Apple Developer use this path:
 *   · http://localhost:3000/api/auth/callback/google
 *   · https://rightoffer.in/api/auth/callback/google
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-config";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
