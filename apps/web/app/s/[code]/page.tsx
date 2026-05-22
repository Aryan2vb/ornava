import { PublicShowcaseView } from "@/components/PublicShowcaseView";

type ShortShowcasePageProps = {
  params: Promise<{
    code: string;
  }>;
};

export default async function ShortShowcasePage({ params }: ShortShowcasePageProps) {
  const { code } = await params;
  return <PublicShowcaseView showcaseId={code} />;
}
