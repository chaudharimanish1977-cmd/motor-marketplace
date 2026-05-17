/**
 * PlateOtpInput — the OTP input field restyled as an Indian vehicle
 * number plate continuation.
 *
 * Brand insight: every car has a plate, and we already display the
 * customer's plate prominently on the report cover. When we need a
 * 4-digit OTP, the input becomes a plate-style continuation of THEIR
 * plate — same mono caps, same black border, same IND chip.
 *
 *      ┌──────────────────────────────────────────────────┐
 *      │  IND  DL-09-CAU-2020   ·   ▢   ▢   ▢   ▢       │   desktop
 *      └──────────────────────────────────────────────────┘
 *
 *      ┌──────────────────────────────┐
 *      │  IND  DL-09-CAU-2020         │
 *      │  ─────────────────────────── │   mobile (stacked)
 *      │       ▢   ▢   ▢   ▢          │
 *      └──────────────────────────────┘
 *
 * Implementation:
 *   · Visible plate-styled frame + read-only plate text + 4 digit slots
 *   · Hidden `<input>` overlaid on top — captures all keyboard input,
 *     supports SMS auto-fill on iOS / Android, supports paste-from-
 *     clipboard for the full 4-digit code in one shot
 *   · Tap anywhere on the frame → focuses the hidden input
 *   · Each digit animates in with the `plate-fill` keyframe — quick,
 *     subtle scale-pop, no overshoot
 *
 * Fallback when the customer's registration number is missing from
 * the parsed policy: we show the vehicle make + model in the plate
 * area instead (e.g. `IND  AUDI A6`). Still on-brand, still personal.
 */
"use client";

import { useRef, type FocusEvent } from "react";

interface PlateOtpInputProps {
  /** The customer's actual registration plate (e.g. `DL-09-CAU-2020`).
   *  When missing, we fall back to `vehicleLabel`. */
  vehiclePlate?: string;
  /** Fallback shown in the plate area when `vehiclePlate` is absent.
   *  Typically the make + model (e.g. "Audi A6"). Will be uppercased. */
  vehicleLabel?: string;
  /** Controlled value of the OTP input — 0 to 4 digits. */
  value: string;
  /** Fired with the cleaned (digits-only, max-4) new value. */
  onChange: (next: string) => void;
  /** Disables the input + dims the frame. */
  disabled?: boolean;
  /** Autofocus the hidden input on mount — typical when the OTP
   *  step first appears. */
  autoFocus?: boolean;
}

export function PlateOtpInput({
  vehiclePlate,
  vehicleLabel,
  value,
  onChange,
  disabled = false,
  autoFocus = false,
}: PlateOtpInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Plate text — use the real plate when available, otherwise the
  // vehicle label uppercased, otherwise a generic placeholder.
  const usingFallback = !vehiclePlate;
  const plateText =
    vehiclePlate ||
    (vehicleLabel && vehicleLabel.trim()
      ? vehicleLabel.trim().toUpperCase()
      : "YOUR CAR");

  // Split current value into 4 slot characters (some may be empty).
  const slots: Array<string> = [0, 1, 2, 3].map((i) => value[i] ?? "");

  const focusInput = () => inputRef.current?.focus();

  const onContainerFocus = (e: FocusEvent<HTMLDivElement>) => {
    // If focus lands on the container itself (not the input), forward
    // it to the input so keyboard typing always works.
    if (e.target !== inputRef.current) {
      focusInput();
    }
  };

  return (
    <div
      role="group"
      aria-label="4-digit unlock code"
      onFocus={onContainerFocus}
      onClick={focusInput}
      className={`relative cursor-text select-none ${
        disabled ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      {/* Frame — number plate aesthetic (white, black border, mono).
       *  Desktop: row layout with a vertical separator between plate
       *  text and OTP slots.
       *  Mobile: column layout (stacked).
       */}
      <div className="flex flex-col md:flex-row items-stretch bg-white border-2 border-black rounded-md overflow-hidden shadow-soft">
        {/* Plate side — IND chip + plate text */}
        <div className="flex items-center justify-center gap-2 px-3.5 py-3 md:py-2.5 flex-shrink-0 border-b-2 md:border-b-0 md:border-r-2 border-black/40">
          <span className="inline-flex items-center px-2 py-0.5 bg-brand-success text-white text-[9.5px] font-bold tracking-[0.18em] rounded-sm">
            IND
          </span>
          <span
            className={`font-mono font-bold text-[15px] md:text-base tracking-[0.06em] whitespace-nowrap ${
              usingFallback
                ? "text-brand-charcoal/80"
                : "text-black"
            }`}
          >
            {plateText}
          </span>
        </div>

        {/* OTP slots side — 4 boxes, each fills with a digit */}
        <div className="flex items-center justify-center gap-2 md:gap-2.5 px-4 py-3 md:py-2 flex-1">
          {slots.map((digit, i) => (
            <div
              key={i}
              className={`relative w-8 h-10 md:w-9 md:h-10 inline-flex items-center justify-center border-2 rounded-sm transition-colors ${
                digit
                  ? "border-black bg-white"
                  : "border-black/15 bg-white"
              }`}
            >
              {digit ? (
                // Re-keyed on the digit value so React mounts a fresh
                // element each time a slot fills — triggers the
                // plate-fill animation on every digit landing.
                <span
                  key={`${i}-${digit}`}
                  className="font-mono font-bold text-[20px] md:text-[22px] tabular-nums text-black animate-plate-fill"
                  aria-hidden
                >
                  {digit}
                </span>
              ) : (
                <span
                  className="font-mono text-[20px] md:text-[22px] text-black/15"
                  aria-hidden
                >
                  ·
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hidden input — covers the entire frame so taps anywhere focus
       *  it. Keyboard events feed onChange directly. */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        maxLength={4}
        value={value}
        onChange={(e) =>
          onChange(e.target.value.replace(/\D/g, "").slice(0, 4))
        }
        autoFocus={autoFocus}
        aria-label="Enter 4-digit code"
        className="absolute inset-0 w-full h-full opacity-0 cursor-text bg-transparent border-0 outline-none"
      />
    </div>
  );
}
