/**
 * ShellFreshPolicy — currently routed to via `welcome-back` for State C
 * in Phase 2, so this file is a placeholder for the dedicated flow that
 * Phase 3+ will introduce (e.g. when the customer returns having renewed
 * elsewhere and we want to *invite* a fresh-policy drop). Kept here so
 * the export surface is stable.
 */
"use client";

import { ShellWelcomeBack } from "./shell-welcome-back";
import type { ParsedPolicy } from "@/lib/types";
import type { LifecycleResult } from "@/lib/lifecycle-state";

interface ShellFreshPolicyProps {
  policy: ParsedPolicy;
  lifecycle: LifecycleResult;
}

export function ShellFreshPolicy(props: ShellFreshPolicyProps) {
  // Phase 2 delegates to ShellWelcomeBack (the C copy already lives
  // inside that shell). Phase 3 will split this out when we wire the
  // "you've moved on — drop your fresh policy" pattern.
  return <ShellWelcomeBack {...props} />;
}
