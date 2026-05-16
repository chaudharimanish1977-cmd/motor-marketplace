"use client";

import { useEffect, useState } from "react";
import {
  midLoadStorageKey,
  readPersistedAnswers,
  type MidLoadAnswers,
} from "@/components/mid-load-questions";

export interface DrivingProfile {
  annualKm?: string;
  drivenBy?: string;
  otherCars?: string;
  priority?: string;
}

interface Props {
  /** Phase-1 answers passed via the URL — already known server-side. */
  initialProfile?: DrivingProfile;
  /** Used to look up phase-2 answers in localStorage. */
  reportId: string;
}

/**
 * Driving-profile chip card. Renders the union of:
 *   - phase-1 answers (passed in as initialProfile from URL params)
 *   - phase-2 answers (read on mount from localStorage on the client)
 *
 * This way users who answered the carousel on either the upload loader OR
 * the report-page loader get their tailoring chips on the final report.
 */
export function DrivingProfileCard({ initialProfile, reportId }: Props) {
  const [profile, setProfile] = useState<DrivingProfile>(
    () => initialProfile ?? {}
  );

  useEffect(() => {
    if (!reportId) return;
    const persisted: MidLoadAnswers = readPersistedAnswers(
      midLoadStorageKey(reportId)
    );
    setProfile((p) => ({
      // server-known wins where present; persisted fills gaps
      annualKm: p.annualKm ?? persisted.annualKm,
      drivenBy: p.drivenBy ?? persisted.drivenBy,
      otherCars: p.otherCars ?? persisted.otherCars,
      priority: p.priority ?? persisted.priority,
    }));
  }, [reportId]);

  const chips: { label: string; value: string }[] = [];
  if (profile.annualKm)
    chips.push({ label: "You drive", value: profile.annualKm });
  if (profile.drivenBy)
    chips.push({ label: "Driven by", value: profile.drivenBy });
  if (profile.otherCars)
    chips.push({ label: "Other cars", value: profile.otherCars });
  if (profile.priority)
    chips.push({ label: "Matters most", value: profile.priority });

  if (chips.length === 0) return null;

  return (
    <div className="rounded-2xl border border-brand-light-gray bg-white shadow-sm overflow-hidden">
      <div className="bg-brand-navy/5 px-5 py-2.5 border-b border-brand-light-gray">
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-navy">
          Tailored to your driving profile
        </div>
      </div>
      <div className="px-5 py-4 flex flex-wrap gap-2">
        {chips.map((c) => (
          <div
            key={c.label}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-offwhite border border-brand-light-gray px-3 py-1.5"
          >
            <span className="text-[10px] uppercase tracking-wider text-brand-slate font-semibold">
              {c.label}
            </span>
            <span className="text-xs font-bold text-brand-charcoal">
              {c.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
