/**
 * GlossarySection — auto-detected, embedded at the end of the report.
 * Includes only the glossary terms that actually appear in the report
 * (or its underlying data). Keeps the artifact self-sufficient — no
 * tab-switching to /glossary, no clicking out.
 *
 * Detection: scan a "blob" of report text for known glossary term
 * keys (case-insensitive substring match on both the full name and
 * the short alias). Caller assembles the blob from whatever sources
 * make sense (table feature names, bottomLine, section bodies, etc).
 */

import { GLOSSARY, type GlossaryEntry } from "@/lib/glossary";

interface Props {
  /** Concatenated report content used for term detection. The caller
   *  builds this from whatever it considers "user-visible text". */
  contentBlob: string;
}

interface MatchedTerm {
  /** Abbreviation key from GLOSSARY (e.g. "IDV", "NCB"). */
  abbrev: string;
  entry: GlossaryEntry;
}

export function GlossarySection({ contentBlob }: Props) {
  const matched = detectGlossaryTerms(contentBlob);
  if (matched.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-brand-charcoal/15">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-3">
        · Glossary ·
      </div>
      <p className="font-serif italic text-[14px] text-brand-slate mb-5 max-w-xl">
        The terms used in this report, plain-English.
      </p>
      <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-5 max-w-3xl">
        {matched.map(({ abbrev, entry }) => (
          <div key={abbrev}>
            <dt className="font-serif font-semibold text-[14.5px] text-brand-charcoal">
              {entry.full}
              <span className="ml-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-brand-slate">
                {abbrev}
              </span>
            </dt>
            <dd className="mt-0.5 font-serif text-[13.5px] leading-[1.6] text-brand-slate">
              {entry.long ?? entry.short}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Loose match — looks for the abbrev key OR the full name in the
 *  content, case-insensitive. Returns matched entries with abbrev
 *  in the catalogue's natural order. */
function detectGlossaryTerms(blob: string): MatchedTerm[] {
  const lower = (blob || "").toLowerCase();
  const matched: MatchedTerm[] = [];
  for (const [abbrev, entry] of Object.entries(GLOSSARY)) {
    // Word-boundary-ish match on abbreviation so "IDV" matches "IDV is"
    // but doesn't false-positive on substrings inside other words.
    const abbrevPattern = new RegExp(`\\b${escapeRegex(abbrev)}\\b`, "i");
    const fullNeedle = entry.full.toLowerCase();
    if (
      abbrevPattern.test(blob) ||
      lower.includes(fullNeedle)
    ) {
      matched.push({ abbrev, entry });
    }
  }
  return matched;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
