import type { Metadata } from "next";
import { PitchDeck } from "@/components/pitch-deck";

export const metadata: Metadata = {
  title: "RightOffer · Investor Deck",
  description: "Pre-seed + Seed pitch. Manish Chaudhari. 2025.",
};

export default function PitchPage() {
  return <PitchDeck />;
}
