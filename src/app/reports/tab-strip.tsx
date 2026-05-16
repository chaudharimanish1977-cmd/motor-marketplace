"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import clsx from "clsx";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin client-side tab strip — just renders Links, highlights the
 * active one. No internal state, no large data flowing across the
 * server/client boundary.
 *
 * The active tab is determined by the `?tab=` URL search param, set
 * server-side in /reports/page.tsx. Switching tabs is a full route
 * navigation (Next.js still keeps it snappy via prefetch + client-
 * side transition), so each tab's content is rendered fresh on the
 * server — no client-side hydration of large doc/report payloads.
 */

export interface TabDef {
  id: string;
  label: string;
}

interface Props {
  tabs: TabDef[];
  firstTabId: string;
  isVerified: boolean;
}

export function TabStrip({ tabs, firstTabId, isVerified }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") ?? firstTabId;

  return (
    <nav
      className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 border-b border-brand-light-gray"
      aria-label="Reports"
    >
      {tabs.map((t) => {
        const isActive = t.id === currentTab;
        const isFirst = t.id === firstTabId;
        const isLocked = !isVerified && !isFirst;
        const href = `${pathname}?tab=${encodeURIComponent(t.id)}`;
        return (
          <Link
            key={t.id}
            href={href}
            scroll={false}
            className={clsx(
              "shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl transition-all",
              isActive
                ? "bg-brand-navy text-white shadow-soft"
                : "bg-white border border-brand-light-gray text-brand-charcoal hover:bg-brand-offwhite"
            )}
          >
            {isLocked && <Lock className="w-3 h-3 opacity-70" />}
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
