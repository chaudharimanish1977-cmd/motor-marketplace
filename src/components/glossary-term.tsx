/**
 * GlossaryTerm — inline editorial chip that surfaces a plain-English
 * definition of a motor-insurance term (IDV, NCB, OD, TP, etc.).
 *
 * Render pattern:
 *   <GlossaryTerm term="IDV" />                  → "IDV" with hover tip
 *   <GlossaryTerm term="IDV">declared value</GlossaryTerm>
 *                                                → "declared value" with hover tip
 *
 * Uses the native HTML <abbr title="…"> element underneath for three
 * reasons:
 *   1. Semantically correct — these terms ARE abbreviations.
 *   2. Tooltip shows up on hover (desktop), long-press (mobile),
 *      and focus (keyboard) — no custom popover library required.
 *   3. Accessible by default — screen readers announce the expansion.
 *
 * Visual cue is a dotted underline + cursor-help so customers know
 * the term is interactive without us having to label every chip.
 *
 * Falls back to plain text if the term isn't in the dictionary (defends
 * against typos at call sites).
 */

import { lookupTerm } from "@/lib/glossary";

interface Props {
  /** Canonical key in the GLOSSARY map. Case-sensitive. */
  term: string;
  /** Optional custom render text. Defaults to the term itself. */
  children?: React.ReactNode;
}

export function GlossaryTerm({ term, children }: Props) {
  const entry = lookupTerm(term);
  if (!entry) {
    // Term not in dictionary — render as plain text so a typo at the
    // call site doesn't crash the page.
    return <>{children ?? term}</>;
  }
  const title = `${entry.full}\n\n${entry.short}`;
  return (
    <abbr
      title={title}
      className="cursor-help underline decoration-dotted decoration-brand-charcoal/40 underline-offset-[3px] hover:decoration-brand-plum/80"
      style={{ textDecorationThickness: "1px" }}
    >
      {children ?? term}
    </abbr>
  );
}
