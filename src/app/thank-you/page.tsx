import { ThankYouFlow } from "@/components/thank-you-flow";

export const metadata = {
  title: "Thank you — RightOffer",
};

interface PageProps {
  searchParams: Promise<{ e?: string }>;
}

export default async function ThankYouPage({ searchParams }: PageProps) {
  const { e } = await searchParams;
  return <ThankYouFlow email={e ?? ""} />;
}
