/**
 * Decorative vehicle silhouette watermark — placed behind the report header
 * to add subtle personalisation. Body-type-aware (hatchback / sedan / SUV).
 */

import type { BodyType } from "@/lib/vehicle-classifier";

interface Props {
  bodyType: BodyType;
  className?: string;
}

export function VehicleWatermark({ bodyType, className }: Props) {
  // Simplified silhouettes for the watermark — single-color outline only
  return (
    <svg
      viewBox="0 0 200 80"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ pointerEvents: "none" }}
    >
      <g fill="currentColor" opacity="0.07">
        {bodyType === "hatchback" && (
          <path d="M 25,55 C 28,30 50,25 65,25 L 110,25 C 125,25 132,32 138,55 L 150,55 L 150,65 L 25,65 Z M 50,68 a 7,7 0 1 0 0.01,0 z M 125,68 a 7,7 0 1 0 0.01,0 z" />
        )}
        {bodyType === "sedan-compact" && (
          <path d="M 18,55 C 23,32 50,28 60,28 L 88,18 C 100,15 110,18 120,28 L 145,30 C 165,32 175,42 180,55 L 18,55 Z M 18,55 L 180,55 L 180,65 L 18,65 Z M 45,68 a 8,8 0 1 0 0.01,0 z M 155,68 a 8,8 0 1 0 0.01,0 z" />
        )}
        {bodyType === "sedan-luxury" && (
          <path d="M 12,55 C 17,32 50,25 65,25 L 95,18 C 110,15 120,18 130,28 L 158,30 C 178,32 188,42 192,55 L 12,55 Z M 12,55 L 192,55 L 192,65 L 12,65 Z M 42,68 a 9,9 0 1 0 0.01,0 z M 162,68 a 9,9 0 1 0 0.01,0 z" />
        )}
        {bodyType === "suv-compact" && (
          <path d="M 20,55 C 22,32 40,18 55,18 L 130,18 C 145,18 160,30 165,55 L 20,55 Z M 20,55 L 165,55 L 165,65 L 20,65 Z M 45,68 a 9,9 0 1 0 0.01,0 z M 145,68 a 9,9 0 1 0 0.01,0 z" />
        )}
        {bodyType === "suv-luxury" && (
          <path d="M 12,55 C 15,30 35,14 55,14 L 140,14 C 160,14 175,28 180,55 L 12,55 Z M 12,55 L 180,55 L 180,65 L 12,65 Z M 42,68 a 10,10 0 1 0 0.01,0 z M 152,68 a 10,10 0 1 0 0.01,0 z" />
        )}
      </g>
    </svg>
  );
}
