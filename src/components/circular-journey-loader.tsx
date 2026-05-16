"use client";

import { useEffect, useState } from "react";
import { formatLandmarks } from "@/lib/location-data";
import { getBodyType, type BodyType } from "@/lib/vehicle-classifier";
import { CarByBodyType } from "@/components/car-illustrations";
import { BackgroundScenery, ForegroundScenery } from "@/components/scenery";
import { TimeComparison } from "@/components/time-comparison";
import { NumberPlate } from "@/components/number-plate";

interface Props {
  vehicleLabel?: string;
  registrationNumber?: string;
  rtoCity?: string;
  vehicleAgeYears?: number;
  /** Make + model used to pick the right car illustration (hatchback / sedan / SUV / luxury) */
  vehicleMake?: string;
  vehicleModel?: string;
  /** Optional explicit override of body type */
  bodyType?: BodyType;
  stage?: "preview" | "parsing" | "curating";
  customMessages?: string[];
  primaryText?: string;
  etaText?: string;
  /** Epoch ms when the user started the flow — drives the live elapsed timer */
  startedAt?: number;
}

const MESSAGE_BANK: Record<"preview" | "parsing" | "curating", string[]> = {
  preview: ["Opening your policy...", "Identifying your vehicle..."],
  parsing: [
    "Reading every line of your policy...",
    "Identifying your coverage and add-ons...",
    "Verifying IDV and No-Claim Bonus...",
    "Looking for gaps in your protection...",
    "Curating recommendations specific to your vehicle...",
  ],
  curating: [
    "Inviting BharatSure, Vahana & Suraksha to bid...",
    "Building your Basic tier (minimum premium)...",
    "Crafting your Recommended tier (your selection priced)...",
    "Designing your Super Cover tier (maximum protection)...",
    "Picking the winning insurer for each tier...",
  ],
};

/**
 * Car-on-road loader: a single car drives forward; speed lines stream backwards
 * behind it; road dashes scroll past underneath. Wheels spin. Car body has a
 * subtle bounce. Personalised with the customer's vehicle plate + age + RTO.
 *
 * Replaces the previous circular-orbit design (which didn't read as "a moving
 * car leaving a trail" — cars don't orbit, they drive forward).
 */
