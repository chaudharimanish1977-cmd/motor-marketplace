/**
 * Act 2 · Read — the next ~25 seconds.
 *
 * Job: show the work. The full LoaderScene mounts here (bouncing car
 * + floating IDV / NCB / Zero-Dep badges + ambient sparkles + cycling
 * status caption). Customer sees us actually doing things, which is
 * the highest-trust moment in the journey.
 *
 * The Act 2 heading and body explain what we're checking — paired
 * with the badges, this is also the educational layer (without being
 * preachy).
 */
"use client";

import { LoaderScene } from "@/components/loader-scene";
import { ActFrame, ActHeading } from "./act-frame";
import type { ActContent } from "@/lib/journey-copy";

interface ActReadProps {
  content: ActContent;
  progress: React.ReactNode;
}

export function ActRead({ content, progress }: ActReadProps) {
  return (
    <ActFrame kicker="· Reading Room · No. 2" progress={progress}>
      <div className="flex flex-col items-center">
        <div className="mb-6 w-full max-w-[520px]">
          <LoaderScene />
        </div>
        <ActHeading heading={content.heading} body={content.body} />
      </div>
    </ActFrame>
  );
}
