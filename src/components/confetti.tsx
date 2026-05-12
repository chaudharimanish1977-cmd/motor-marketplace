"use client";

import { useEffect, useState } from "react";

/**
 * Lightweight confetti burst — no external library.
 * 50 colored squares rain down with random trajectories + rotations.
 * Self-cleans after animation completes.
 */
export function Confetti({ trigger = true }: { trigger?: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!trigger) return;
    setPieces(generatePieces(60));
    const t = setTimeout(() => setPieces([]), 3500);
    return () => clearTimeout(t);
  }, [trigger]);

  if (pieces.length === 0) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-40 overflow-hidden print:hidden"
      aria-hidden
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute block"
          style={{
            left: `${p.x}%`,
            top: "-10%",
            width: `${p.size}px`,
            height: `${p.size * (p.shape === "rect" ? 0.5 : 1)}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate}deg)`,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            animation: `confetti-fall ${p.duration}s ease-out ${p.delay}s forwards`,
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
}

interface Piece {
  id: number;
  x: number; // % horizontal start
  size: number;
  color: string;
  rotate: number;
  duration: number;
  delay: number;
  shape: "rect" | "circle";
}

const PALETTE = [
  "#0A2463", // brand-deepblue
  "#247BA0", // brand-electricblue
  "#FF6B35", // brand-orange
  "#6C3FA0", // brand-purple
  "#00B894", // brand-success
  "#FFD54F", // gold/yellow
];

function generatePieces(count: number): Piece[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: 6 + Math.random() * 10,
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    rotate: Math.random() * 360,
    duration: 2 + Math.random() * 1.5,
    delay: Math.random() * 0.6,
    shape: Math.random() > 0.4 ? "rect" : "circle",
  }));
}
