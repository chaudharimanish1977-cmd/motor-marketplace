import { UploadFlow } from "@/components/upload-flow";
import { findById, Tables } from "@/lib/db";
import type { ParsedPolicy } from "@/lib/types";
import { resolveUploadRouting } from "@/lib/upload-routing";
import { ShellFirstTime } from "@/components/upload-shells/shell-first-time";
import { ShellWelcomeBack } from "@/components/upload-shells/shell-welcome-back";
import { ShellQuotesOpen } from "@/components/upload-shells/shell-quotes-open";
import { ShellLapsed } from "@/components/upload-shells/shell-lapsed";

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
  searchParams: Promise<{
    demo?: string;
    renewal?: string;
    /** Home-page chip selection — pre-fills the MidLoadQuestions
     *  priority answer so visitors who already declared their lens on
     *  the home page don't see that question again. Round 20 chip. */
    priority?: string;
    /** Escape hatch — forces ShellFirstTime regardless of session.
     *  Used by the "Different car" / "Upload a fresh policy" buttons
     *  in the returning-customer shells. */
    fresh?: string;
  }>;
}

/**
 * Upload landing — Phase 2 of the upload-page redesign.
 *
 * Server-side flow:
 *   1. Read search params (demo / renewal / priority / fresh).
 *   2. If `?fresh=1`, bypass routing and render ShellFirstTime
 *      directly. Used by the "upload a different car" buttons.
 *   3. Otherwise call resolveUploadRouting() which reads the
 *      visitor's sessions, loads their policies, computes lifecycle
 *      state, and picks one of 5 shells.
 *   4. Render the chosen shell.
 *
 * Returning customers never see the dropzone again unless they
 * explicitly ask for it. State-aware routing replaces the
 * one-size-fits-all upload page.
 */
export default async function UploadPage({ searchParams }: PageProps) {
  const { demo, renewal, priority, fresh } = await searchParams;
  const isDemo = demo === "1";
  const renewalContext = renewal ? await loadRenewalContext(renewal) : null;
  const priorityChip = priority ?? null;

  // Escape hatch — explicit "upload fresh" intent overrides routing.
  if (fresh === "1") {
    return (
      <UploadFlow
        isDemo={isDemo}
        renewalContext={renewalContext}
        priorityChip={priorityChip}
      />
    );
  }

  const routing = await resolveUploadRouting();

  // First-time / fall-back routes all use the existing UploadFlow.
  // Returning-customer routes get their dedicated shell.
  if (routing.shell === "first-time" || !routing.primaryPolicy) {
    return (
      <UploadFlow
        isDemo={isDemo}
        renewalContext={renewalContext}
        priorityChip={priorityChip}
      />
    );
  }

  switch (routing.shell) {
    case "welcome-back":
      return (
        <ShellWelcomeBack
          policy={routing.primaryPolicy}
          lifecycle={routing.lifecycle!}
        />
      );
    case "quotes-open":
      return (
        <ShellQuotesOpen
          policy={routing.primaryPolicy}
          lifecycle={routing.lifecycle!}
        />
      );
    case "fresh-policy":
      // Phase 2 delegates this to ShellWelcomeBack (State C);
      // dedicated UI lands in Phase 3.
      return (
        <ShellWelcomeBack
          policy={routing.primaryPolicy}
          lifecycle={routing.lifecycle!}
        />
      );
    case "lapsed":
      return (
        <ShellLapsed
          policy={routing.primaryPolicy}
          lifecycle={routing.lifecycle!}
        />
      );
    default:
      // Safety net — unreachable in well-formed routing.
      return (
        <UploadFlow
          isDemo={isDemo}
          renewalContext={renewalContext}
          priorityChip={priorityChip}
        />
      );
  }
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
