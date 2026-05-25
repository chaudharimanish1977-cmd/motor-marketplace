"use client";

import { useState, type ReactNode } from "react";
import { MermaidDiagram } from "@/components/mermaid-diagram";

/**
 * Client-side tab strip for the four engineer-view panels.
 *
 * All panels mount once on page load (hidden via `hidden` attribute
 * when inactive) so the Mermaid diagrams render once and tab switches
 * are instantaneous — no re-render flash. Stack table is plain HTML so
 * it's effectively free to keep mounted.
 *
 * Each panel uses the full width of its container; the parent page
 * provides a wide max-width (max-w-screen-2xl) so diagrams have room
 * to breathe on desktop.
 */

interface Diagrams {
  architecture: string;
  journey: string;
  validation: string;
}

interface Props {
  diagrams: Diagrams;
  stackTable: ReactNode;
}

interface TabDef {
  id: string;
  label: string;
  description: string;
}

const TABS: TabDef[] = [
  {
    id: "architecture",
    label: "01 · System architecture",
    description:
      "Every service touching a customer audit, from the moment a PDF crosses the wire to the moment we send the report back.",
  },
  {
    id: "journey",
    label: "02 · Customer journey",
    description:
      "One flowchart covering every path. Audit-only flow (Phase 1, live) + marketplace handoff (Phase 2, demo-only). Renewal loop closes back at the top.",
  },
  {
    id: "validation",
    label: "03 · Validation pipeline",
    description:
      "Eleven gates a document passes through before it becomes a saved audit. Each reject path produces a specific customer-facing email — no silent drops.",
  },
  {
    id: "stack",
    label: "04 · Stack: current → future",
    description:
      "What's live in Phase 1 versus the production-target Indian-region AWS stack. Migration is deliberate: ship on managed infra fast, swap when volume + revenue justify it.",
  },
];

export function EngineerTabs({ diagrams, stackTable }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = TABS[activeIdx];

  return (
    <div>
      {/* Tab strip */}
      <nav
        role="tablist"
        aria-label="Engineer view sections"
        className="flex flex-wrap gap-2 mb-6 border-b border-brand-light-gray dark:border-slate-700 pb-2"
      >
        {TABS.map((tab, i) => {
          const isActive = i === activeIdx;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveIdx(i)}
              className={
                isActive
                  ? "px-4 py-2 rounded-t-xl font-mono text-[11px] uppercase tracking-[0.14em] font-bold bg-brand-plum text-white border-2 border-brand-plum border-b-0 -mb-[2px]"
                  : "px-4 py-2 rounded-t-xl font-mono text-[11px] uppercase tracking-[0.14em] font-bold text-brand-slate hover:text-brand-plum border-2 border-transparent"
              }
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Active tab description */}
      <p className="font-serif italic text-[14.5px] md:text-[15.5px] text-brand-slate leading-[1.55] max-w-3xl mb-6">
        {active.description}
      </p>

      {/* Panels — all mounted, only active visible. Mermaid renders once
          per diagram on initial mount; tab switch is just a CSS show/hide. */}
      <div role="tabpanel" hidden={activeIdx !== 0}>
        <MermaidDiagram
          chart={diagrams.architecture}
          caption="Solid arrows = synchronous code paths. Dotted = error / observability side-channel. Storage tier (KV + Blob) sits in the middle: every pipeline write lands there, every read flows from there."
        />
      </div>
      <div role="tabpanel" hidden={activeIdx !== 1}>
        <MermaidDiagram
          chart={diagrams.journey}
          caption="Plum boxes = Phase 1 audit-only surfaces in production. Sage boxes = Phase 2 marketplace surfaces hidden behind the marketplace flag in prod, visible on demo. Red boxes = rejection paths that send a polite-and-specific email."
        />
      </div>
      <div role="tabpanel" hidden={activeIdx !== 2}>
        <MermaidDiagram
          chart={diagrams.validation}
          caption="Diamond gates = decision points. Red boxes = explicit rejection with a tailored reply. Sage boxes = success continuation. DPDP consent is captured by the action itself — forwarding to review@ is an affirmative consent under the published policy."
        />
      </div>
      <div role="tabpanel" hidden={activeIdx !== 3}>
        {stackTable}
      </div>
    </div>
  );
}
