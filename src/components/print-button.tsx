"use client";

import { Printer } from "lucide-react";
import clsx from "clsx";

interface Props {
  label?: string;
  className?: string;
}

export function PrintButton({ label = "Print / Save as PDF", className }: Props) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={clsx(
        "inline-flex items-center gap-1.5 text-sm font-semibold text-brand-deepblue hover:brightness-110 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors",
        className
      )}
    >
      <Printer className="w-4 h-4" />
      {label}
    </button>
  );
}