export function CircularJourneyLoader({
  vehicleLabel,
  registrationNumber,
  rtoCity,
  vehicleAgeYears,
  vehicleMake,
  vehicleModel,
  bodyType,
  stage = "parsing",
  customMessages,
  primaryText,
  etaText,
  startedAt,
}: Props) {
  const messages = customMessages ?? MESSAGE_BANK[stage];
  const [messageIdx, setMessageIdx] = useState(0);
  const [ageCounter, setAgeCounter] = useState(0);
  const [landmarkIdx, setLandmarkIdx] = useState(0);

  const landmarks = formatLandmarks(rtoCity, 4);

  // Pick the right car illustration based on the customer's actual vehicle.
  const resolvedBodyType: BodyType =
    bodyType ?? getBodyType(vehicleMake, vehicleModel);

  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => {
      setMessageIdx((i) => (i + 1) % messages.length);
    }, 2400);
    return () => clearInterval(id);
  }, [messages.length]);

  useEffect(() => {
    if (landmarks.length <= 1) return;
    const id = setInterval(() => {
      setLandmarkIdx((i) => (i + 1) % landmarks.length);
    }, 1400);
    return () => clearInterval(id);
  }, [landmarks.length]);

  useEffect(() => {
    if (vehicleAgeYears === undefined || vehicleAgeYears <= 0) {
      setAgeCounter(0);
      return;
    }
    const target = vehicleAgeYears;
    const step = Math.max(1, Math.ceil(target / 20));
    let current = 0;
    const id = setInterval(() => {
      current = Math.min(current + step, target);
      setAgeCounter(current);
      if (current >= target) clearInterval(id);
    }, 70);
    return () => clearInterval(id);
  }, [vehicleAgeYears]);

  return (
    <div className="w-full max-w-2xl mx-auto py-2">

      {/* DRIVING SCENE — moved to the TOP so the eye lands on motion first,
       *  but the hero text immediately below is what reads as primary. The
       *  animation now supports the work-in-progress narrative; it isn't
       *  the hero itself. */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-soft bg-gradient-to-b from-sky-100 via-sky-50 to-slate-200">
        {/* Vehicle name + plate overlaid on the SVG sky — saves the header
         *  row entirely and reads as a "license-plate on the windshield"
         *  visual flourish. */}
        {(vehicleLabel || registrationNumber) && (
          <div className="absolute top-2 left-0 right-0 z-10 flex flex-wrap items-center justify-center gap-2 px-4 pointer-events-none">
            {vehicleLabel && (
              <span className="px-2 py-0.5 rounded-md bg-white/80 backdrop-blur-sm text-[11px] sm:text-xs font-bold text-brand-charcoal shadow-soft leading-tight truncate max-w-[55%]">
                {vehicleLabel}
              </span>
            )}
            {registrationNumber && registrationNumber !== "NEW" && (
              <NumberPlate value={registrationNumber} size="sm" />
            )}
            {registrationNumber === "NEW" && (
              <span className="inline-flex items-center px-2 py-0.5 bg-brand-success text-white text-[9px] font-bold tracking-[0.15em] rounded shadow-soft">
                NEW VEHICLE
              </span>
            )}
          </div>
        )}
        <svg
          viewBox="0 0 400 200"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-auto block"
        >
          <defs>
            <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cfe8f4" />
              <stop offset="100%" stopColor="#f5fafe" />
            </linearGradient>
            <linearGradient id="ground-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c5cad0" />
              <stop offset="100%" stopColor="#9aa1a8" />
            </linearGradient>
            <linearGradient id="road-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#aab1b8" />
              <stop offset="100%" stopColor="#7d848c" />
            </linearGradient>
            <filter id="car-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
            </filter>
          </defs>

          {/* Sky */}
          <rect x="0" y="0" width="400" height="135" fill="url(#sky-grad)" />

          {/* Scrolling background scenery — buildings + city monument */}
          {/* Clip to sky area so scenery doesn't spill past the road */}
          <clipPath id="sky-clip">
            <rect x="0" y="0" width="400" height="135" />
          </clipPath>
          <g clipPath="url(#sky-clip)">
            <BackgroundScenery city={rtoCity} />
          </g>

          {/* Ground / shoulder */}
          <rect x="0" y="135" width="400" height="65" fill="url(#ground-grad)" />

          {/* Foreground scenery (trees, lampposts) — faster scroll for parallax */}
          <clipPath id="foreground-clip">
            <rect x="0" y="100" width="400" height="42" />
          </clipPath>
          <g clipPath="url(#foreground-clip)">
            <ForegroundScenery />
          </g>

          {/* Road surface */}
          <rect x="0" y="142" width="400" height="50" fill="url(#road-grad)" />

          {/* Top and bottom road edges (white) */}
          <line x1="0" y1="143" x2="400" y2="143" stroke="#ffffff" strokeWidth="1.2" opacity="0.7" />
          <line x1="0" y1="191" x2="400" y2="191" stroke="#ffffff" strokeWidth="1.2" opacity="0.7" />

          {/* Centre dashed line (yellow), scrolling right-to-left */}
          <line
            x1="0"
            y1="167"
            x2="400"
            y2="167"
            stroke="#ffd54f"
            strokeWidth="3"
            strokeDasharray="30 20"
            className="animate-road-scroll"
          />

          {/* === CAR + TRAIL === positioned over the road */}
          {/* Speed lines (motion trail behind the car) */}
          <g>
            <SpeedLine y={150} length={30} className="animate-speed-1" />
            <SpeedLine y={156} length={40} className="animate-speed-2" />
            <SpeedLine y={163} length={28} className="animate-speed-3" />
            <SpeedLine y={170} length={35} className="animate-speed-4" />
            <SpeedLine y={177} length={32} className="animate-speed-5" />
          </g>

          {/* Dust cloud behind the rear wheel — subtle puff */}
          <g className="animate-pulse-soft" opacity="0.4">
            <ellipse cx="160" cy="184" rx="10" ry="3" fill="#b8c0c8" />
            <ellipse cx="155" cy="180" rx="6" ry="2" fill="#d8dde2" />
          </g>

          {/* CAR — body-type matched to actual vehicle; held steady in place
              so the eye isn't tugged up and down while reading the timer */}
          <g>
            <CarByBodyType bodyType={resolvedBodyType} x={195} y={145} />
          </g>
        </svg>
      </div>

      {/* HERO LIVE STATE — placed BELOW the driving scene now. The user's
       *  attention enters via the animation at top, then immediately reads
       *  "Reading your policy" as the hero. Fixed min-height so chips /
       *  ETA / TimeComparison appearing doesn't shift the layout. */}
      <div className="max-w-md mx-auto text-center mt-4 min-h-[220px] flex flex-col items-center justify-start">
        <div className="text-lg md:text-xl font-bold text-brand-charcoal min-h-[28px]">
          {primaryText}
        </div>
        <div
          key={messageIdx}
          className="text-xs text-brand-slate mt-1 min-h-[18px] animate-pulse-soft"
        >
          {messages[messageIdx]}
        </div>

        {/* Chips row */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 min-h-[32px]">
          {vehicleAgeYears !== undefined && vehicleAgeYears > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] text-brand-navy">
              <span className="font-bold tabular-nums">{ageCounter}</span>
              <span className="font-medium">
                {ageCounter === 1 ? "year" : "years"} on Indian roads
              </span>
            </span>
          )}
          {landmarks.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse" />
              <span>
                Curating for{" "}
                <span
                  key={landmarkIdx}
                  className="font-bold text-emerald-900"
                >
                  {landmarks[landmarkIdx]}
                </span>
              </span>
            </span>
          )}
        </div>

        {/* ETA row */}
        <div className="text-[11px] text-brand-slate/70 mt-2 min-h-[16px]">
          {etaText}
        </div>

        {/* TimeComparison "while you wait" — demoted to the very bottom as
         *  a small playful accent. `flex-col-reverse` flips the layout so
         *  the message reads first, the emoji sits below it. */}
        {startedAt !== undefined && (
          <div className="mt-4 w-full">
            <TimeComparison layout="vertical" className="flex-col-reverse" />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Speed line — single streak behind the car
// ============================================================================

function SpeedLine({
  y,
  length,
  className,
}: {
  y: number;
  length: number;
  className: string;
}) {
  // Each line starts somewhere behind the car (x ~145-170), pointing left
  const startX = 145;
  return (
    <g className={className}>
      <line
        x1={startX}
        y1={y}
        x2={startX - length}
        y2={y}
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.75"
      />
    </g>
  );
}

// ============================================================================
// Indian private vehicle number plate (white plate, black text).
// ============================================================================

