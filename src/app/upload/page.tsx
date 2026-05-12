import { UploadFlow } from "@/components/upload-flow";

export const metadata = {
  title: "Upload Your Policy — RightOffer",
};

interface PageProps {
  searchParams: Promise<{ demo?: string }>;
}

export default async function UploadPage({ searchParams }: PageProps) {
  const { demo } = await searchParams;
  return <UploadFlow isDemo={demo === "1"} />;
}
