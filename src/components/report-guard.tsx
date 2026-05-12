"use client";

import { useEffect } from "react";

/**
 * Best-effort screenshot / copy / print deterrents for the report page.
 *
 * Strictly cosmetic — there's no airtight web way to prevent screenshots
 * (the OS / phone always wins). But this:
 *   - Disables right-click context menu on the report area
 *   - Blocks Ctrl/Cmd+S (save) and Ctrl/Cmd+P (print) keyboard shortcuts
 *     (browsers can still print via menu, but the @print CSS in globals.css
 *      hides the report content anyway)
 *   - Suppresses default copy via JS as belt-and-braces alongside the
 *     CSS user-select: none rule
 *
 * Combined with prominent "Get the report by email" CTAs, the net effect is
 * to nudge users into the email-capture flow rather than try to keep a
 * screenshot. Investor view does NOT include this guard.
 */
export function ReportGuard() {
  useEffect(() => {
    const isInsideProtected = (target: EventTarget | null): boolean => {
      if (!(target instanceof Element)) return false;
      return !!target.closest(".report-protected");
    };

    const onContextMenu = (e: MouseEvent) => {
      if (isInsideProtected(e.target)) e.preventDefault();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const cmdOrCtrl = e.ctrlKey || e.metaKey;
      if (cmdOrCtrl && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
      }
      if (cmdOrCtrl && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
      }
    };
    const onCopy = (e: ClipboardEvent) => {
      if (isInsideProtected(e.target)) {
        e.preventDefault();
        e.clipboardData?.setData(
          "text/plain",
          "Get this report by email — visit RightOffer.in"
        );
      }
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("copy", onCopy);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("copy", onCopy);
    };
  }, []);

  return null;
}
