/**
 * Act 1 · Hello — the first ~15 seconds.
 *
 * Job: confirm receipt + personalise. Customer just dropped a file;
 * within 1-2 seconds parse-preview returns enough to address them by
 * their actual vehicle. The car drives in (via the existing animated
 * SketchCar at large size) and the heading lands.
 *
 * On mobile this is a full-screen card. On desktop it sits inside the
 * normal centred column.
 */
"use client";

import { SketchCar } from "@/components/sketches";
import { ActFrame, ActHeading } from "./act-frame";
import type { ActContent } from "@/lib/journey-copy";

interface ActHelloProps {
  content: ActContent;
  progress: React.ReactNode;
}

export function ActHello({ content, progress }: ActHelloProps) {
  return (
    <ActFrame kicker="· Reading Room · No. 1" progress={progress}>
      <div className="flex flex-col items-center text-center">
        {/* Animated car driving in */}
        <div className="text-brand-plum mb-6">
          <SketchCar width={220} color="currentColor" />
        </div>
        <ActHeading heading={content.heading} body={content.body} />
      </div>
    </ActFrame>
  );
}
