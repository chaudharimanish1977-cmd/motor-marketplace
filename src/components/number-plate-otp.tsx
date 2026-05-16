/**
 * NumberPlateOTP — the OTP input as a real Indian car number plate.
 *
 * Brand-signature treatment: instead of a generic 6-digit input row,
 * the OTP slot is rendered as a real white HSRP plate (white bg, black
 * border, monospace black digits, blue "IND" tab on the left with the
 * tricolour stripe). When all six digits are entered, the plate border
 * lifts to plum + a soft shadow — the "verified" beat.
 *
 * V1 here is a *visual* component — it accepts a `digits` string and
 * renders the plate. Real keystroke handling can wrap this with a
 * hidden <input> once we wire it into /me/login or the report email
 * gate. The plate is the visible affordance; the input element is the
 * accessibility layer.
 *
 * Lands on:
 *   · /me/login OTP verification
 *   · Report email-gate OTP screen
 *   · Any future place we ask for a code
 */
"use client";

interface NumberPlateOTPProps {
  /** The current OTP digits typed so far. Empty slots show as "_". */
  digits?: string;
  /** Number of expected digits. Defaults to 6. */
  length?: number;
  /** ARIA label override. */
  "aria-label"?: string;
  className?: string;
}

export function NumberPlateOTP({
  digits = "",
  length = 6,
  "aria-label": ariaLabel,
  className,
}: NumberPlateOTPProps) {
  const complete = digits.length === length;
  return (
    <div
      role="img"
      aria-label={
        ariaLabel ??
        `OTP plate: ${digits.padEnd(length, "_").split("").join(" ")}`
      }
      className={`inline-flex items-center gap-3 px-4 py-2.5 bg-white rounded-md border-[3px] transition-all ${
        complete
          ? "border-brand-plum shadow-[0_0_0_4px_rgb(58_30_61/0.08)]"
          : "border-black"
      } ${className ?? ""}`}
    >
      {/* "IND" tab on the left — mimics the HSRP plate's blue strip
       *  with the Indian flag tricolour underneath. Kept compact so
       *  the digits stay the hero. */}
      <span className="inline-flex flex-col items-center bg-[#1B4D9C] text-white px-1.5 py-1 rounded-sm leading-none">
        <span className="font-mono font-bold text-[9px] tracking-[0.08em]">
          IND
        </span>
        <span className="mt-0.5 flex gap-[1px]">
          <span className="w-1 h-[3px] bg-[#FF9933]" />
          <span className="w-1 h-[3px] bg-white" />
          <span className="w-1 h-[3px] bg-[#138808]" />
        </span>
      </span>

      {/* Digit slots — monospace, bold, black on white like a real
       *  plate. Empty slots show a subtle underline rather than a hard
       *  underscore so the empty plate still reads like a plate. */}
      <div className="flex items-end gap-1.5 md:gap-2">
        {Array.from({ length }).map((_, i) => {
          const ch = digits[i];
          return (
            <span
              key={i}
              className="relative inline-flex items-end justify-center w-6 md:w-8 h-9 md:h-11 font-mono font-extrabold text-[28px] md:text-[36px] leading-none text-black"
            >
              <span className={ch ? "opacity-100" : "opacity-0"}>
                {ch ?? "0"}
              </span>
              {/* Underline marker for empty slot */}
              <span
                className={`absolute left-0 right-0 bottom-0 h-[2px] bg-black/40 transition-all ${
                  ch ? "opacity-0" : "opacity-100"
                }`}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}
