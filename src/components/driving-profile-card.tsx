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
  pastClaims?: string;
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
      pastClaims: p.pastClaims ?? persisted.pastClaims,
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
  if (profile.pastClaims)
    chips.push({ label: "Recent claims", value: profile.pastClaims });

  if (chips.length === 0) return null;

  // Editorial vocabulary — matches the rest of the report.
  //   · No card frame, no shadow, no rounded boxes
  //   · Mono kicker · serif chip body · sage accent (signals this
  //     content is "what's working for you", not "alert")
  //   · Plum left-rule echoes the GapEvidence + ClaimSimulator
  //     left-rule pattern so the customer reads the chips as part
  //     of the audit voice
  return (
    <div className="my-5 md:my-6 pl-4 md:pl-5 border-l-2 border-brand-sage">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] font-bold text-brand-sage">
        · Tailored to your driving profile ·
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
        {chips.map((c) => (
          <div
            key={c.label}
            className="flex items-baseline gap-1.5"
          >
            <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] font-bold text-brand-slate">
              {c.label}
            </span>
            <span className="font-serif italic text-[13.5px] md:text-[14px] text-brand-charcoal">
              {c.value}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-brand-slate">
        · Reflected in each gap&rsquo;s &ldquo;show our work&rdquo; trail below ·
      </p>
    </div>
  );
}
