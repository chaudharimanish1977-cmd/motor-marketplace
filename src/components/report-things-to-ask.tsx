/**
 * ThingsToAskBlock — actionable questions for the customer to send
 * to their insurer (or agent) BEFORE binding a quote. Quote-only;
 * empty/missing on bound policies.
 *
 * The questions are copy-paste-ready. Each one renders as a quoted
 * block so the customer can highlight + copy a single question
 * cleanly without the surrounding chrome.
 */

import { MessageSquareQuote } from "lucide-react";
import type { ThingsToAskItem } from "@/lib/types";

interface Props {
  items: ThingsToAskItem[] | undefined;
}

export function ThingsToAskBlock({ items }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <section className="mb-10 pl-5 border-l-2 border-brand-sage">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold">
        · Things to ask before binding ·
      </div>
      <p className="mt-2 font-serif italic text-[14.5px] text-brand-slate max-w-xl">
        Copy any of these into a WhatsApp message, email, or phone call
        with your agent. Direct and specific — the way fair negotiation
        sounds.
      </p>
      <ul className="mt-4 space-y-4 max-w-2xl">
        {items.map((item, i) => (
          <li key={`tta-${i}`} className="flex gap-3">
            <span
              aria-hidden
              className="shrink-0 mt-1 text-brand-sage"
            >
              <MessageSquareQuote className="w-4 h-4" />
            </span>
            <div className="flex-1">
              <blockquote className="font-serif text-[15px] leading-[1.55] text-brand-charcoal border-l-2 border-brand-sage/40 pl-3 bg-brand-surface/40 py-1.5">
                &ldquo;{item.ask}&rdquo;
              </blockquote>
              {item.reasoning && (
                <p className="mt-1 font-serif italic text-[13px] text-brand-slate leading-relaxed">
                  {item.reasoning}
                </p>
              )}
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-slate">
                For {item.insurer}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
