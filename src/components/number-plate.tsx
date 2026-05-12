/**
 * Shared Indian private vehicle number plate (white plate, black text).
 * Used in loader, report header, offer page, checkout, policy doc — anywhere
 * we want the customer's plate visible. Creates continuity across the journey.
 */

import clsx from "clsx";

interface Props {
  value: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: {
    container: "px-2 py-0.5 gap-1",
    ind: "text-[7px]",
    plate: "text-[10px]",
  },
  md: {
    container: "px-2.5 py-1 gap-1.5",
    ind: "text-[8px]",
    plate: "text-xs",
  },
  lg: {
    container: "px-3.5 py-1.5 gap-2",
    ind: "text-[10px]",
    plate: "text-base",
  },
};

export function NumberPlate({ value, size = "md", className }: Props) {
  const sz = SIZE_CLASSES[size];

  if (value === "NEW") {
    return (
      <div
        className={clsx(
          "inline-flex items-center px-2.5 py-1 bg-brand-success text-white text-[10px] font-bold tracking-[0.15em] rounded shadow-soft",
          className
        )}
      >
        NEW VEHICLE
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "inline-flex items-center rounded shadow-soft bg-white border-2 border-[#1a1a1a]",
        sz.container,
        className
      )}
    >
      <span
        className={clsx(
          "font-bold uppercase tracking-[0.15em] text-[#1a1a1a]",
          sz.ind
        )}
      >
        IND
      </span>
      <span
        className={clsx(
          "font-bold tracking-[0.08em] tabular-nums text-[#1a1a1a]",
          sz.plate
        )}
      >
        {value}
      </span>
    </div>
  );
}
