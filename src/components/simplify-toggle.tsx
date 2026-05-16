"use client";

import { useEffect, useState } from "react";
import { Minimize2, Maximize2 } from "lucide-react";
import clsx from "clsx";

/**
 * Toggle that adds .report-simplified to <body>, hiding detail-level prose
 * (any element with class `report-detail`) so the customer can skim the
 * report top-to-bottom. Useful for users who want the headlines first.
 */
export function SimplifyToggle() {
  const [simplified, setSimplified] = useState(false);

  useEffect(() => {
    if (simplified) {
      document.body.classList.add("report-simplified");
    } else {
      document.body.classList.remove("report-simplified");
    }
    return () => {
      document.body.classList.remove("report-simplified");
    };
  }, [simplified]);

  return (
    <button
      type="button"
      onClick={() => setSimplified((s) => !s)}
      title={
        simplified ? "Show full detail" : "Show only headlines (simplify)"
      }
      className={clsx(
        "inline-flex items-center gap-1.5 text-xs font-medium border px-3 py-1.5 rounded-full transition-colors print:hidden",
        simplified
          ? "bg-brand-olive text-brand-charcoal border-brand-olive"
          : "text-white/90 hover:text-white border-white/30 hover:border-white/50"
      )}
    >
      {simplified ? (
        <>
          <Maximize2 className="w-3.5 h-3.5" />
          Show full detail
        </>
      ) : (
        <>
          <Minimize2 className="w-3.5 h-3.5" />
          Simplify
        </>
      )}
    </button>
  );
}
