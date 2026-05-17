import { JourneySandbox } from "./journey-sandbox";

export const metadata = {
  title: "Journey preview — RightOffer",
  robots: { index: false, follow: false },
};

/**
 * Internal design sandbox for the upload-page Journey.
 *
 * Not linked from anywhere in the customer flow. Lets us preview the
 * road-bar, every stop, and every state combination without uploading
 * a real PDF + waiting on /api/parse.
 */
export default function JourneyPreviewPage() {
  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto bg-brand-offwhite">
      <div className="mb-6">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-plum font-bold">
          · Internal preview · /preview/journey ·
        </div>
        <h1 className="mt-2 font-serif font-medium text-2xl md:text-3xl tracking-[-0.02em] text-brand-charcoal">
          Journey sandbox
        </h1>
        <p className="mt-1 font-serif italic text-sm text-brand-slate max-w-xl">
          Pick a state + vehicle, simulate parse completion, advance
          stops manually. The Journey component is mounted live below.
        </p>
      </div>

      <JourneySandbox />
    </main>
  );
}
