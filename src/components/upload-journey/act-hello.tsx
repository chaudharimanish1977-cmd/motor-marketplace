/**
 * Stop 1 · Hello — the first ~12 seconds.
 *
 * Confirm receipt + personalise. The car drives in and the heading
 * lands. Subtle hover loop on the car keeps things alive.
 */
"use client";

import { SketchCar } from "@/components/sketches";
import { ActHeading } from "./act-frame";
import type { ActContent } from "@/lib/journey-copy";

interface ActHelloProps {
  content: ActContent;
}

export function ActHello({ content }: ActHelloProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="text-brand-plum mb-5 md:mb-6 animate-roadhover">
        <SketchCar width={200} color="currentColor" />
      </div>
      <ActHeading heading={content.heading} body={content.body} />
    </div>
  );
}
