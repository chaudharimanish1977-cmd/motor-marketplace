import { ThankYouFlow } from "@/components/thank-you-flow";
import { findById, Tables } from "@/lib/db";
import type { ParsedPolicy } from "@/lib/types";

export const metadata = {
  title: "Thank you — RightOffer",
};

interface PageProps {
  searchParams: Promise<{ e?: string; m?: string; p?: string }>;
}

export default async function ThankYouPage({ searchParams }: PageProps) {
  const { e, m, p } = await searchParams;

  // If we have the policy ID, fetch its expiry so the opt-in card can show
  // the actual renewal date (e.g. "15 Feb 2027") in the copy.
  let policyExpiryDate: string | undefined;
  if (p) {
    const policy = await findById<ParsedPolicy>(Tables.PARSED_POLICIES, p);
    policyExpiryDate = policy?.odPeriodEnd;
  }

  return (
    <ThankYouFlow
      email={e ?? ""}
      mobile={m ?? ""}
      parsedPolicyId={p ?? ""}
      policyExpiryDate={policyExpiryDate}
    />
  );
}
