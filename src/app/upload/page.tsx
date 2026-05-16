import { UploadFlow } from "@/components/upload-flow";
import { findById, Tables } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getUploadSession } from "@/lib/upload-session";
import type { ParsedPolicy } from "@/lib/types";

export const metadata = {
  title: "Upload Your Policy — RightOffer",
};

export interface RenewalContext {
  fromPolicyId: string;
  vehicleLabel: string;
  registrationNumber?: string;
  rtoCity?: string;
}

interface PageProps {
  searchParams: Promise<{ demo?: string; renewal?: string }>;
}

/**
 * Upload landing. Two optional knobs:
 *   - `demo=1` keeps the investor view (downstream pages render the
 *     full pitch flow with bid CTAs).
 *   - `renewal=<parsedPolicyId>` arrives from the customer portal
 *     when a returning customer taps "Get a fresh review." We fetch
 *     that prior policy server-side and pass a tiny context down to
 *     the upload UI so the page can greet them by vehicle ("Renewing
 *     your Hyundai Verna...") instead of starting cold.
 *
 * Customer-account linking happens inside /api/parse — it reads the
 * session cookie directly and stamps the new policy's owner.email,
 * so the freshly-parsed policy appears under /me automatically with
 * no extra wiring.
 */
export default async function UploadPage({ searchParams }: PageProps) {
  const { demo, renewal } = await searchParams;
  const [renewalContext, fullSessionEmail, uploadSession] = await Promise.all([
    renewal ? loadRenewalContext(renewal) : Promise.resolve(null),
    getSession(),
    getUploadSession(),
  ]);
  // If either session type is present, the email is already known — the
  // capture form on the dropzone will skip itself. Full session wins.
  const knownEmail = fullSessionEmail ?? uploadSession?.email ?? undefined;

  return (
    <UploadFlow
      isDemo={demo === "1"}
      renewalContext={renewalContext}
      knownEmail={knownEmail}
    />
  );
}

async function loadRenewalContext(
  policyId: string
): Promise<RenewalContext | null> {
  const prior = await findById<ParsedPolicy>(Tables.PARSED_POLICIES, policyId);
  if (!prior) return null;
  return {
    fromPolicyId: prior.id,
    vehicleLabel: `${prior.vehicle.make} ${prior.vehicle.model}`.trim(),
    registrationNumber: prior.vehicle.registrationNumber || undefined,
    rtoCity: prior.owner?.city || undefined,
  };
}
