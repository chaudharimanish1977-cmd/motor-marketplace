"use client";

import { useState } from "react";
import clsx from "clsx";
import { Lock, ArrowRight } from "lucide-react";
import { ReportDisplay } from "@/components/report-display";
import type { ParsedPolicy, PolicyReport } from "@/lib/types";
import type { ComparatorView } from "./page";
import { ComparatorTab } from "./comparator-tab";

/**
 * Tab descriptor — discriminated by `kind`.
 *
 * The server builds the list (Comparator first if there are 2+ docs,
 * then policies + quotes sorted alphabetically by insurer name) and
 * passes it down. The client just renders.
 */
export type ReportsTabModel =
  | { id: string; kind: "comparator"; label: string }
  | { id: string; kind: "doc"; label: string; docId: string };

interface Props {
  tabs: ReportsTabModel[];
  docs: Record<string, ParsedPolicy>;
  reports: Record<string, PolicyReport>;
  comparator: ComparatorView | null;
  /**
   * True iff the customer has either a full magic-link session OR an
   * upload session (OTP-verified email). Drives the gate behaviour
   * (Option C — first tab inline gate, others locked-with-summary).
   */
  isVerified: boolean;
  /** Cosmetic: anonymous-only customers see a soft "verify" banner
   *  on the first tab even though the inline gate also handles it. */
  isAnonSessionOnly: boolean;
}

export function ReportsTabs({
  tabs,
  docs,
  reports,
  comparator,
  isVerified,
}: Props) {
  const [active, setActive] = useState<string>(tabs[0]?.id ?? "");
  const firstTab = tabs[0];
  const activeTab = tabs.find((t) => t.id === active) ?? firstTab;
  if (!activeTab) return null;
  const showGateForFirstTab = !isVerified;
  const isActiveFirst = activeTab.id === firstTab.id;

  return (
    <div>
      {/* Tab strip */}
      <nav
        className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 border-b border-brand-light-gray"
        aria-label="Reports"
      >
        {tabs.map((t) => {
          const isActive = t.id === active;
          const isFirst = t.id === firstTab.id;
          const isLocked = !isVerified && !isFirst;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={clsx(
                "shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl transition-all",
                isActive
                  ? "bg-brand-deepblue text-white shadow-soft"
                  : "bg-white border border-brand-light-gray text-brand-charcoal hover:bg-brand-offwhite"
              )}
            >
              {isLocked && (
                <Lock className="w-3 h-3 opacity-70" />
              )}
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* Active tab content */}
      <div>
        {/* Locked panel: non-first tabs when customer isn't verified.
            Tells them where to go to unlock everything. */}
        {!isVerified && !isActiveFirst && (
          <LockedTabPanel
            firstTabLabel={firstTab.label}
            onJumpToFirst={() => setActive(firstTab.id)}
          />
        )}

        {/* First tab (or any tab when verified) renders full content.
            ReportDisplay's `showGate` flag handles the inline gate. */}
        {(isVerified || isActiveFirst) && (
          <>
            {activeTab.kind === "comparator" && comparator && (
              <ComparatorTab
                comparator={comparator}
                showGate={showGateForFirstTab && isActiveFirst}
              />
            )}
            {activeTab.kind === "doc" && (
              <ReportDisplay
                parsedPolicy={docs[activeTab.docId]}
                report={reports[activeTab.docId]}
                view="customer"
                showGate={showGateForFirstTab && isActiveFirst}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LockedTabPanel({
  firstTabLabel,
  onJumpToFirst,
}: {
  firstTabLabel: string;
  onJumpToFirst: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-brand-light-gray bg-brand-offwhite/40 p-8 md:p-10 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-100 text-brand-deepblue flex items-center justify-center">
        <Lock className="w-6 h-6" />
      </div>
      <h3 className="mt-4 text-lg md:text-xl font-bold text-brand-charcoal tracking-tight">
        Verify your email to unlock this tab
      </h3>
      <p className="mt-2 text-sm text-brand-slate max-w-md mx-auto leading-relaxed">
        Head to the{" "}
        <span className="font-semibold text-brand-charcoal">
          {firstTabLabel}
        </span>{" "}
        tab and enter the code we&rsquo;ll email you. Once verified,
        every tab unlocks &mdash; no need to verify again.
      </p>
      <button
        type="button"
        onClick={onJumpToFirst}
        className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-orange hover:brightness-110 text-white font-semibold text-sm rounded-xl shadow-glow transition-all"
      >
        Go to {firstTabLabel}
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
