/**
 * Stop 2 · Read — the next ~22 seconds.
 *
 * Show the work. The full LoaderScene mounts here (bouncing car +
 * floating IDV / NCB / Zero-Dep badges + ambient sparkles + cycling
 * status caption). Customer sees us actually doing things.
 *
 * The heading below the scene names what we're checking — paired with
 * the badges, this is also the educational layer without being preachy.
 */
"use client";

import { LoaderScene } from "@/components/loader-scene";
import { ActHeading } from "./act-frame";
import type { ActContent } from "@/lib/journey-copy";

interface ActReadProps {
  content: ActContent;
}

export function ActRead({ content }: ActReadProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 md:mb-5 w-full max-w-[460px] md:max-w-[520px]">
        <LoaderScene />
      </div>
      <ActHeading heading={content.heading} body={content.body} />
    </div>
  );
}
